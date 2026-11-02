import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useUpdateVideoTags } from '../useUpdateVideoTags';

const MAX_TAGS = 40;

type VideoTagEditorProps = {
  videoId: number;
  tags: string[];
  editable: boolean;
  onTagsSaved: (tags: string[]) => void;
};

export function VideoTagEditor({ videoId, tags, editable, onTagsSaved }: VideoTagEditorProps) {
  const { save, pending, errors } = useUpdateVideoTags(videoId);
  const [draft, setDraft] = useState('');
  const [limitMessage, setLimitMessage] = useState('');

  if (!editable && tags.length === 0) {
    return null;
  }

  const addTag = async (rawValue: string) => {
    const value = rawValue.trim();
    if (!value) {
      setDraft('');
      return;
    }
    if (tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
      setDraft('');
      setLimitMessage('');
      return;
    }
    if (tags.length >= MAX_TAGS) {
      setLimitMessage(`You can have at most ${MAX_TAGS} tags.`);
      return;
    }
    setLimitMessage('');
    try {
      const result = await save([...tags, value]);
      setDraft('');
      onTagsSaved(result.tags);
    } catch {
      // Keep the draft text in place so the backend's error renders next to the tag that caused it.
    }
  };

  const removeTag = async (tag: string) => {
    try {
      const result = await save(tags.filter((existing) => existing !== tag));
      onTagsSaved(result.tags);
    } catch {
      // errors.general is rendered below.
    }
  };

  const onInputChange = (nextValue: string) => {
    if (nextValue.endsWith(',')) {
      const candidate = nextValue.slice(0, -1);
      setDraft(candidate);
      void addTag(candidate);
      return;
    }
    setDraft(nextValue);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void addTag(draft);
    }
  };

  const addedTagIndex = tags.length;

  return (
    <div className="video-tags" aria-busy={pending}>
      {tags.length > 0 && (
        <ul className="video-tags-list">
          {tags.map((tag) => (
            <li key={tag} className="video-tag-chip">
              {tag}
              {editable && (
                <button
                  type="button"
                  aria-label={`Remove tag ${tag}`}
                  disabled={pending}
                  onClick={() => void removeTag(tag)}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editable && (
        <div className="video-tags-editor">
          <label htmlFor={`video-tag-input-${videoId}`}>Add a tag</label>
          <input
            id={`video-tag-input-${videoId}`}
            type="text"
            value={draft}
            disabled={pending}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onKeyDown}
            aria-describedby={`video-tags-count-${videoId}`}
          />
          <span id={`video-tags-count-${videoId}`}>
            {tags.length}/{MAX_TAGS} tags
          </span>
          {pending && <span role="status">Saving…</span>}
          {limitMessage && <p role="alert">{limitMessage}</p>}
          {errors.perTag[addedTagIndex] && <small className="video-tag-error">{errors.perTag[addedTagIndex]}</small>}
          {errors.general && <p role="alert">{errors.general}</p>}
        </div>
      )}
    </div>
  );
}

export default VideoTagEditor;
