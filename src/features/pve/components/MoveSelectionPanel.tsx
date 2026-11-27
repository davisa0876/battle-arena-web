import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BattleMove } from '../types/battle'

interface MoveSelectionPanelProps {
  moves: BattleMove[]
  disabled: boolean
  onAttack: (moveId: number) => void
  onBasicStrike: () => void
  onRecoverSkip: () => void
  canBasicStrike: boolean
  canRecoverSkip: boolean
}

const MOVE_TONES = [
  {
    idle: 'border-ember/40 bg-ember/10 hover:border-ember/70',
    selected: 'border-ember bg-ember/25 shadow-[0_0_0_1px_rgba(255,101,66,0.35)]',
    type: 'text-ember',
  },
  {
    idle: 'border-gold/40 bg-gold/10 hover:border-gold/70',
    selected: 'border-gold bg-gold/25 shadow-[0_0_0_1px_rgba(255,184,77,0.35)]',
    type: 'text-gold',
  },
  {
    idle: 'border-signal-bad/40 bg-signal-bad/10 hover:border-signal-bad/70',
    selected: 'border-signal-bad bg-signal-bad/20 shadow-[0_0_0_1px_rgba(251,113,133,0.35)]',
    type: 'text-signal-bad',
  },
  {
    idle: 'border-neon/35 bg-neon/10 hover:border-neon/65',
    selected: 'border-neon bg-neon/20 shadow-[0_0_0_1px_rgba(57,255,20,0.3)]',
    type: 'text-neon',
  },
] as const

const CARD_WIDTH_PX = 152

type Selection = number | 'basic' | 'recover' | null

/** Keeps the current choice while it is still valid; otherwise picks a default. */
function resolveSelection(
  current: Selection,
  moves: BattleMove[],
  canBasicStrike: boolean,
  canRecoverSkip: boolean,
): Selection {
  if (current === 'basic' && canBasicStrike) {
    return current
  }
  if (current === 'recover' && canRecoverSkip) {
    return current
  }
  if (typeof current === 'number' && moves.find((move) => move.id === current)?.can_use) {
    return current
  }
  const firstUsable = moves.find((move) => move.can_use && move.id != null)
  if (firstUsable?.id != null) {
    return firstUsable.id
  }
  if (canRecoverSkip) {
    return 'recover'
  }
  return canBasicStrike ? 'basic' : null
}

export function MoveSelectionPanel({
  moves,
  disabled,
  onAttack,
  onBasicStrike,
  onRecoverSkip,
  canBasicStrike,
  canRecoverSkip,
}: MoveSelectionPanelProps) {
  const { t } = useTranslation('pve')
  const [selectedId, setSelectedId] = useState<Selection>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [overflows, setOverflows] = useState(false)

  // Keep the player's choice across REST/realtime refreshes; only re-pick when invalid.
  // Adjusted during render (not in an effect) to avoid a cascading second render.
  const resolvedId = resolveSelection(selectedId, moves, canBasicStrike, canRecoverSkip)
  if (resolvedId !== selectedId) {
    setSelectedId(resolvedId)
  }

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) {
      return
    }

    const sync = () => {
      const max = Math.max(0, el.scrollWidth - el.clientWidth)
      setOverflows(max > 2)
      setCanScrollLeft(el.scrollLeft > 2)
      setCanScrollRight(max > 2 && el.scrollLeft < max - 2)
    }

    sync()
    // Layout may settle after paint (fonts/images); re-check once.
    const raf = window.requestAnimationFrame(sync)
    el.addEventListener('scroll', sync, { passive: true })
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    if (el.firstElementChild) {
      observer.observe(el.firstElementChild)
    }
    return () => {
      window.cancelAnimationFrame(raf)
      el.removeEventListener('scroll', sync)
      observer.disconnect()
    }
  }, [moves])

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) {
      return
    }
    const step = CARD_WIDTH_PX + 8
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  const selectedMove = typeof selectedId === 'number' ? moves.find((move) => move.id === selectedId) : null

  return (
    <section aria-label={t('actions.attackPanel')} className="grid min-w-0 w-full gap-3">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-ember/20 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-ember">
          {t('actions.attackTab')}
        </span>
        <span className="rounded-full border border-border px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-arena-300/55">
          {t('actions.defenseTab')}
        </span>
      </div>

      <div className="relative min-w-0 w-full">
        {overflows && (
          <button
            type="button"
            aria-label={t('actions.scrollMovesLeft')}
            disabled={!canScrollLeft}
            onClick={() => scrollByDir(-1)}
            className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-[#0a1220]/95 text-lg text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-35"
          >
            ‹
          </button>
        )}

        <div
          ref={scrollerRef}
          className={`min-w-0 w-full max-w-full overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:thin] ${
            overflows ? 'px-12' : ''
          }`}
        >
          <div className="flex w-max flex-nowrap gap-2">
            {moves.map((move, index) => {
              const selected = selectedId === move.id
              const tone = MOVE_TONES[index % MOVE_TONES.length]
              return (
                <button
                  key={move.id ?? move.slug}
                  type="button"
                  disabled={disabled || !move.can_use || move.id == null}
                  onClick={() => move.id != null && setSelectedId(move.id)}
                  style={{
                    flex: `0 0 ${CARD_WIDTH_PX}px`,
                    width: CARD_WIDTH_PX,
                    minWidth: CARD_WIDTH_PX,
                    maxWidth: CARD_WIDTH_PX,
                  }}
                  className={`box-border rounded-2xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                    selected ? tone.selected : tone.idle
                  }`}
                >
                  <span className="block truncate font-display text-sm font-semibold text-white">{move.name}</span>
                  <span className={`mt-1 block text-[11px] uppercase tracking-[0.12em] ${tone.type}`}>
                    {move.type}
                  </span>
                  <span className="mt-2 block text-xs text-arena-300/80">
                    {t('movePp', { pp: move.pp.current, ppMax: move.pp.max })}
                  </span>
                  <span className="mt-1 block text-[11px] text-arena-300/65">
                    {t('moveStaminaCost', { stamina: move.stamina_cost })}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {overflows && (
          <button
            type="button"
            aria-label={t('actions.scrollMovesRight')}
            disabled={!canScrollRight}
            onClick={() => scrollByDir(1)}
            className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-[#0a1220]/95 text-lg text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-35"
          >
            ›
          </button>
        )}
      </div>

      {(canRecoverSkip || canBasicStrike) && (
        <div className="flex flex-wrap gap-2">
          {canRecoverSkip && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setSelectedId('recover')}
              className={`min-w-[9.5rem] flex-1 rounded-2xl border px-3 py-3 text-left text-sm font-semibold disabled:opacity-45 sm:flex-none ${
                selectedId === 'recover'
                  ? 'border-signal-ok bg-signal-ok/25 text-white shadow-[0_0_0_1px_rgba(52,211,153,0.35)]'
                  : 'border-signal-ok/45 bg-signal-ok/10 text-arena-300 hover:border-signal-ok/70'
              }`}
            >
              {t('actions.recoverSkip')}
            </button>
          )}
          {canBasicStrike && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setSelectedId('basic')}
              className={`min-w-[9.5rem] flex-1 rounded-2xl border border-dashed px-3 py-3 text-left text-sm font-semibold disabled:opacity-45 sm:flex-none ${
                selectedId === 'basic'
                  ? 'border-gold bg-gold/20 text-white'
                  : 'border-gold/40 bg-gold/5 text-arena-300 hover:border-gold/70'
              }`}
            >
              {t('actions.basicStrike')}
            </button>
          )}
        </div>
      )}

      {selectedId === 'recover' && (
        <div className="rounded-2xl border border-signal-ok/35 bg-signal-ok/10 px-4 py-3" role="note">
          <p className="m-0 font-display text-sm font-semibold text-signal-ok">{t('actions.recoverSkip')}</p>
          <p className="m-0 mt-1 text-sm text-arena-300/90">{t('actions.recoverSkipHelp')}</p>
        </div>
      )}

      {selectedId === 'basic' && (
        <div className="rounded-2xl border border-gold/35 bg-gold/10 px-4 py-3" role="note">
          <p className="m-0 font-display text-sm font-semibold text-gold">{t('actions.basicStrike')}</p>
          <p className="m-0 mt-1 text-sm text-arena-300/90">{t('actions.basicStrikeHelp')}</p>
          <p className="m-0 mt-2 text-xs uppercase tracking-[0.12em] text-arena-300/70">
            {t('moveMeta', { power: 20, stamina: 0, pp: '—', ppMax: '—' })}
          </p>
        </div>
      )}

      {selectedMove && (
        <div className="rounded-2xl border border-ember/35 bg-ember/10 px-4 py-3" role="note">
          <p className="m-0 font-display text-sm font-semibold text-white">{selectedMove.name}</p>
          <p className="m-0 mt-1 text-sm text-arena-300/90">
            {t('actions.moveHelp', {
              name: selectedMove.name,
              power: selectedMove.power,
              type: selectedMove.type,
              class: selectedMove.damage_class,
              stamina: selectedMove.stamina_cost,
              accuracy: selectedMove.accuracy,
            })}
          </p>
          <p className="m-0 mt-2 text-xs uppercase tracking-[0.12em] text-arena-300/70">
            {t('moveMeta', {
              power: selectedMove.power,
              stamina: selectedMove.stamina_cost,
              pp: selectedMove.pp.current,
              ppMax: selectedMove.pp.max,
            })}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={
            disabled ||
            selectedId == null ||
            (selectedId !== 'basic' && selectedId !== 'recover' && !selectedMove?.can_use)
          }
          onClick={() => {
            if (selectedId === 'recover') {
              onRecoverSkip()
              return
            }
            if (selectedId === 'basic') {
              onBasicStrike()
              return
            }
            if (typeof selectedId === 'number') onAttack(selectedId)
          }}
          className="rounded-xl border border-ember bg-ember px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {selectedId === 'recover'
            ? t('actions.useRecoverSkip')
            : selectedId === 'basic'
              ? t('actions.useBasicStrike')
              : t('actions.useMove', { move: selectedMove?.name ?? '—' })}
        </button>
      </div>
    </section>
  )
}
