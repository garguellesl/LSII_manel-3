import { localizeMessage, t, useLocale, formatNumber } from '../i18n/locale';
import { useId, useState } from 'react';
import type { FormEvent } from 'react';

type Props = {
  label: string;
  submitLabel: string;
  initialText?: string;
  pending: boolean;
  onSubmit: (text: string) => Promise<boolean>;
  onCancel?: () => void;
};

export function CommentForm({ label, submitLabel, initialText = '', pending, onSubmit, onCancel }: Props) {
  useLocale();
  const id = useId();
  const [text, setText] = useState(initialText);
  const [validation, setValidation] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || text.length > 2000) {
      setValidation(t('comments.enterACommentBetween1And2000Characters'));
      return;
    }
    setValidation('');
    if (await onSubmit(text)) setText('');
  }

  return (
    <form className="comment-form" onSubmit={(event) => void submit(event)}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        value={text}
        maxLength={2000}
        rows={3}
        disabled={pending}
        aria-describedby={`${id}-count${validation ? ` ${id}-error` : ''}`}
        aria-invalid={Boolean(validation)}
        onChange={(event) => setText(event.target.value)}
      />
      <small id={`${id}-count`}>
        {formatNumber(text.length)}/{formatNumber(2000)}
      </small>
      {validation && (
        <p id={`${id}-error`} role="alert">
          {localizeMessage(validation)}
        </p>
      )}
      <div className="comment-actions">
        <button type="submit" disabled={pending}>
          {pending ? t('comments.saving') : submitLabel}
        </button>
        {onCancel && (
          <button type="button" disabled={pending} onClick={onCancel}>
            {' '}
            {t('comments.cancel')}{' '}
          </button>
        )}
      </div>
    </form>
  );
}
