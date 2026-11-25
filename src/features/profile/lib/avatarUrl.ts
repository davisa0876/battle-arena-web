/**
 * Avatar URLs are stable (`/api/avatars/{userId}`), so after an upload/removal the browser could keep
 * serving the old image. Bumping this in-memory counter appends a cache-busting query for the session.
 */
let avatarVersion = 0

export function bumpAvatarVersion(): void {
  avatarVersion = Date.now()
}

export function withAvatarVersion(url: string | null): string | null {
  if (!url || avatarVersion === 0) {
    return url
  }
  return `${url}${url.includes('?') ? '&' : '?'}v=${avatarVersion}`
}
