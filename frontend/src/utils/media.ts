import { getEnv } from './Env';

const MEDIA_PREFIX = '/media/';

export function toMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return path.startsWith(MEDIA_PREFIX) ? `${getEnv().MEDIA_BASE_URL}/${path.slice(MEDIA_PREFIX.length)}` : path;
}
