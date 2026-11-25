import { useTranslation } from 'react-i18next'
import type { EvolutionOption } from '../types'

interface EvolutionStatusProps {
  options: EvolutionOption[]
}

/** Lists the forms a creature can evolve into and why each is (still) locked. */
export function EvolutionStatus({ options }: EvolutionStatusProps) {
  const { t } = useTranslation('collection')

  const reasonText = (code: string | null): string =>
    t(`evolution.reasons.${code ?? 'unknown'}`, { defaultValue: t('evolution.reasons.unknown') })

  return (
    <div className="mt-4 border-t border-border/70 pt-4">
      <h3 className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-arena-300/60">
        {t('evolution.title')}
      </h3>
      {options.length === 0 ? (
        <p className="mb-0 mt-2 text-sm text-arena-300/70">{t('evolution.none')}</p>
      ) : (
        <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
          {options.map((option) => (
            <li
              key={option.creature.slug}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm"
            >
              <span className="font-semibold text-white">{option.creature.name}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] ${
                  option.eligible && !option.locked
                    ? 'bg-signal-ok/15 text-signal-ok'
                    : 'bg-arena-700/50 text-arena-300/80'
                }`}
              >
                {option.eligible && !option.locked ? t('evolution.eligible') : t('evolution.locked')}
              </span>
              {(option.locked || !option.eligible) && (
                <span className="w-full text-xs text-arena-300/60">{reasonText(option.reason_code)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
