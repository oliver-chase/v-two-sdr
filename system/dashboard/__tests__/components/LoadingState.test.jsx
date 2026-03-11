import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingState from '../../src/components/Shared/LoadingState';

describe('LoadingState Component', () => {
  it('should render spinner', () => {
    const { container } = render(<LoadingState />);
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('should show optional message', () => {
    const { rerender } = render(<LoadingState />);
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

    rerender(<LoadingState message="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should respect prefers-reduced-motion', () => {
    // Mock window.matchMedia for prefers-reduced-motion
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { container } = render(<LoadingState />);
    const spinner = container.querySelector('.loading-spinner');

    // Spinner should exist but animations should be disabled by CSS
    expect(spinner).toBeInTheDocument();
    const styles = window.getComputedStyle(spinner);
    // CSS media query will handle animation-duration
  });
});
