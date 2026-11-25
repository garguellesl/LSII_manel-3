import { readSearchCriteria, writeSearchCriteria } from '../searchCriteria';

describe('catalogue URL criteria', () => {
  it('round trips text, repeated tags, audience, sort and page', () => {
    const criteria = {
      query: 'rock & pop',
      tags: ['rock', 'pop'],
      audience: 'CHILDREN' as const,
      sort: 'likes' as const,
      page: 2,
    };
    expect(readSearchCriteria(writeSearchCriteria(criteria))).toEqual(criteria);
    expect(writeSearchCriteria(readSearchCriteria(''))).toBe('');
  });

  it.each(['-1', '1.5', 'Infinity', 'NaN', '9999999999999'])('rejects invalid page %s and unknown choices', (page) => {
    expect(readSearchCriteria(`?page=${page}&sort=unknown&audience=unknown&tag=ROCK&tag=rock&tag=%20`)).toEqual({
      query: '',
      tags: ['rock'],
      sort: 'relevance',
      audience: 'ALL',
      page: 0,
    });
  });
});
