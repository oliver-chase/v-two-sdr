import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AuditTrail from '../../src/components/AuditTrail';

// Mock useFetchData hook
jest.mock('../../src/hooks/useFetchData', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import useFetchData from '../../src/hooks/useFetchData';

// 60 entries so we can test pagination (50 per page → 2 pages)
const makeEntries = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `entry-${i}`,
    timestamp: new Date(`2026-03-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z`).toISOString(),
    description: `Changed config-${i}`,
    changeType: i % 4 === 0 ? 'Plugin' : i % 4 === 1 ? 'Skill' : i % 4 === 2 ? 'Config' : 'Config',
    oldValue: `old-${i}`,
    newValue: `new-${i}`,
    actor: `agent-${i % 3}`,
  }));

const MOCK_ENTRIES = makeEntries(60);

describe('AuditTrail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: loaded state with 60 entries
    useFetchData.mockReturnValue({
      data: { entries: MOCK_ENTRIES },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  // 1. Renders heading
  it('renders "Audit Log" heading', () => {
    render(<AuditTrail />);
    expect(screen.getByText('Audit Log')).toBeInTheDocument();
  });

  // 2. Shows each entry's timestamp, description, actor (first page = entries 0-49)
  it('shows entry timestamp, change description, and actor', () => {
    render(<AuditTrail />);
    // Entry 0 is on page 1 — description is unique
    expect(screen.getByText('Changed config-0')).toBeInTheDocument();
    // Multiple entries share agent-0; use getAllByText
    const agentCells = screen.getAllByText('agent-0');
    expect(agentCells.length).toBeGreaterThan(0);
    // Timestamp should be rendered as a local string (toLocaleString produces non-empty output)
    const tsCell = screen.getAllByTestId('entry-timestamp')[0];
    expect(tsCell.textContent).not.toBe('');
  });

  // 3. Date range filter removes entries outside range
  it('date range filter removes entries outside range', () => {
    // Compute the local date string for entry 0's timestamp so the test is TZ-agnostic
    const entry0Ts = new Date(MOCK_ENTRIES[0].timestamp);
    const localDateStr = [
      entry0Ts.getFullYear(),
      String(entry0Ts.getMonth() + 1).padStart(2, '0'),
      String(entry0Ts.getDate()).padStart(2, '0'),
    ].join('-');

    // Compute the local date string for entry 1 (different day)
    const entry1Ts = new Date(MOCK_ENTRIES[1].timestamp);
    const entry1DateStr = [
      entry1Ts.getFullYear(),
      String(entry1Ts.getMonth() + 1).padStart(2, '0'),
      String(entry1Ts.getDate()).padStart(2, '0'),
    ].join('-');

    render(<AuditTrail />);

    const fromInput = screen.getByLabelText('From date');
    const toInput = screen.getByLabelText('To date');

    // Only show entry 0's date
    fireEvent.change(fromInput, { target: { value: localDateStr } });
    fireEvent.change(toInput, { target: { value: localDateStr } });

    // Entries on entry0's date should be visible; entry1's date (if different) should not
    const rows = screen.getAllByTestId('audit-row');
    expect(rows.length).toBeLessThan(60);

    if (localDateStr !== entry1DateStr) {
      // entry-1's description should not appear
      expect(screen.queryByText('Changed config-1')).not.toBeInTheDocument();
    }
  });

  // 4. Type filter shows only matching entries
  it('type filter shows only matching entries', () => {
    render(<AuditTrail />);

    const typeSelect = screen.getByLabelText('Change type');
    fireEvent.change(typeSelect, { target: { value: 'Plugin' } });

    // All visible rows should have changeType === 'Plugin'
    const rows = screen.getAllByTestId('audit-row');
    rows.forEach((row) => {
      expect(within(row).getByTestId('entry-type').textContent).toBe('Plugin');
    });
  });

  // 5. CSV export triggers download
  it('CSV export button triggers download via URL.createObjectURL', () => {
    const mockObjectURL = 'blob:http://localhost/fake-url';
    const createObjectURL = jest.fn(() => mockObjectURL);
    const revokeObjectURL = jest.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    // Intercept anchor appended to body and its click
    const clickMock = jest.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        jest.spyOn(el, 'click').mockImplementation(clickMock);
      }
      return el;
    });

    render(<AuditTrail />);
    const exportBtn = screen.getByText('Export CSV');
    fireEvent.click(exportBtn);

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickMock).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  // 6. Pagination: next/prev page, page indicator
  it('shows page 1 of 2 indicator and navigates pages', () => {
    render(<AuditTrail />);

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

    // Page 1: entries 0-49 visible, entry 50 not visible
    expect(screen.getByText('Changed config-0')).toBeInTheDocument();
    expect(screen.queryByText('Changed config-50')).not.toBeInTheDocument();

    // Go to next page
    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn);

    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('Changed config-50')).toBeInTheDocument();
    expect(screen.queryByText('Changed config-0')).not.toBeInTheDocument();

    // Go back to previous page
    const prevBtn = screen.getByText('Prev');
    fireEvent.click(prevBtn);

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Changed config-0')).toBeInTheDocument();
  });

  // 6b. Next button disabled on last page, Prev disabled on first page
  it('Prev is disabled on first page and Next is disabled on last page', () => {
    render(<AuditTrail />);

    expect(screen.getByText('Prev')).toBeDisabled();
    expect(screen.getByText('Next')).not.toBeDisabled();

    fireEvent.click(screen.getByText('Next'));

    expect(screen.getByText('Prev')).not.toBeDisabled();
    expect(screen.getByText('Next')).toBeDisabled();
  });

  // 7. Loading state: skeleton rows, no real content
  it('shows skeleton rows in loading state and no real content', () => {
    useFetchData.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    const { container } = render(<AuditTrail />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.queryByTestId('audit-row')).not.toBeInTheDocument();
  });

  // 8. Empty state: shows empty message, no table
  it('shows empty message and no table when data is empty', () => {
    useFetchData.mockReturnValue({
      data: { entries: [] },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { container } = render(<AuditTrail />);
    expect(
      screen.getByText('No audit log entries for this period.')
    ).toBeInTheDocument();
    expect(container.querySelector('table')).not.toBeInTheDocument();
  });

  // 9. No icons rendered (no svg, no img)
  it('renders no svg or img elements', () => {
    const { container } = render(<AuditTrail />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  // 10. Timestamps shown in local timezone via toLocaleString
  it('renders timestamps using toLocaleString (local timezone)', () => {
    const fixedTs = '2026-03-10T15:00:00Z';
    const expectedLocal = new Date(fixedTs).toLocaleString();

    useFetchData.mockReturnValue({
      data: {
        entries: [
          {
            id: 'ts-test',
            timestamp: fixedTs,
            description: 'Single entry',
            changeType: 'Config',
            oldValue: 'a',
            newValue: 'b',
            actor: 'agent-x',
          },
        ],
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AuditTrail />);
    const tsCell = screen.getByTestId('entry-timestamp');
    expect(tsCell.textContent).toBe(expectedLocal);
  });
});
