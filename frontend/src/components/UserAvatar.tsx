const PALETTE = ['#61dafb', '#f6ad55', '#9f7aea', '#68d391', '#fc8181', '#f687b3', '#63b3ed', '#fbd38d'];

// Stable color per account name so the same user always gets the same avatar.
function avatarColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

interface UserAvatarProps {
  name: string;
  size?: 'small' | 'large';
}

export function UserAvatar({ name, size = 'small' }: UserAvatarProps) {
  return (
    <span
      className={`user-avatar user-avatar--${size}`}
      style={{ backgroundColor: avatarColor(name) }}
      aria-hidden="true"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export default UserAvatar;
