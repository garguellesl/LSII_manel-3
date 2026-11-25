import { fireEvent, render, screen } from '@testing-library/react';
import { ConfirmDialog } from '../ConfirmDialog';

function renderDialog(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  const props = {
    open: true,
    title: 'Delete this video?',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    onConfirm,
    onCancel,
    ...overrides,
  };
  const view = render(<ConfirmDialog {...props} />);
  return { view, onConfirm, onCancel, props };
}

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Delete this video?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders as an accessible dialog with focus on Cancel', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('calls onConfirm and onCancel when their buttons are clicked', () => {
    const { onConfirm, onCancel } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape when not busy', () => {
    const { onCancel } = renderDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape while a request is in flight', () => {
    const { onCancel } = renderDialog({ busy: true });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('disables both buttons and shows the busy label while busy', () => {
    renderDialog({ busy: true, busyLabel: 'Deleting…' });
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
  });

  it('returns focus to Cancel once a request finishes and the dialog stays open', () => {
    const { view } = renderDialog({ busy: true, busyLabel: 'Deleting…', error: 'Could not delete the video.' });
    view.rerender(
      <ConfirmDialog
        open
        title="Delete this video?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        busy={false}
        error="Could not delete the video."
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('shows an inline error and keeps the dialog open', () => {
    renderDialog({ error: 'Could not delete the video.' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not delete the video.');
  });

  it('traps Tab from Confirm back to Cancel', () => {
    renderDialog();
    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    confirmButton.focus();
    expect(confirmButton).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(cancelButton).toHaveFocus();
  });

  it('traps Shift+Tab from Cancel to Confirm', () => {
    renderDialog();
    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(confirmButton).toHaveFocus();
  });
});
