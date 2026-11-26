import { useTranslation } from 'react-i18next'
import type { PvpRecord } from '../../profile/types'

interface PvpRecordSummaryProps {
  record?: PvpRecord | null
}

export function PvpRecordSummary({ record }: PvpRecordSummaryProps) {
  const { t } = useTranslation('pvp')
  if (!record) return null

  return (
    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
      <span className="rounded-full border border-signal-ok/35 bg-signal-ok/10 px-3 py-1 text-signal-ok">
        {t('record.wins', { count: record.wins })}
      </span>
      <span className="rounded-full border border-signal-bad/35 bg-signal-bad/10 px-3 py-1 text-signal-bad">
        {t('record.losses', { count: record.losses })}
      </span>
      <span className="rounded-full border border-arena-400/35 bg-arena-800/60 px-3 py-1 text-arena-300">
        {t('record.forfeits', { count: record.forfeits })}
      </span>
    </div>
  )
}
