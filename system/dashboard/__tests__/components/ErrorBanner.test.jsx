import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBanner from '../../src/components/Shared/ErrorBanner';

describe('ErrorBanner Component', () => {
  it('should render error message', () => {
    render(
      <ErrorBanner message="Something went wrong!" onDismiss={() => {}} />
    );
    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
  });

  it('should show retry button if onRetry provided', () => {
    const { rerender } = render(
      <ErrorBanner message="Error" onDismiss={() => {}} />
    );
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();

    rerender(
      <ErrorBanner message="Error" onDismiss={() => {}} onRetry={() => {}} />
    );
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should call onRetry when retry clicked', () => {
    const handleRetry = jest.fn();
    render(
      <ErrorBanner
        message="Error occurred"
        onDismiss={() => {}}
        onRetry={handleRetry}
      />
    );

    fireEvent.click(screen.getByText('Retry'));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('should dismiss when close clicked', () => {
    const handleDismiss = jest.fn();
    render(
      <ErrorBanner
        message="Error occurred"
        onDismiss={handleDismiss}
      />
    );

    const dismissBtn = screen.getByLabelText('Dismiss error');
    fireEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
