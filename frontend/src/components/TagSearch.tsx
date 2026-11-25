import { t, useLocale } from '../i18n/locale';
import { useEffect, useId, useRef, useState } from 'react';
import { useAvailableTags } from '../useAvailableTags';

type TagSearchProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export function TagSearch({ tags, onChange }: TagSearchProps) {
  useLocale();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <div className="tag-search" ref={root}>
      <button ref={trigger} type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        {' '}
        {t('catalogue.tags')}
        {tags.length > 0 ? ` (${tags.length})` : ''}
      </button>
      {open && <TagPanel id={panelId} tags={tags} onChange={onChange} />}
    </div>
  );
}

function TagPanel({ id, tags, onChange }: TagSearchProps & { id: string }) {
  useLocale();
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const { loading, error, tags: available, reload } = useAvailableTags(true);
  const options = [...available]
    .sort((a, b) => a.localeCompare(b))
    .filter((tag) => tag.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    input.current?.focus();
  }, []);

  return (
    <section id={id} className="tag-panel" aria-label={t('catalogue.tagFilters')}>
      <label htmlFor={`${id}-search`}>{t('catalogue.findATag')}</label>
      <input
        ref={input}
        id={`${id}-search`}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <small>{t('catalogue.matchesAnySelectedTagVideosMatchingMoreTagsAppearFirst')}</small>
      {loading ? (
        <p role="status">{t('catalogue.loadingTags')}</p>
      ) : error ? (
        <div>
          <p role="alert">{t('catalogue.unableToLoadTags')}</p>
          <button type="button" onClick={reload}>
            {' '}
            {t('catalogue.retryTags')}{' '}
          </button>
        </div>
      ) : available.length === 0 ? (
        <p role="status">{t('catalogue.noTagsAreAvailable')}</p>
      ) : options.length === 0 ? (
        <p role="status">{t('catalogue.noTagsMatchYourSearch')}</p>
      ) : (
        <ul className="tag-options">
          {options.map((tag) => (
            <li key={tag}>
              <label>
                <input
                  type="checkbox"
                  checked={tags.includes(tag)}
                  disabled={tags.length >= 40 && !tags.includes(tag)}
                  onChange={() => onChange(tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag])}
                />
                {tag}
              </label>
            </li>
          ))}
        </ul>
      )}
      {tags.length >= 40 && <p role="status">{t('catalogue.useAtMost40TagFilters')}</p>}
      <button type="button" disabled={tags.length === 0} onClick={() => onChange([])}>
        {' '}
        {t('catalogue.clearTagFilters')}{' '}
      </button>
    </section>
  );
}
