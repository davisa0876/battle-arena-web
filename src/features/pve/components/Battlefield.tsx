import { useTranslation } from 'react-i18next'
import { CreatureImage } from '../../creatures/components/CreatureImage'
import type { BattleCombatantView } from '../types/battle'
import { CompactCombatantHud } from './CompactCombatantHud'

/** Shared stadium art (also shipped under battle-arena-mobile/assets/pve). */
const ARENA_BG = '/pve/arena-bg.jpg'
const WIN_FIREWORKS = '/pve/fireworks.gif'

interface BattlefieldProps {
  player: BattleCombatantView
  opponent: BattleCombatantView
  showOpponent?: boolean
  showPlayer?: boolean
  /** Finished battle outcome — shows Victory / You Lose on the arena. */
  outcome?: 'win' | 'loss' | null
}

export function Battlefield({
  player,
  opponent,
  showOpponent = true,
  showPlayer = true,
  outcome = null,
}: BattlefieldProps) {
  const { t } = useTranslation('pve')
  const showBanner = outcome === 'win' || outcome === 'loss'

  return (
    <section
      className="relative aspect-[16/10] w-full overflow-hidden rounded-[24px] border border-border bg-[#0a1424] min-h-[240px]"
      aria-label="Battlefield"
      style={{
        backgroundImage: `url(${ARENA_BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 50%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/30"
        aria-hidden
      />

      {/* Both HUDs stay at the top so HP/stamina are never covered by the action dock. */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-4">
        {showOpponent ? (
          <CompactCombatantHud
            combatant={opponent}
            side="opponent"
            className="animate-[fadeIn_0.35s_ease]"
          />
        ) : (
          <span />
        )}
        {showPlayer ? (
          <CompactCombatantHud
            combatant={player}
            side="player"
            className="animate-[fadeIn_0.35s_ease]"
          />
        ) : (
          <span />
        )}
      </div>

      {/* Sprites sit on the grass band, fully inside the frame. */}
      <div className="absolute inset-x-[6%] bottom-[14%] top-[34%] z-[1] flex items-end justify-between sm:inset-x-[10%] sm:bottom-[16%] sm:top-[30%]">
        <CreatureImage
          framed={false}
          src={opponent.image_ref}
          alt={opponent.name}
          className={`mb-[8%] aspect-square w-[34%] max-w-[160px] transition duration-300 sm:max-w-[180px] ${
            showOpponent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          } ${opponent.hp.current <= 0 ? 'grayscale' : ''}`}
        />
        <CreatureImage
          framed={false}
          src={player.image_ref}
          alt={player.name}
          className={`aspect-square w-[40%] max-w-[180px] transition duration-300 sm:max-w-[210px] ${
            showPlayer ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          } ${player.hp.current <= 0 ? 'grayscale' : ''}`}
        />
      </div>

      {outcome === 'win' && (
        <div className="pointer-events-none absolute inset-0 z-30" aria-hidden>
          <img
            src={WIN_FIREWORKS}
            alt=""
            className="absolute left-1/2 top-[42%] h-[72%] w-auto max-w-[70%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
          />
        </div>
      )}

      {showBanner && (
        <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center px-4">
          <p
            className={`m-0 font-display text-[clamp(2.75rem,8vw,5rem)] font-bold uppercase tracking-[0.08em] drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)] ${
              outcome === 'win'
                ? 'text-[#FFE566] [text-shadow:0_0_24px_rgba(255,214,80,0.55)]'
                : 'text-[#FF6B6B] [text-shadow:0_0_24px_rgba(255,80,80,0.45)]'
            }`}
            role="status"
            aria-live="polite"
          >
            {outcome === 'win' ? t('arenaBanner.victory') : t('arenaBanner.youLose')}
          </p>
        </div>
      )}
    </section>
  )
}
