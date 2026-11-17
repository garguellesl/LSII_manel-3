import { useState } from 'react';
import { toMediaUrl } from '../utils/media';

const PALETTE = ['cyan', 'orange', 'violet', 'green', 'red', 'pink', 'blue', 'yellow'];

// Stable color per account name so the same user always gets the same avatar.
function avatarColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `var(--pt-avatar-${PALETTE[hash % PALETTE.length]})`;
}

interface UserAvatarProps {
  name: string;
  // Uploaded picture; the coloured initial is the default and the fallback if it fails to load.
  src?: string | null;
  size?: 'small' | 'large';
}

export function UserAvatar({ name, src, size = 'small' }: UserAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const className = `user-avatar user-avatar--${size}`;

  if (src && src !== failedSrc) {
    return (
      <img
        className={`${className} user-avatar--image`}
        src={toMediaUrl(src)}
        alt=""
        aria-hidden="true"
        onError={() => setFailedSrc(src)}
      />
    );
  }
  return (
    <span className={className} style={{ backgroundColor: avatarColor(name) }} aria-hidden="true">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export default UserAvatar;
