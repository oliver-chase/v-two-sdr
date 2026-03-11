import React from 'react';
import '../Shared/LoadingState.css';

const LoadingState = ({ message = null }) => {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-spinner" />
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingState;
