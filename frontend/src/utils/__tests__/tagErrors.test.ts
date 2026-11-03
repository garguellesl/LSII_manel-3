import { parseTagErrors } from '../tagErrors';

describe('parseTagErrors', () => {
  it('maps indexed tag keys to their position', () => {
    expect(
      parseTagErrors({ 'tags[0]': 'tag must not be blank', 'tags[12]': 'tag must be at most 80 characters' })
    ).toEqual({
      perTag: { 0: 'tag must not be blank', 12: 'tag must be at most 80 characters' },
    });
  });

  it('maps a bare "tags" key to a general message', () => {
    expect(parseTagErrors({ tags: 'must not contain more than 40 distinct tags' })).toEqual({
      general: 'must not contain more than 40 distinct tags',
      perTag: {},
    });
  });

  it('ignores unrelated keys', () => {
    expect(parseTagErrors({ title: 'too long' })).toEqual({ perTag: {} });
  });

  it('returns an empty result for an empty map', () => {
    expect(parseTagErrors({})).toEqual({ perTag: {} });
  });
});
