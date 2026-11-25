import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../../shared/lib/formatters/numbers'
import type { BattleReward } from '../types'

interface BattleRewardsTableProps {
  rewards: { pve: BattleReward | null; pvp: BattleReward | null }
}

/** Trainer XP per battle result. Values come from the API; availability is decided by the caller. */
export function BattleRewardsTable({ rewards }: BattleRewardsTableProps) {
  const { t } = useTranslation('gameRules')
  const rows = [
    { mode: 'pve' as const, reward: rewards.pve },
    { mode: 'pvp' as const, reward: rewards.pvp },
  ].filter((row): row is { mode: 'pve' | 'pvp'; reward: BattleReward } => row.reward !== null)

  if (rows.length === 0) {
    return <p className="m-0 text-sm text-arena-300/70">{t('sections.d.empty')}</p>
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{t('sections.d.tableCaption')}</caption>
        <thead className="bg-background/70 text-[11px] uppercase tracking-[0.12em] text-arena-300/60">
          <tr>
            <th scope="col" className="px-4 py-3 font-extrabold">
              {t('sections.d.mode')}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-extrabold">
              {t('sections.d.win')}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-extrabold">
              {t('sections.d.loss')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ mode, reward }) => (
            <tr key={mode} className="border-t border-border/70">
              <th scope="row" className="px-4 py-2.5 font-display font-semibold text-white">
                {t(`sections.d.${mode}`)}
              </th>
              <td className="px-4 py-2.5 text-right font-display text-arena-300">
                {t('sections.d.xp', { xp: formatNumber(reward.win) })}
              </td>
              <td className="px-4 py-2.5 text-right font-display text-arena-300">
                {t('sections.d.xp', { xp: formatNumber(reward.loss) })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
