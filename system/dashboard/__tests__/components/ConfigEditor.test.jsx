import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfigEditor from '../../src/components/ConfigEditor';

// Mock the useFetchData hook
jest.mock('../../src/hooks/useFetchData');
import useFetchData from '../../src/hooks/useFetchData';

const mockConfig = {
  model: 'claude-haiku-4-5',
  defaultPersona: 'dev',
  maxTokens: 'unlimited',
  debugMode: false,
  enableLogging: true,
  allowedPaths: ['~/OliverRepo', '~/.claude'],
};

describe('ConfigEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('loaded state', () => {
    beforeEach(() => {
      useFetchData.mockReturnValue({
        data: mockConfig,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('renders the "Configuration" heading', () => {
      render(<ConfigEditor />);
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    it('displays fields from the API response dynamically', () => {
      render(<ConfigEditor />);
      // All field names from mockConfig should be visible
      expect(screen.getByText('model')).toBeInTheDocument();
      expect(screen.getByText('defaultPersona')).toBeInTheDocument();
      expect(screen.getByText('maxTokens')).toBeInTheDocument();
      expect(screen.getByText('debugMode')).toBeInTheDocument();
      expect(screen.getByText('enableLogging')).toBeInTheDocument();
      expect(screen.getByText('allowedPaths')).toBeInTheDocument();
    });

    it('shows a text input when editing a string field', () => {
      render(<ConfigEditor />);
      // Click edit on a string field — model is a string
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));
      // There should be a text input for the string value
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('shows a checkbox when editing a boolean field', () => {
      render(<ConfigEditor />);
      // Enter edit mode
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));
      // debugMode is boolean → should be a checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('cannot blank a required field — shows inline validation error', async () => {
      render(<ConfigEditor />);
      // Enter edit mode
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      // Find the text input for 'model' (non-empty string → required)
      // The model field input should be present; clear it
      const modelInput = screen.getByDisplayValue('claude-haiku-4-5');
      fireEvent.change(modelInput, { target: { value: '' } });

      // Try to save — should surface validation error instead of dialog
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });

    it('clicking Save opens ConfirmDialog showing the diff', async () => {
      render(<ConfigEditor />);
      // Enter edit mode
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      // Change the model field value
      const modelInput = screen.getByDisplayValue('claude-haiku-4-5');
      fireEvent.change(modelInput, { target: { value: 'claude-sonnet-4-5' } });

      // Click Save
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      // ConfirmDialog should appear showing the diff
      await waitFor(() => {
        expect(screen.getByText(/claude-haiku-4-5/)).toBeInTheDocument();
        expect(screen.getByText(/claude-sonnet-4-5/)).toBeInTheDocument();
      });

      // Confirm button should be present in the dialog
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });

    it('confirming the dialog POSTs to /api/config', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<ConfigEditor />);
      // Enter edit mode
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      // Change a field
      const modelInput = screen.getByDisplayValue('claude-haiku-4-5');
      fireEvent.change(modelInput, { target: { value: 'claude-sonnet-4-5' } });

      // Click Save to open confirm dialog
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      // Confirm
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/config',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('claude-sonnet-4-5'),
          })
        );
      });
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

    it('shows skeleton elements and no fields while loading', () => {
      const { container } = render(<ConfigEditor />);
      const skeletons = container.querySelectorAll('.skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
      // No real fields should appear
      expect(screen.queryByText('model')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    beforeEach(() => {
      useFetchData.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('shows empty message and no form when data is null', () => {
      render(<ConfigEditor />);
      expect(screen.getByText(/no configuration data available/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });
  });

  describe('no icons rendered', () => {
    beforeEach(() => {
      useFetchData.mockReturnValue({
        data: mockConfig,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('renders no svg or img elements', () => {
      const { container } = render(<ConfigEditor />);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
      expect(container.querySelector('img')).not.toBeInTheDocument();
    });
  });
});
