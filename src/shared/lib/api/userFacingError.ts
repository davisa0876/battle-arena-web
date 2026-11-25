import { ApiError } from './client'

/**
 * Maps any thrown value to a safe, localized string for UI.
 * Technical details stay in the console — never toast/render stacks, status codes, or timeout ms.
 * Pattern aligned with Horus platform-app (`useErrorHandler` + Global toast).
 */
export function toUserFacingMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.kind === 'aborted') {
      return ''
    }

    console.error('[api]', error.debugMessage ?? error.message, {
      kind: error.kind,
      status: error.status,
      cause: error.cause,
    })

    const message = error.message.trim()
    return message || fallback
  }

  console.error('[api]', error)
  return fallback
}
