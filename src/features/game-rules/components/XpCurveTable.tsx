import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../../shared/lib/formatters/numbers'
import type { XpCurveSample } from '../types'

interface XpCurveTableProps {
  samples: XpCurveSample[]
}

/** Renders the XP curve exactly as published by the API; no balancing numbers live in the client. */
export function XpCurveTable({ samples }: XpCurveTableProps) {
  const { t } = useTranslation('gameRules')

  if (samples.length === 0) {
    return <p className="m-0 text-sm text-arena-300/70">{t('sections.a.empty')}</p>
  }

  const showTotals = samples.some((sample) => sample.total_xp_required !== null)

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{t('sections.a.tableCaption')}</caption>
        <thead className="bg-background/70 text-[11px] uppercase tracking-[0.12em] text-arena-300/60">
          <tr>
            <th scope="col" className="px-4 py-3 font-extrabold">
              {t('sections.a.level')}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-extrabold">
              {t('sections.a.xpToNext')}
            </th>
            {showTotals && (
              <th scope="col" className="px-4 py-3 text-right font-extrabold">
                {t('sections.a.totalXp')}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {samples.map((sample) => (
            <tr key={sample.level} className="border-t border-border/70">
              <th scope="row" className="px-4 py-2.5 font-display font-semibold text-white">
                {formatNumber(sample.level)}
              </th>
              <td className="px-4 py-2.5 text-right font-display text-arena-300">
                {formatNumber(sample.xp_to_next_level)}
              </td>
              {showTotals && (
                <td className="px-4 py-2.5 text-right font-display text-arena-300">
                  {sample.total_xp_required === null ? '' : formatNumber(sample.total_xp_required)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
