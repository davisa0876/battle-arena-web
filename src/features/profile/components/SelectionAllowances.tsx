import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../../shared/lib/formatters/numbers'
import type { TrainerProgress } from '../types'

interface SelectionAllowancesProps {
  progress: TrainerProgress
}

/**
 * Owner-only summary of creature selection quotas and PvP eligibility.
 * Every number comes from `/api/me`; the client never derives quotas from the trainer level.
 */
export function SelectionAllowances({ progress }: SelectionAllowancesProps) {
  const { t } = useTranslation('profile')
  const allowances = progress.selection_allowances
  const pvp = progress.pvp_level_unlocked

  if (allowances === undefined && pvp === undefined) {
    return null
  }

  return (
    <section aria-labelledby="selection-allowances-heading">
      <h2 id="selection-allowances-heading" className="mb-4 mt-0 font-display text-xl font-semibold text-white">
        {t('allowances.title')}
      </h2>
      <p className="mb-4 mt-0 text-sm text-arena-300/70">{t('allowances.hint')}</p>

      <dl className="m-0 grid grid-cols-2 gap-3 md:grid-cols-4">
        {(allowances ?? []).map((allowance) => (
          <div key={allowance.evolution_stage} className="rounded-2xl border border-border bg-surface/70 p-4">
            <dt className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-arena-300/60">
              {t('allowances.stage', { stage: allowance.evolution_stage })}
            </dt>
            <dd className="m-0 mt-1 font-display text-lg font-semibold text-white">
              {t('allowances.remaining', {
                remaining: formatNumber(allowance.remaining),
                total: formatNumber(allowance.total),
              })}
            </dd>
            <dd className="m-0 mt-0.5 text-xs text-arena-300/60">
              {t('allowances.used', { used: formatNumber(allowance.used) })}
            </dd>
          </div>
        ))}
        {pvp !== undefined && (
          <div className="rounded-2xl border border-border bg-surface/70 p-4">
            <dt className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-arena-300/60">
              {t('allowances.pvp')}
            </dt>
            <dd className={`m-0 mt-1 font-display text-lg font-semibold ${pvp ? 'text-signal-ok' : 'text-arena-300'}`}>
              {pvp ? t('allowances.pvpUnlocked') : t('allowances.pvpLocked')}
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}
