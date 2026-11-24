import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  busyLabel?: string;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// Controlled, inline confirmation dialog (no portal). Returning focus to whatever
// triggered it is the caller's responsibility, same division of labor as TagSearch.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  busy = false,
  busyLabel,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Covers both the initial open (focus starts on Cancel) and a request that just
    // finished (buttons were disabled while busy, so focus had nowhere to live).
    if (open && !busy) cancelRef.current?.focus();
  }, [open, busy]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // A request is in flight: closing now would abandon it silently.
        if (busy) return;
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key === 'Tab') {
        // Cancel and Confirm are the only focusable elements in this dialog (aria-modal="true"
        // requires trapping focus); cycle between them instead of leaving the dialog.
        const first = cancelRef.current;
        const last = confirmRef.current;
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <h2 id={titleId} className="confirm-dialog-title">
        {title}
      </h2>
      {description && <p id={descriptionId}>{description}</p>}
      {error && (
        <p role="alert" className="confirm-dialog-error">
          {error}
        </p>
      )}
      <div className="confirm-dialog-actions">
        <button ref={cancelRef} type="button" disabled={busy} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button ref={confirmRef} type="button" disabled={busy} onClick={onConfirm}>
          {busy && busyLabel ? busyLabel : confirmLabel}
        </button>
      </div>
    </div>
  );
}

export default ConfirmDialog;
