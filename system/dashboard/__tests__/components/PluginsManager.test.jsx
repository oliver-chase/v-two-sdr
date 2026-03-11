import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock useFetchData hook
jest.mock('../../src/hooks/useFetchData', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock filterHelpers
jest.mock('../../src/utils/filterHelpers', () => ({
  __esModule: true,
  fuzzySearch: jest.fn((items, query, fields) => {
    if (!query) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
      fields.some(field => {
        const value = item[field]?.toString().toLowerCase() || '';
        return value.includes(lowerQuery);
      })
    );
  }),
}));

import useFetchData from '../../src/hooks/useFetchData';
import { fuzzySearch } from '../../src/utils/filterHelpers';
import PluginsManager from '../../src/components/PluginsManager';

const mockPlugins = [
  { name: 'git-tools', version: '1.2.0', enabled: true },
  { name: 'code-review', version: '2.0.1', enabled: false },
  { name: 'auto-format', version: '0.9.5', enabled: true },
];

describe('PluginsManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('loaded state', () => {
    beforeEach(() => {
      useFetchData.mockReturnValue({
        data: mockPlugins,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('renders "Plugins" heading', () => {
      render(<PluginsManager />);
      expect(screen.getByText('Plugins')).toBeInTheDocument();
    });

    it('displays plugin name, version, and status badge for each plugin', () => {
      render(<PluginsManager />);
      expect(screen.getByText('git-tools')).toBeInTheDocument();
      expect(screen.getByText('1.2.0')).toBeInTheDocument();
      expect(screen.getByText('code-review')).toBeInTheDocument();
      expect(screen.getByText('2.0.1')).toBeInTheDocument();
      expect(screen.getByText('auto-format')).toBeInTheDocument();
      expect(screen.getByText('0.9.5')).toBeInTheDocument();
    });

    it('status badge text is "ACTIVE" for enabled plugin, "PAUSED" for disabled', () => {
      render(<PluginsManager />);
      const activeBadges = screen.getAllByText('ACTIVE');
      const pausedBadges = screen.getAllByText('PAUSED');
      // git-tools and auto-format are enabled (2 ACTIVE), code-review is disabled (1 PAUSED)
      expect(activeBadges).toHaveLength(2);
      expect(pausedBadges).toHaveLength(1);
    });

    it('status badge has correct class: badge-active for enabled, badge-paused for disabled', () => {
      const { container } = render(<PluginsManager />);
      const activeBadges = container.querySelectorAll('.badge-active');
      const pausedBadges = container.querySelectorAll('.badge-paused');
      expect(activeBadges).toHaveLength(2);
      expect(pausedBadges).toHaveLength(1);
    });

    it('toggle button is labeled "Disable" for active, "Enable" for inactive', () => {
      render(<PluginsManager />);
      const disableButtons = screen.getAllByText('Disable');
      const enableButtons = screen.getAllByText('Enable');
      // 2 active plugins → 2 "Disable", 1 inactive → 1 "Enable"
      expect(disableButtons).toHaveLength(2);
      expect(enableButtons).toHaveLength(1);
    });

    it('clicking toggle optimistically updates status immediately', async () => {
      global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

      render(<PluginsManager />);

      // code-review is PAUSED, clicking Enable should show ACTIVE immediately
      const enableButton = screen.getByRole('button', { name: /enable code-review/i });
      fireEvent.click(enableButton);

      // Optimistic update: should now show ACTIVE for code-review
      await waitFor(() => {
        const rows = screen.getAllByText('ACTIVE');
        expect(rows).toHaveLength(3); // was 2, now 3
      });
    });

    it('on toggle POST failure: rolls back to original status', async () => {
      global.fetch.mockResolvedValue({ ok: false, status: 500 });

      render(<PluginsManager />);

      // code-review is PAUSED, clicking Enable
      const enableButton = screen.getByRole('button', { name: /enable code-review/i });
      fireEvent.click(enableButton);

      // Wait for rollback after fetch failure
      await waitFor(() => {
        const pausedBadges = screen.getAllByText('PAUSED');
        expect(pausedBadges).toHaveLength(1); // rolled back
      });
    });

    it('SearchInput filters visible plugins using fuzzySearch', async () => {
      render(<PluginsManager />);

      const searchInput = screen.getByRole('textbox');
      fireEvent.change(searchInput, { target: { value: 'git' } });

      // fuzzySearch mock is set to filter by name; only 'git-tools' should show
      await waitFor(() => {
        expect(screen.getByText('git-tools')).toBeInTheDocument();
        expect(screen.queryByText('code-review')).not.toBeInTheDocument();
        expect(screen.queryByText('auto-format')).not.toBeInTheDocument();
      });
    });

    it('"Disable All" shows ConfirmDialog before proceeding', async () => {
      global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

      render(<PluginsManager />);

      const disableAllButton = screen.getByRole('button', { name: /disable all/i });
      fireEvent.click(disableAllButton);

      // ConfirmDialog should appear — title + message both match the regex, use getAllByText
      await waitFor(() => {
        const matches = screen.getAllByText(/disable all plugins/i);
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('no icons rendered (no svg, no img)', () => {
      const { container } = render(<PluginsManager />);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
      expect(container.querySelector('img')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    beforeEach(() => {
      useFetchData.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('shows skeleton rows when loading', () => {
      const { container } = render(<PluginsManager />);
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render plugin list while loading', () => {
      render(<PluginsManager />);
      expect(screen.queryByText('git-tools')).not.toBeInTheDocument();
      expect(screen.queryByText('ACTIVE')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    beforeEach(() => {
      useFetchData.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('shows empty message text when no plugins', () => {
      render(<PluginsManager />);
      expect(screen.getByText('No plugins installed.')).toBeInTheDocument();
    });

    it('does not render plugin rows in empty state', () => {
      const { container } = render(<PluginsManager />);
      expect(container.querySelector('.plugin-row')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows ErrorBanner when fetch fails', () => {
      useFetchData.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Failed to load'),
        refetch: jest.fn(),
      });

      render(<PluginsManager />);
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
