import { useTranslation } from 'react-i18next'
import { PageLoading } from '../../../shared/components/feedback/PageLoading'
import { PageHeading, PageSection } from '../../../shared/components/layout/PageSection'
import { Button } from '../../../shared/components/ui/Button'
import { formatNumber } from '../../../shared/lib/formatters/numbers'
import { BattleRewardsTable } from '../components/BattleRewardsTable'
import { FeatureFlagList } from '../components/FeatureFlagList'
import { RuleList, RuleSection } from '../components/RuleSection'
import { SelectionRulesSummary } from '../components/SelectionRulesSummary'
import { SelectionSamplesTable } from '../components/SelectionSamplesTable'
import { XpCurveTable } from '../components/XpCurveTable'
import { useGameRules } from '../hooks/useGameRules'
import type { GameRules } from '../types'

export function GameRulesPage() {
  const { t } = useTranslation('gameRules')
  const state = useGameRules()

  return (
    <PageSection size="medium">
      <PageHeading
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('subtitle')}
      />

      <div aria-live="polite">
        {state.status === 'loading' && <PageLoading label={t('loading')} fullPage={false} />}

        {state.status === 'error' && (
          <div className="rounded-2xl border border-signal-bad/40 bg-signal-bad/10 p-6">
            <p className="m-0 font-semibold text-signal-bad">{state.message}</p>
            <Button className="mt-4" variant="secondary" onClick={state.reload}>
              {t('retry')}
            </Button>
          </div>
        )}
      </div>

      {state.status === 'ready' && <RulesContent rules={state.rules} />}
    </PageSection>
  )
}

function RulesContent({ rules }: { rules: GameRules }) {
  const { t } = useTranslation('gameRules')
  const { progression, selection, battle } = rules
  const battlesPlayable = battle.playable
  const levelOrUnknown = (level: number | null, key: 'pve' | 'pvp') =>
    level === null ? t('sections.c.unknown') : t(`sections.c.${key}`, { level: formatNumber(level) })

  return (
    <div className="flex flex-col gap-6">
      {rules.version && (
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-arena-300/60">
          {t('version', { version: rules.version })}
        </p>
      )}

      <RuleSection
        letter="A"
        title={t('sections.a.title')}
        intro={t('sections.a.intro', {
          startingLevel:
            progression.starting_level !== null ? formatNumber(progression.starting_level) : '—',
          startingXp: progression.starting_xp !== null ? formatNumber(progression.starting_xp) : '—',
        })}
      >
        {progression.xp_increment_per_level !== null && (
          <p className="m-0 text-sm text-arena-300/80">
            {t('sections.a.incrementLabel', { xp: formatNumber(progression.xp_increment_per_level) })}
          </p>
        )}
        {progression.formula && (
          <p className="m-0 text-sm text-arena-300/80">
            <span className="font-semibold text-white">{t('sections.a.formulaLabel')}: </span>
            <code className="rounded-md bg-background px-2 py-1 font-mono text-electric">{progression.formula}</code>
          </p>
        )}
        {progression.max_level !== null && (
          <p className="m-0 text-sm text-arena-300/80">
            {t('sections.a.maxLevel', { level: formatNumber(progression.max_level) })}
          </p>
        )}
        <XpCurveTable samples={progression.curve_samples} />
        <p className="m-0 text-sm text-arena-300/70">{t('sections.a.note')}</p>
      </RuleSection>

      <RuleSection letter="B" title={t('sections.b.title')} intro={t('sections.b.intro')}>
        <SelectionRulesSummary selection={selection} />
        <SelectionSamplesTable samples={selection.samples} />
        <div>
          <h3 className="m-0 mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-arena-300/60">
            {t('sections.b.startersLabel')}
          </h3>
          {rules.starter_slugs.length === 0 ? (
            <p className="m-0 text-sm text-arena-300/70">{t('sections.b.noStarters')}</p>
          ) : (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {rules.starter_slugs.map((slug) => (
                <li
                  key={slug}
                  className="rounded-full border border-electric/25 bg-electric/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-electric"
                >
                  {slug}
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="m-0 text-sm text-arena-300/70">{t('sections.b.note')}</p>
      </RuleSection>

      <RuleSection letter="C" title={t('sections.c.title')} intro={t('sections.c.intro')}>
        <RuleList
          items={[
            levelOrUnknown(battle.pve_min_trainer_level, 'pve'),
            levelOrUnknown(battle.pvp_min_trainer_level, 'pvp'),
            ...(battle.pvp_online_presence
              ? [
                  battle.pvp_online_presence.requires_pvp_screen
                    ? t('sections.c.pvpOnlineLobbyOnly')
                    : t('sections.c.pvpOnlineAuthenticated'),
                ]
              : []),
          ]}
        />
        <p className="m-0 text-sm text-arena-300/70">
          {battlesPlayable ? t('sections.c.playable') : t('sections.c.notPlayable')}
        </p>
      </RuleSection>

      <RuleSection letter="D" title={t('sections.d.title')} intro={t('sections.d.intro')}>
        {!battlesPlayable && (
          <p className="m-0 flex flex-wrap items-center gap-3 text-sm text-arena-300/80">
            <span className="rounded-full bg-arena-700/50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-arena-300/80">
              {t('sections.d.comingSoon')}
            </span>
            {t('sections.d.notEarnable')}
          </p>
        )}
        <BattleRewardsTable rewards={battle.rewards} />
      </RuleSection>

      <RuleSection letter="E" title={t('sections.e.title')} intro={t('sections.e.intro')}>
        <RuleList items={[t('sections.e.point1'), t('sections.e.point2'), t('sections.e.point3')]} />
        <p className="m-0 text-arena-300/80">
          {rules.features.evolution_execution ? t('sections.e.enabled') : t('sections.e.locked')}
        </p>
      </RuleSection>

      <RuleSection letter="F" title={t('sections.f.title')} intro={t('sections.f.intro')}>
        <FeatureFlagList features={rules.features} />
      </RuleSection>
    </div>
  )
}
