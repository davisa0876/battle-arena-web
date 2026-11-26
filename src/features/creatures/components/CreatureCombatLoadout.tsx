import { useTranslation } from 'react-i18next'
import type { CreatureCombatPreview } from '../types'

interface CreatureCombatLoadoutProps {
  combat: CreatureCombatPreview
}

export function CreatureCombatLoadout({ combat }: CreatureCombatLoadoutProps) {
  const { t } = useTranslation('creatures')

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-2" aria-label={t('detail.combat.aria')}>
      <div className="rounded-2xl border border-border bg-surface/70 p-5 shadow-card">
        <h2 className="m-0 font-display text-xl text-white">{t('detail.combat.attacksTitle')}</h2>
        <p className="mt-2 text-sm text-arena-300/80">{t('detail.combat.attacksHint')}</p>
        {combat.attacks.length === 0 ? (
          <p className="mt-4 text-sm text-arena-400">{t('detail.combat.attacksEmpty')}</p>
        ) : (
          <ul className="mt-4 grid list-none gap-3 p-0">
            {combat.attacks.map((move) => (
              <li
                key={move.slug}
                className="rounded-xl border border-border/80 bg-[#0b1220]/70 px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-display text-base font-semibold text-white">{move.name}</span>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-ember">
                    {move.type_slug}
                  </span>
                </div>
                <p className="mt-2 m-0 text-xs text-arena-300">
                  {t('detail.combat.attackMeta', {
                    power: move.power,
                    stamina: move.stamina_cost,
                    pp: move.pp,
                    class: move.damage_class,
                    accuracy: move.accuracy,
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface/70 p-5 shadow-card">
        <h2 className="m-0 font-display text-xl text-white">{t('detail.combat.defensesTitle')}</h2>
        <p className="mt-2 text-sm text-arena-300/80">{t('detail.combat.defensesHint')}</p>
        <ul className="mt-4 grid list-none gap-3 p-0">
          {combat.defenses.map((defense) => (
            <li
              key={defense.slug}
              className="rounded-xl border border-border/80 bg-[#0b1220]/70 px-4 py-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-display text-base font-semibold text-white">
                  {t(`detail.combat.defenseNames.${defense.slug}`, { defaultValue: defense.name })}
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-electric">
                  {t('detail.combat.staminaCost', { stamina: defense.stamina_cost })}
                </span>
              </div>
              <p className="mt-2 m-0 text-xs text-arena-300">
                {t(`detail.combat.defenseBlurb.${defense.slug}`, {
                  multiplier: defense.damage_multiplier ?? 1,
                  chance: defense.success_chance != null ? Math.round(defense.success_chance * 100) : 0,
                  restore: defense.stamina_restore ?? 0,
                })}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
