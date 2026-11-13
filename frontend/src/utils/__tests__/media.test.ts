import { toMediaUrl } from '../media';

describe('toMediaUrl', () => {
  it('handles an absent optional thumbnail', () => {
    expect(toMediaUrl(null)).toBeUndefined();
    expect(toMediaUrl(undefined)).toBeUndefined();
  });
  it('prefixes backend media paths with the media base URL', () => {
    expect(toMediaUrl('/media/1.mp4')).toBe('development/1.mp4');
  });

  it('returns other paths unchanged', () => {
    expect(toMediaUrl('https://cdn.example.com/1.mp4')).toBe('https://cdn.example.com/1.mp4');
  });
});
