import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../../src/components/Shared/ConfirmDialog';

describe('ConfirmDialog Component', () => {
  it('should render title and message', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button clicked', () => {
    const handleConfirm = jest.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Action"
        message="Proceed?"
        onConfirm={handleConfirm}
        onCancel={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Confirm'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button clicked', () => {
    const handleCancel = jest.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Action"
        message="Proceed?"
        onConfirm={() => {}}
        onCancel={handleCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('should apply danger styling when isDangerous=true', () => {
    const { rerender } = render(
      <ConfirmDialog
        isOpen={true}
        title="Delete"
        message="Proceed?"
        isDangerous={false}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    let confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn).not.toHaveClass('btn-danger');

    rerender(
      <ConfirmDialog
        isOpen={true}
        title="Delete"
        message="Proceed?"
        isDangerous={true}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn).toHaveClass('btn-danger');
  });

  it('should allow custom button text', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Action"
        message="Delete this item?"
        confirmText="Delete"
        cancelText="Keep"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    // Check for custom button text
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();

    // Verify default button text is not present
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });
});
