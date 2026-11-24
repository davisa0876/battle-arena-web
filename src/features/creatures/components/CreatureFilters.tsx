import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { CreatureType } from '../types'

interface CreatureFiltersProps {
  search: string
  type: string
  draftSearch: string
  types: CreatureType[]
  onDraftSearchChange: (value: string) => void
  onApply: (next: { search?: string; type?: string; page?: number }) => void
  onClear: () => void
}

export function CreatureFilters({
  search,
  type,
  draftSearch,
  types,
  onDraftSearchChange,
  onApply,
  onClear,
}: CreatureFiltersProps) {
  const { t } = useTranslation('creatures')

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onApply({ search: draftSearch, page: 1 })
  }

  return (
    <form
      className="mt-8 grid gap-3 rounded-[28px] border border-border bg-surface/70 p-4 shadow-card backdrop-blur md:grid-cols-[minmax(0,1fr)_220px_auto]"
      onSubmit={onSubmit}
      role="search"
      aria-label={t('catalog.filters.aria')}
    >
      <label className="grid gap-2 text-sm text-arena-300/80">
        <span>{t('catalog.filters.searchLabel')}</span>
        <input
          value={draftSearch}
          onChange={(event) => onDraftSearchChange(event.target.value)}
          className="rounded-xl border border-border bg-background px-4 py-3 text-white outline-none transition focus:border-ember"
          placeholder={t('catalog.filters.searchPlaceholder')}
          name="search"
          autoComplete="off"
        />
      </label>

      <label className="grid gap-2 text-sm text-arena-300/80">
        <span>{t('catalog.filters.typeLabel')}</span>
        <select
          value={type}
          onChange={(event) => onApply({ type: event.target.value, page: 1 })}
          className="rounded-xl border border-border bg-background px-4 py-3 text-white outline-none transition focus:border-ember"
          name="type"
          aria-label={t('catalog.filters.typeAria')}
        >
          <option value="">{t('catalog.filters.allTypes')}</option>
          {types.map((creatureType) => (
            <option key={creatureType.id} value={creatureType.slug}>
              {creatureType.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="rounded-xl border border-ember/50 bg-ember/15 px-5 py-3 font-semibold text-ember transition hover:bg-ember/25"
        >
          {t('catalog.filters.searchAction')}
        </button>
        {(search || type) && (
          <button
            type="button"
            className="rounded-xl border border-border bg-transparent px-4 py-3 text-arena-300 transition hover:border-arena-300"
            onClick={onClear}
          >
            {t('catalog.filters.clearAction')}
          </button>
        )}
      </div>
    </form>
  )
}
