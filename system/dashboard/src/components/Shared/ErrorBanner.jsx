import React from 'react';
import '../Shared/ErrorBanner.css';

const ErrorBanner = ({ message, onDismiss, onRetry }) => {
  return (
    <div className="error-banner" role="alert">
      <div className="error-banner-content">
        <p className="error-message">{message}</p>
      </div>
      <div className="error-banner-actions">
        {onRetry && (
          <button
            className="btn error-retry"
            onClick={onRetry}
            title="Retry the operation"
          >
            Retry
          </button>
        )}
        <button
          className="error-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
          title="Dismiss error"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default ErrorBanner;
