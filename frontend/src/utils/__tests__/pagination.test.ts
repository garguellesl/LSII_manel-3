import { pageItems } from '../pagination';

describe('pageItems', () => {
  it('returns nothing when there are no pages', () => {
    expect(pageItems(0, 0)).toEqual([]);
  });

  it('lists every page when they fit in the window', () => {
    expect(pageItems(0, 1)).toEqual([0]);
    expect(pageItems(2, 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it('keeps the first and last pages and collapses the rest into gaps', () => {
    expect(pageItems(0, 10)).toEqual([0, 1, 2, 3, 4, 'gap', 9]);
    expect(pageItems(5, 10)).toEqual([0, 'gap', 3, 4, 5, 6, 7, 'gap', 9]);
    expect(pageItems(9, 10)).toEqual([0, 'gap', 5, 6, 7, 8, 9]);
  });

  it('does not insert a gap for a single skipped page', () => {
    expect(pageItems(3, 10)).toEqual([0, 1, 2, 3, 4, 5, 'gap', 9]);
    expect(pageItems(6, 10)).toEqual([0, 'gap', 4, 5, 6, 7, 8, 9]);
  });
});
