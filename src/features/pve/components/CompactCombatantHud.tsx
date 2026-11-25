import { useTranslation } from 'react-i18next'
import { CreatureImage } from '../../creatures/components/CreatureImage'
import type { BattleCombatantView } from '../types/battle'

interface CompactCombatantHudProps {
  combatant: BattleCombatantView
  side: 'player' | 'opponent'
  className?: string
}

function MiniBar({
  label,
  current,
  max,
  tone,
}: {
  label: string
  current: number
  max: number
  tone: 'hp' | 'stamina'
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  const fill = tone === 'hp' ? (pct <= 25 ? 'bg-signal-bad' : 'bg-signal-ok') : 'bg-electric'

  return (
    <div className="min-w-0">
      <div className="mb-0.5 flex justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-arena-300/75">
        <span>{label}</span>
        <span>
          {current}/{max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-black/55">
        <div className={`h-full rounded-full transition-[width] duration-500 ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function CompactCombatantHud({ combatant, side, className = '' }: CompactCombatantHudProps) {
  const { t } = useTranslation('pve')

  return (
    <article
      className={`w-[min(100%,220px)] rounded-2xl border border-white/10 bg-[#0b1220]/88 p-2 shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur-md ${className}`}
    >
      <div className="flex items-start gap-2">
        <CreatureImage
          framed={false}
          src={combatant.image_ref}
          alt={combatant.name}
          className="aspect-square w-10 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate font-display text-sm font-semibold text-white">{combatant.name}</p>
          <p className="m-0 mt-0.5 truncate text-[11px] text-arena-300/75">
            {t('level', { level: combatant.level })}
            {combatant.types.length > 0 ? ` · ${combatant.types.join(' / ')}` : ''}
          </p>
        </div>
      </div>
      <div className="mt-2 grid gap-1.5">
        <MiniBar label={t('resources.hp')} current={combatant.hp.current} max={combatant.hp.max} tone="hp" />
        <MiniBar
          label={t('resources.stamina')}
          current={combatant.stamina.current}
          max={combatant.stamina.max}
          tone="stamina"
        />
      </div>
      {side === 'opponent' && combatant.intent && (
        <p className="mt-2 rounded-lg border border-electric/35 bg-electric/10 px-2 py-1 text-[11px] font-semibold text-electric">
          {t('intent', { type: combatant.intent.type_slug })}
        </p>
      )}
    </article>
  )
}
