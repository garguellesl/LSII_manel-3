import { pageItems } from '../utils/pagination';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalElements: number;
  hasNext: boolean;
  itemCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, totalElements, hasNext, itemCount, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const first = itemCount ? page * pageSize + 1 : 0;
  const last = page * pageSize + itemCount;

  return (
    <nav className="pagination-bar" aria-label="Video pages">
      <p className="pagination-summary">
        {itemCount ? `Showing ${first}–${last} of ${totalElements} videos` : `No videos on this page`}
      </p>
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-step"
          disabled={page === 0}
          aria-label="Previous"
          onClick={() => onPageChange(page - 1)}
        >
          <span aria-hidden="true">‹</span> Previous
        </button>
        <ol className="pagination-pages">
          {pageItems(page, totalPages).map((item, index) =>
            item === 'gap' ? (
              <li key={`gap-${index}`} className="pagination-gap" aria-hidden="true">
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  className={item === page ? 'pagination-page pagination-page--current' : 'pagination-page'}
                  aria-label={`Page ${item + 1}`}
                  aria-current={item === page ? 'page' : undefined}
                  onClick={() => item !== page && onPageChange(item)}
                >
                  {item + 1}
                </button>
              </li>
            )
          )}
        </ol>
        <button
          type="button"
          className="pagination-step"
          disabled={!hasNext}
          aria-label="Next"
          onClick={() => onPageChange(page + 1)}
        >
          Next <span aria-hidden="true">›</span>
        </button>
      </div>
      <span className="visually-hidden" role="status">
        Page {page + 1} of {totalPages}
      </span>
    </nav>
  );
}

export default Pagination;
