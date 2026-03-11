import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchInput from '../../src/components/Shared/SearchInput';

describe('SearchInput Component', () => {
  it('should render input with placeholder', () => {
    render(<SearchInput placeholder="Search skills..." value="" onChange={() => {}} />);
    const input = screen.getByPlaceholderText('Search skills...');
    expect(input).toBeInTheDocument();
  });

  it('should call onChange with debounce (delayed 100ms)', async () => {
    const handleChange = jest.fn();
    const { rerender } = render(
      <SearchInput placeholder="Search..." value="" onChange={handleChange} debounceMs={100} />
    );

    const input = screen.getByPlaceholderText('Search...');
    await userEvent.type(input, 'test');

    // Should NOT be called immediately
    expect(handleChange).not.toHaveBeenCalled();

    // Wait for debounce delay
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith('test');
    }, { timeout: 200 });
  });

  it('should show clear button when has value', () => {
    const { rerender } = render(
      <SearchInput placeholder="Search..." value="" onChange={() => {}} />
    );
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();

    rerender(
      <SearchInput placeholder="Search..." value="test" onChange={() => {}} />
    );
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('should clear value on button click', async () => {
    const handleChange = jest.fn();
    render(
      <SearchInput placeholder="Search..." value="test" onChange={handleChange} />
    );

    const clearBtn = screen.getByLabelText('Clear search');
    fireEvent.click(clearBtn);

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('should be disabled when loading', () => {
    const { rerender } = render(
      <SearchInput placeholder="Search..." value="" onChange={() => {}} loading={false} />
    );
    let input = screen.getByPlaceholderText('Search...');
    expect(input).not.toBeDisabled();

    rerender(
      <SearchInput placeholder="Search..." value="" onChange={() => {}} loading={true} />
    );
    input = screen.getByPlaceholderText('Search...');
    expect(input).toBeDisabled();
  });
});
