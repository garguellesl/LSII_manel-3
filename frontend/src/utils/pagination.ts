export type PageItem = number | 'gap';

// Zero-based page indexes to render: always first and last, a window around the current page, gaps elsewhere.
export function pageItems(current: number, totalPages: number, radius = 2): PageItem[] {
  if (totalPages <= 0) return [];
  const start = Math.max(0, Math.min(current - radius, totalPages - 1 - radius * 2));
  const end = Math.min(totalPages - 1, Math.max(current + radius, radius * 2));
  const items: PageItem[] = [];
  if (start > 0) items.push(0);
  if (start > 1) items.push('gap');
  for (let page = start; page <= end; page++) items.push(page);
  if (end < totalPages - 2) items.push('gap');
  if (end < totalPages - 1) items.push(totalPages - 1);
  return items;
}
