import { useTranslation } from 'react-i18next'

interface CatalogPaginationProps {
  page: number
  lastPage: number
  onPageChange: (page: number) => void
}

export function CatalogPagination({ page, lastPage, onPageChange }: CatalogPaginationProps) {
  const { t } = useTranslation('creatures')

  return (
    <nav className="mt-8 flex items-center justify-between gap-4" aria-label={t('catalog.pagination.aria')}>
      <button
        type="button"
        className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-arena-300 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        {t('catalog.pagination.previous')}
      </button>
      <span className="text-sm text-arena-300/80">
        {t('catalog.pagination.page', { page, lastPage })}
      </span>
      <button
        type="button"
        className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-arena-300 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={page >= lastPage}
        onClick={() => onPageChange(page + 1)}
      >
        {t('catalog.pagination.next')}
      </button>
    </nav>
  )
}
