import { toMediaUrl } from '../media';

describe('toMediaUrl', () => {
  it('prefixes backend media paths with the media base URL', () => {
    expect(toMediaUrl('/media/1.mp4')).toBe('development/1.mp4');
  });

  it('returns other paths unchanged', () => {
    expect(toMediaUrl('https://cdn.example.com/1.mp4')).toBe('https://cdn.example.com/1.mp4');
  });
});
