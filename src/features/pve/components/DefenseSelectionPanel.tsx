import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const DEFENSES = ['endure', 'block', 'dodge', 'recover'] as const

const DEFENSE_TONES: Record<(typeof DEFENSES)[number], string> = {
  endure: 'border-arena-400/45 bg-arena-700/40 hover:border-arena-300/70 hover:bg-arena-700/60',
  block: 'border-electric/55 bg-electric/15 hover:border-electric hover:bg-electric/25',
  dodge: 'border-gold/55 bg-gold/15 hover:border-gold hover:bg-gold/25',
  recover: 'border-signal-ok/55 bg-signal-ok/15 hover:border-signal-ok hover:bg-signal-ok/25',
}

const DEFENSE_SELECTED: Record<(typeof DEFENSES)[number], string> = {
  endure: 'border-arena-300 bg-arena-700/70 shadow-[0_0_0_1px_rgba(214,222,234,0.25)]',
  block: 'border-electric bg-electric/30 shadow-[0_0_0_1px_rgba(39,201,236,0.35)]',
  dodge: 'border-gold bg-gold/30 shadow-[0_0_0_1px_rgba(255,184,77,0.35)]',
  recover: 'border-signal-ok bg-signal-ok/30 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]',
}

const DEFENSE_LABEL: Record<(typeof DEFENSES)[number], string> = {
  endure: 'text-arena-300',
  block: 'text-electric',
  dodge: 'text-gold',
  recover: 'text-signal-ok',
}

interface DefenseSelectionPanelProps {
  disabled: boolean
  onDefend: (defense: (typeof DEFENSES)[number]) => void
}

export function DefenseSelectionPanel({ disabled, onDefend }: DefenseSelectionPanelProps) {
  const { t } = useTranslation('pve')
  const [selected, setSelected] = useState<(typeof DEFENSES)[number]>('endure')

  return (
    <section aria-label={t('actions.defensePanel')} className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-border px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-arena-300/55">
          {t('actions.attackTab')}
        </span>
        <span className="rounded-full bg-electric/20 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-electric">
          {t('actions.defenseTab')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {DEFENSES.map((defense) => (
          <button
            key={defense}
            type="button"
            disabled={disabled}
            onClick={() => setSelected(defense)}
            className={`rounded-2xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
              selected === defense ? DEFENSE_SELECTED[defense] : DEFENSE_TONES[defense]
            }`}
          >
            <span className={`block font-display text-sm font-semibold ${DEFENSE_LABEL[defense]}`}>
              {t(`defense.${defense}.label`)}
            </span>
            <span className="mt-1 block text-xs text-arena-300/80">{t(`defense.${defense}.hint`)}</span>
          </button>
        ))}
      </div>

      <div className={`rounded-2xl border px-4 py-3 ${DEFENSE_TONES[selected]}`} role="note">
        <p className={`m-0 font-display text-sm font-semibold ${DEFENSE_LABEL[selected]}`}>
          {t(`defense.${selected}.label`)}
        </p>
        <p className="m-0 mt-1 text-sm text-arena-300/90">{t(`defense.${selected}.description`)}</p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDefend(selected)}
          className="rounded-xl border border-electric bg-electric px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-50"
        >
          {t('actions.useDefense', { defense: t(`defense.${selected}.label`) })}
        </button>
      </div>
    </section>
  )
}
