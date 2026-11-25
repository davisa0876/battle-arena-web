import { useLocation } from 'react-router-dom'

interface RedirectState {
  from?: { pathname?: string; search?: string }
}

/** Where to send a freshly authenticated visitor: the page a guard bounced them from, else `fallback`. */
export function useRedirectTarget(fallback: string): string {
  const state = useLocation().state as RedirectState | null
  const pathname = state?.from?.pathname

  // Only same-app absolute paths are honoured.
  if (typeof pathname === 'string' && pathname.startsWith('/') && !pathname.startsWith('//')) {
    return `${pathname}${state?.from?.search ?? ''}`
  }

  return fallback
}
