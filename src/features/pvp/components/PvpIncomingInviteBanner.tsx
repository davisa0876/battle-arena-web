import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth'
import { usePvpLobbyAlerts } from '../hooks/usePvpLobbyAlerts'
import { isPvpPresenceEligible } from '../lib/isPvpPresenceEligible'

function isImmersiveBattlePath(pathname: string): boolean {
  return pathname.startsWith('/pvp/battles/')
}

/**
 * Global PvP alerts on every authenticated, PvP-eligible screen except an active battle:
 * - pending invite for the invitee
 * - accepted invite for the host
 * - declined invite for the host (free to send another)
 *
 * Online presence itself is owned by `PvpPresenceKeeper` (any screen while logged in + eligible).
 */
export function PvpIncomingInviteBanner() {
  const { t } = useTranslation('pvp')
  const { status, user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const eligible = status === 'authenticated' && isPvpPresenceEligible(user)
  const showUi = eligible && !isImmersiveBattlePath(pathname)
  const { alerts, busyId, error: actionError, accept, decline, dismissDeclined, dismissAccepted } =
    usePvpLobbyAlerts(showUi)

  if (!showUi || alerts.length === 0) {
    return null
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3"
      role="region"
      aria-label={t('alert.region')}
      aria-live="polite"
    >
      <ul className="pointer-events-auto flex w-[min(560px,100%)] list-none flex-col gap-2 p-0">
        {alerts.map((alert) => {
          if (alert.kind === 'incoming') {
            const from = alert.invite.inviter?.handle ?? alert.invite.inviter?.display_name ?? 'trainer'
            return (
              <li
                key={`in-${alert.invite.id}`}
                className="rounded-2xl border border-ember/50 bg-surface/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur"
              >
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-ember">
                  {t('alert.eyebrow')}
                </p>
                <p className="mt-1 text-sm text-white">{t('alert.body', { handle: from })}</p>
                <p className="mt-1 text-xs text-arena-300">{t('alert.nextStepInvitee')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === alert.invite.id}
                    className="rounded-lg bg-ember px-3 py-1.5 text-sm font-semibold text-black disabled:opacity-50"
                    onClick={() => {
                      void (async () => {
                        const room = await accept(alert.invite.id)
                        if (room) {
                          // From any screen (home, collection, rules…) go straight to creature select.
                          navigate('/pvp', {
                            replace: false,
                            state: { focusRoomId: room.id, fromInviteAccept: true },
                          })
                        }
                      })()
                    }}
                  >
                    {t('actions.accept')}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === alert.invite.id}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-arena-100 disabled:opacity-50"
                    onClick={() => {
                      void decline(alert.invite.id)
                    }}
                  >
                    {t('actions.decline')}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg px-3 py-1.5 text-sm font-semibold text-arena-300"
                    onClick={() => navigate('/pvp')}
                  >
                    {t('alert.openLobby')}
                  </button>
                </div>
                {actionError ? (
                  <p className="mt-2 text-xs text-signal-bad" role="alert">
                    {t('errors.actionFailed')}
                  </p>
                ) : null}
              </li>
            )
          }

          if (alert.kind === 'declined') {
            return (
              <li
                key={`no-${alert.invitationId}`}
                className="rounded-2xl border border-signal-bad/40 bg-surface/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur"
              >
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-signal-bad">
                  {t('alert.declinedEyebrow')}
                </p>
                <p className="mt-1 text-sm text-white">{t('alert.declinedBody', { handle: alert.handle })}</p>
                <p className="mt-1 text-xs text-arena-300">{t('alert.declinedNext')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-ember px-3 py-1.5 text-sm font-semibold text-black"
                    onClick={() => {
                      dismissDeclined(alert.invitationId)
                      navigate('/pvp')
                    }}
                  >
                    {t('alert.sendAnother')}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-arena-100"
                    onClick={() => dismissDeclined(alert.invitationId)}
                  >
                    {t('alert.dismiss')}
                  </button>
                </div>
              </li>
            )
          }

          return (
            <li
              key={`ok-${alert.roomId}`}
              className="rounded-2xl border border-signal-ok/50 bg-surface/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-signal-ok">
                {t('alert.acceptedEyebrow')}
              </p>
              <p className="mt-1 text-sm text-white">{t('alert.acceptedBody', { handle: alert.handle })}</p>
              <p className="mt-1 text-xs text-arena-300">{t('alert.nextStepHost')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-ember px-3 py-1.5 text-sm font-semibold text-black"
                  onClick={() => {
                    dismissAccepted(alert.roomId)
                    if (pathname === '/pvp') {
                      window.requestAnimationFrame(() => {
                        document
                          .getElementById('pvp-creature-select')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      })
                      return
                    }
                    navigate('/pvp', {
                      state: { focusRoomId: alert.roomId, fromInviteAccept: true },
                    })
                  }}
                >
                  {t('alert.chooseCreatures')}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
