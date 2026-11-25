import { useState } from 'react'

interface PlayerAvatarProps {
  src: string | null
  /** Accessible description (also the source of the fallback initials). */
  alt: string
  initialsFrom: string
  className?: string
}

function initials(source: string): string {
  const value = source
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return value || 'BA'
}

/** Round avatar with an initials fallback when there is no image (or it fails to load). */
export function PlayerAvatar({ src, alt, initialsFrom, className = 'size-24' }: PlayerAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = src !== null && failedSrc !== src

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-[radial-gradient(circle_at_35%_22%,rgba(39,201,236,0.18),transparent_55%),linear-gradient(145deg,#151C2B,#0B0F1B)] ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="size-full object-cover"
          decoding="async"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span role="img" aria-label={alt} className="font-display text-2xl font-bold tracking-wide text-ember">
          {initials(initialsFrom)}
        </span>
      )}
    </div>
  )
}
