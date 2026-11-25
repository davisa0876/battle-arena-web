import { useTranslation } from 'react-i18next'
import type { CombatLogEntry } from '../types/battle'

interface CombatExchangeLogProps {
  entries: CombatLogEntry[]
}

function defensePercent(multiplier: number | null | undefined): number | null {
  if (multiplier == null || Number.isNaN(multiplier)) return null
  return Math.round((1 - multiplier) * 100)
}

export function CombatExchangeLog({ entries }: CombatExchangeLogProps) {
  const { t } = useTranslation('pve')
  const latest = [...entries].reverse()

  return (
    <section
      className="flex h-[22rem] max-h-[22rem] min-h-0 w-full flex-col overflow-hidden rounded-[24px] border border-border bg-[#070d18]/90 p-4 font-mono text-sm"
      aria-live="polite"
    >
      <h3 className="m-0 mb-3 shrink-0 font-display text-base font-semibold tracking-wide text-white">
        {t('log.title')}
      </h3>
      {latest.length === 0 ? (
        <p className="m-0 text-arena-300/70">{t('log.empty')}</p>
      ) : (
        <ul className="m-0 flex min-h-0 flex-1 list-none flex-col gap-3 overflow-y-auto overscroll-contain p-0 pr-1 [scrollbar-gutter:stable]">
          {latest.map((entry) => {
            if (entry.kind === 'started') {
              return (
                <li key={entry.id} className="shrink-0 text-arena-300/80">
                  {t('log.started')}
                </li>
              )
            }

            if (entry.kind === 'finished') {
              return (
                <li key={entry.id} className="shrink-0 text-amber-300">
                  {entry.outcome === 'win' ? t('result.win') : t('result.loss')}
                  {typeof entry.xp_awarded === 'number'
                    ? ` ${t('result.xp', { xp: entry.xp_awarded })}`
                    : ''}
                </li>
              )
            }

            if (entry.kind === 'recover_skip') {
              return (
                <li key={entry.id} className="shrink-0 rounded-xl border border-signal-ok/25 bg-signal-ok/10 p-3 text-signal-ok">
                  <p className="m-0 text-xs uppercase tracking-[0.14em] text-arena-300/70">
                    {t('log.round', { round: entry.round })}
                  </p>
                  <p className="m-0 mt-1">
                    {t('log.recoverSkip', { name: entry.actor.name, stamina: entry.stamina_gained })}
                  </p>
                </li>
              )
            }

            const reduction = defensePercent(entry.defense?.multiplier)
            return (
              <li
                key={entry.id}
                className="shrink-0 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-[13px] leading-relaxed text-arena-300"
              >
                <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-electric/90">
                  {t('log.round', { round: entry.round })}
                </p>
                <p className="m-0 mt-1.5">
                  <span className="text-arena-400">{t('log.attacker')}</span>{' '}
                  <span className="font-semibold text-white">{entry.attacker.name}</span>
                </p>
                <p className="m-0">
                  <span className="text-arena-400">{t('log.defender')}</span>{' '}
                  <span className="font-semibold text-white">{entry.defender.name}</span>
                </p>
                <p className="m-0 mt-1.5 text-white">
                  {t('log.usedAttack', { name: entry.attacker.name, attack: entry.attack.name })}
                </p>
                <p className="m-0 text-arena-300/85">
                  {t('log.attackCost', {
                    stamina: entry.attack.stamina_spent,
                    pp: entry.attack.pp_spent,
                  })}
                </p>
                {entry.defense && (
                  <p className="m-0 mt-1">
                    {t('log.usedDefense', {
                      name: entry.defender.name,
                      defense: t(`defense.${entry.defense.type}.label`, {
                        defaultValue: entry.defense.type,
                      }),
                    })}
                    {reduction != null && reduction > 0
                      ? ` ${t('log.damageReduced', { percent: reduction })}`
                      : ''}
                  </p>
                )}
                {entry.result?.hit === 'miss' && (
                  <p className="m-0 mt-1 text-arena-300">{t('log.missed')}</p>
                )}
                {entry.result?.hit === 'dodged' && (
                  <p className="m-0 mt-1 text-electric">{t('log.dodged')}</p>
                )}
                {entry.result &&
                  (entry.result.hit === 'hit' ||
                    entry.result.hit === 'blocked' ||
                    entry.result.hit === 'immune') && (
                    <p className="m-0 mt-1 font-semibold text-signal-bad">
                      {t('log.damage', { damage: entry.result.damage })}
                      {entry.result.hp_before != null && entry.result.hp_after != null
                        ? ` ${t('log.hpRemaining', {
                            name: entry.defender.name,
                            before: entry.result.hp_before,
                            after: entry.result.hp_after,
                          })}`
                        : ''}
                    </p>
                  )}
                {entry.fainted && (
                  <p className="m-0 mt-1 font-semibold text-signal-ok">
                    {t('log.fainted', { name: entry.fainted })}
                  </p>
                )}
                {entry.battle_outcome && (
                  <p className="m-0 mt-1 font-semibold text-amber-300">
                    {entry.battle_outcome === 'win' ? t('result.win') : t('result.loss')}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
