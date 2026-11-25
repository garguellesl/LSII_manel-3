import { t, useLocale, formatNumber } from '../i18n/locale';
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
  useLocale();
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const first = itemCount ? page * pageSize + 1 : 0;
  const last = page * pageSize + itemCount;

  return (
    <nav className="pagination-bar" aria-label={t('catalogue.videoPages')}>
      <p className="pagination-summary">
        {itemCount
          ? t('catalogue.range', {
              first: formatNumber(first),
              last: formatNumber(last),
              total: formatNumber(totalElements),
            })
          : t('catalogue.noVideosOnThisPage')}
      </p>
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-step"
          disabled={page === 0}
          aria-label={t('catalogue.previous')}
          onClick={() => onPageChange(page - 1)}
        >
          <span aria-hidden="true">‹</span> {t('catalogue.previous')}{' '}
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
                  aria-label={t('catalogue.pageNumber', { page: formatNumber(item + 1) })}
                  aria-current={item === page ? 'page' : undefined}
                  onClick={() => item !== page && onPageChange(item)}
                >
                  {formatNumber(item + 1)}
                </button>
              </li>
            )
          )}
        </ol>
        <button
          type="button"
          className="pagination-step"
          disabled={!hasNext}
          aria-label={t('catalogue.next')}
          onClick={() => onPageChange(page + 1)}
        >
          {' '}
          {t('catalogue.next')} <span aria-hidden="true">›</span>
        </button>
      </div>
      <span className="visually-hidden" role="status">
        {' '}
        {t('catalogue.pageOf', { page: formatNumber(page + 1), total: formatNumber(totalPages) })}
      </span>
    </nav>
  );
}

export default Pagination;
