import { useContext, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { acquireCreature, selectStarter } from '../../collection/api/collection'
import { ApiError } from '../../../shared/lib/api/client'
import { buttonClassName } from '../../../shared/components/ui/Button'
import { AuthContext } from '../../auth/context/AuthContext'
import type { Creature } from '../types'

interface AddToCollectionButtonProps {
  creature: Creature
  /** Called after a successful selection so the parent can refresh catalog/detail. */
  onSelected?: () => void
  className?: string
  size?: 'sm' | 'md'
}

export function AddToCollectionButton({
  creature,
  onSelected,
  className = '',
  size = 'md',
}: AddToCollectionButtonProps) {
  const { t } = useTranslation('creatures')
  const auth = useContext(AuthContext)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSelect = creature.can_select === true
  const reason = creature.selection_blocked_reason ?? null
  const disabled = !canSelect || busy

  const label = creature.is_owned
    ? t('selection.owned')
    : busy
      ? t('selection.adding')
      : t('selection.add')

  const title =
    reason && !canSelect
      ? t(`selection.reasons.${reason}`, { defaultValue: t('selection.reasons.unavailable') })
      : undefined

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!canSelect || busy) {
      return
    }

    setBusy(true)
    setError(null)
    try {
      if (creature.selection_action === 'starter') {
        await selectStarter(creature.slug)
      } else {
        const key = `web-acquire:${creature.slug}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`
        await acquireCreature(creature.slug, key)
      }
      await auth?.refreshMe().catch(() => undefined)
      onSelected?.()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('selection.failed'))
    } finally {
      setBusy(false)
    }
  }

  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'

  return (
    <div className={className}>
      <button
        type="button"
        disabled={disabled}
        title={title}
        aria-disabled={disabled}
        onClick={(event) => void handleClick(event)}
        className={`${buttonClassName(canSelect ? 'primary' : 'secondary')} ${sizeClass} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {label}
      </button>
      {error && (
        <p className="mt-2 m-0 text-xs text-signal-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
