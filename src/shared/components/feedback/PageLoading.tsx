const LOADING_GIF = '/loading.gif'

interface PageLoadingProps {
  /** Accessible name for screen readers (not shown visually). */
  label?: string
  /** Fill the available viewport area under the app shell. */
  fullPage?: boolean
  className?: string
}

/** Centered loading.gif for page/route waits — no technical/loading text on screen. */
export function PageLoading({ label = 'Loading', fullPage = true, className = '' }: PageLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`grid place-items-center ${fullPage ? 'min-h-[50vh] w-full' : 'w-full py-16'} ${className}`}
    >
      <img
        src={LOADING_GIF}
        alt=""
        width={192}
        height={192}
        className="h-48 w-48 object-contain"
        decoding="async"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
