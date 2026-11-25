import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../../shared/lib/formatters/numbers'
import type { TrainerProgress } from '../types'

interface XpProgressBarProps {
  progress: TrainerProgress
}

/** Progress inside the current level, driven entirely by what the API reports. */
export function XpProgressBar({ progress }: XpProgressBarProps) {
  const { t } = useTranslation('progression')
  const percent = Math.round(progress.progress_percent)

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-xs font-semibold text-arena-300/80">
        <span>{t('progressLabel')}</span>
        <span className="font-display text-sm text-white">
          {progress.is_max_level || progress.xp_for_next_level === null
            ? t('maxLevel')
            : t('xpProgress', {
                current: formatNumber(progress.xp_into_level),
                required: formatNumber(progress.xp_for_next_level),
              })}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={t('progressLabel')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2.5 overflow-hidden rounded-full bg-background ring-1 ring-border"
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-electric to-ember transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
      {!progress.is_max_level && progress.xp_to_next_level !== null && (
        <p className="mb-0 mt-2 text-xs text-arena-300/60">
          {t('toNext', { xp: formatNumber(progress.xp_to_next_level), level: progress.level + 1 })}
        </p>
      )}
    </div>
  )
}
