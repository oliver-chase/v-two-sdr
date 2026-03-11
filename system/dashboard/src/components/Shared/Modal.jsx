import React, { useRef, useEffect } from 'react';
import '../Shared/Modal.css';

const Modal = ({ isOpen, onClose, title, children }) => {
  const dialogRef = useRef(null);
  const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;

  // Handle ESC key and focus management
  useEffect(() => {
    if (!isOpen) return;

    // Focus first focusable element in modal
    const focusElement = () => {
      if (dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    };

    // Use requestAnimationFrame for reliable focus in tests
    requestAnimationFrame(focusElement);

    // Handle ESC key
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (event) => {
    // Only close if clicking directly on the overlay, not the dialog
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        ref={dialogRef}
        className="modal-dialog"
        role="dialog"
        aria-labelledby={titleId}
      >
        {title && (
          <h2 id={titleId} className="modal-title">
            {title}
          </h2>
        )}
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
