export type SearchSort = 'relevance' | 'likes' | 'views';
export type Audience = 'ALL' | 'CHILDREN';
export type SearchCriteria = { query: string; tags: string[]; sort: SearchSort; audience: Audience; page: number };

export function readSearchCriteria(search: string): SearchCriteria {
  const params = new URLSearchParams(search);
  const sort = params.get('sort');
  const audience = params.get('audience');
  const page = Number(params.get('page') ?? 0);
  return {
    query: params.get('q') ?? '',
    tags: [
      ...new Set(
        params
          .getAll('tag')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean)
      ),
    ],
    sort: sort === 'likes' || sort === 'views' ? sort : 'relevance',
    audience: audience === 'CHILDREN' ? audience : 'ALL',
    page: Number.isSafeInteger(page) && page >= 0 && page <= Math.floor(2147483647 / 24) ? page : 0,
  };
}

export function writeSearchCriteria(criteria: SearchCriteria): string {
  const params = new URLSearchParams();
  if (criteria.query) params.set('q', criteria.query);
  criteria.tags.forEach((tag) => params.append('tag', tag));
  if (criteria.sort !== 'relevance') params.set('sort', criteria.sort);
  if (criteria.audience !== 'ALL') params.set('audience', criteria.audience);
  if (criteria.page) params.set('page', String(criteria.page));
  return params.toString();
}
