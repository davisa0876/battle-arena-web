import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CreatureImageProps {
  src?: string | null
  alt: string
  className?: string
}

type ImageStatus = 'loading' | 'loaded' | 'error'

function initialsFromAlt(alt: string): string {
  const initials = alt
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return initials || 'BA'
}

export function CreatureImage({ src, alt, className = '' }: CreatureImageProps) {
  const { t } = useTranslation('creatures')
  const [imageState, setImageState] = useState<{ src?: string | null; status: ImageStatus }>({
    src,
    status: src ? 'loading' : 'error',
  })
  const initials = useMemo(() => initialsFromAlt(alt), [alt])
  const status: ImageStatus = imageState.src === src ? imageState.status : src ? 'loading' : 'error'

  return (
    <div
      className={`relative grid overflow-hidden rounded-[22px] border border-border bg-[radial-gradient(circle_at_35%_22%,rgba(39,201,236,0.18),transparent_48%),linear-gradient(145deg,#151C2B,#0B0F1B)] ${className}`}
    >
      {src && status !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageState({ src, status: 'loaded' })}
          onError={() => setImageState({ src, status: 'error' })}
          className={`absolute inset-0 size-full object-contain p-4 transition-opacity motion-reduce:transition-none ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
      {status === 'loading' && (
        <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-arena-300/70" aria-live="polite">
          {t('image.loading')}
        </div>
      )}
      {status === 'error' && (
        <div
          className="absolute inset-0 grid place-items-center text-center text-ember"
          role="img"
          aria-label={t('image.fallback', { name: alt })}
        >
          <span className="font-display text-3xl font-bold tracking-wide">{initials}</span>
        </div>
      )}
    </div>
  )
}
