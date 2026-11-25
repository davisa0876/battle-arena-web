import { useTranslation } from 'react-i18next'
import { formatNumber } from '../../../shared/lib/formatters/numbers'
import type { SelectionRules, StageSelectionRule } from '../types'

interface SelectionRulesSummaryProps {
  selection: SelectionRules
}

/** Describes per-stage selection quotas using only the numbers the API publishes. */
export function SelectionRulesSummary({ selection }: SelectionRulesSummaryProps) {
  const { t } = useTranslation('gameRules')
  const { stage_1: stage1, stage_2: stage2, stage_3: stage3 } = selection

  const lines: string[] = [
    stage1.unlock_level !== null && stage1.allowance_cap !== null
      ? t('sections.b.stage1', { unlock: formatNumber(stage1.unlock_level), cap: formatNumber(stage1.allowance_cap) })
      : t('sections.b.stageUndefined', { stage: 1 }),
    describeStage2(stage2),
    stage3.unlock_level !== null
      ? t('sections.b.stageUnlock', { stage: 3, unlock: formatNumber(stage3.unlock_level) })
      : t('sections.b.stageUndefined', { stage: 3 }),
  ]

  function describeStage2(rule: StageSelectionRule): string {
    if (rule.unlock_level === null || rule.allowance_at_unlock === null || rule.increment_per_level === null) {
      return t('sections.b.stageUndefined', { stage: 2 })
    }
    const base = t('sections.b.stage2', {
      unlock: formatNumber(rule.unlock_level),
      atUnlock: formatNumber(rule.allowance_at_unlock),
      increment: formatNumber(rule.increment_per_level),
    })
    return rule.defined_through_level === null
      ? base
      : `${base} ${t('sections.b.stage2Through', { through: formatNumber(rule.defined_through_level) })}`
  }

  return (
    <ul className="m-0 flex list-disc flex-col gap-2 pl-5 text-arena-300/80 marker:text-ember">
      {lines.map((line, index) => (
        <li key={`${index}-${line}`}>{line}</li>
      ))}
    </ul>
  )
}
