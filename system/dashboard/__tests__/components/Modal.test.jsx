import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../../src/components/Shared/Modal';

describe('Modal Component', () => {
  it('should render when isOpen=true, hidden when false', () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should call onClose when overlay clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    const overlay = screen.getByRole('dialog').closest('.modal-overlay');
    fireEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when ESC pressed', async () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should focus first focusable element on open', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <button>Action Button</button>
      </Modal>
    );

    const button = screen.getByText('Action Button');
    // Wait for the focus effect to run
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
    expect(document.activeElement).toBe(button);
  });

  it('should have ARIA attributes (role, aria-labelledby)', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Modal content</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('role', 'dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');

    const titleElement = document.getElementById(
      dialog.getAttribute('aria-labelledby')
    );
    expect(titleElement).toHaveTextContent('Test Modal');
  });
});
