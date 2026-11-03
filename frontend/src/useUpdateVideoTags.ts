import { useState } from 'react';
import { AuthError } from './utils/authClient';
import { videoClient } from './utils/videoClient';
import { parseTagErrors } from './utils/tagErrors';
import type { TagsUpdateErrors } from './utils/tagErrors';
import type { VideoDetail } from './useVideo';

const NO_ERRORS: TagsUpdateErrors = { perTag: {} };

export function useUpdateVideoTags(videoId: number) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<TagsUpdateErrors>(NO_ERRORS);

  async function save(tags: string[]): Promise<VideoDetail> {
    setPending(true);
    setErrors(NO_ERRORS);
    try {
      return await videoClient.updateTags(videoId, tags);
    } catch (failure) {
      if (failure instanceof AuthError && failure.status === 400 && Object.keys(failure.fields).length > 0) {
        setErrors(parseTagErrors(failure.fields));
      } else {
        setErrors({
          general: failure instanceof AuthError ? failure.message : 'Network error, please try again.',
          perTag: {},
        });
      }
      throw failure;
    } finally {
      setPending(false);
    }
  }

  return { save, pending, errors, clearErrors: () => setErrors(NO_ERRORS) };
}
