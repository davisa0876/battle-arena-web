import { useTranslation } from 'react-i18next'

interface FeatureFlagListProps {
  features: Record<string, boolean>
}

/** Server-controlled feature flags; unknown flag names fall back to their raw key. */
export function FeatureFlagList({ features }: FeatureFlagListProps) {
  const { t } = useTranslation('gameRules')
  // `battles` was an alias of PvE; ignore it if an older API still sends it.
  const entries = Object.entries(features).filter(([name]) => name !== 'battles')

  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 max-sm:grid-cols-1">
      {entries.map(([name, enabled]) => (
        <li
          key={name}
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-4 py-3"
        >
          <span className="font-semibold text-white">{t(`features.${name}`, { defaultValue: name })}</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] ${
              enabled ? 'bg-signal-ok/15 text-signal-ok' : 'bg-arena-700/50 text-arena-300/80'
            }`}
          >
            {enabled ? t('sections.f.enabled') : t('sections.f.comingSoon')}
          </span>
        </li>
      ))}
    </ul>
  )
}
