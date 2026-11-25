import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../../shared/lib/formatters/numbers'
import type { SelectionSample } from '../types'

interface SelectionSamplesTableProps {
  samples: SelectionSample[]
}

/** Allowance per trainer level, as computed by the server. */
export function SelectionSamplesTable({ samples }: SelectionSamplesTableProps) {
  const { t } = useTranslation('gameRules')

  if (samples.length === 0) {
    return <p className="m-0 text-sm text-arena-300/70">{t('sections.b.samplesEmpty')}</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{t('sections.b.samplesCaption')}</caption>
        <thead className="bg-background/70 text-[11px] uppercase tracking-[0.12em] text-arena-300/60">
          <tr>
            <th scope="col" className="px-4 py-3 font-extrabold">
              {t('sections.b.trainerLevel')}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-extrabold">
              {t('sections.b.stage1Column')}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-extrabold">
              {t('sections.b.stage2Column')}
            </th>
          </tr>
        </thead>
        <tbody>
          {samples.map((sample) => (
            <tr key={sample.trainer_level} className="border-t border-border/70">
              <th scope="row" className="px-4 py-2.5 font-display font-semibold text-white">
                {formatNumber(sample.trainer_level)}
              </th>
              <td className="px-4 py-2.5 text-right font-display text-arena-300">
                {formatNumber(sample.stage_1_allowance)}
              </td>
              <td className="px-4 py-2.5 text-right font-display text-arena-300">
                {formatNumber(sample.stage_2_allowance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
