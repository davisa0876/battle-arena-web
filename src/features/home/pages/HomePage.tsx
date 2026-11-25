import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import logoHorizontal from '../../../assets/brand/logo_horizontal.svg'

export function HomePage() {
  const { t } = useTranslation(['common', 'navigation'])
  const modes = [
    {
      code: 'SB',
      title: t('home.modes.solo.title'),
      description: t('home.modes.solo.description'),
      status: t('home.status.available'),
      to: '/pve',
    },
    {
      code: 'OB',
      title: t('home.modes.online.title'),
      description: t('home.modes.online.description'),
      status: t('home.status.comingSoon'),
    },
    {
      code: 'CC',
      title: t('home.modes.collection.title'),
      description: t('home.modes.collection.description'),
      status: t('home.status.available'),
      to: '/creatures',
    },
  ] as const

  return (
    <>
      <section className="mx-auto w-[min(960px,calc(100%-2rem))] px-0 pb-28 pt-20 text-center max-sm:w-[min(960px,calc(100%-1.25rem))] max-sm:pt-14">
        <img src={logoHorizontal} alt={t('navigation:brandAlt')} className="mx-auto h-auto w-[min(420px,90vw)]" />
        <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.18em] text-ember">
          {t('home.phase')}
        </p>
        <h1 className="mt-4 font-display text-[clamp(3rem,10vw,7rem)] font-bold leading-[0.9] tracking-[-0.06em] text-white">
          {t('home.heroTitle')}
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-[clamp(1rem,2.2vw,1.3rem)] text-arena-300/80">
          {t('home.heroSubtitle')}
        </p>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-2rem))] pb-28" aria-labelledby="modes-heading">
        <div className="mb-8">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-ember">
            {t('home.modesEyebrow')}
          </p>
          <h2 id="modes-heading" className="m-0 font-display text-[clamp(1.6rem,4vw,2.5rem)] font-semibold tracking-[-0.04em] text-white">
            {t('home.modesTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
          {modes.map((mode) => {
            const content = (
              <>
                <div className="mb-10 grid size-12 place-items-center rounded-[14px] border border-border bg-background font-display text-sm font-bold text-electric" aria-hidden="true">
                  {mode.code}
                </div>
                <span className="absolute right-7 top-8 text-[10px] font-extrabold uppercase tracking-[0.14em] text-arena-300/60">
                  {mode.status}
                </span>
                <h3 className="mb-2.5 font-display text-[1.35rem] font-semibold text-white">{mode.title}</h3>
                <p className="m-0 leading-relaxed text-arena-300/80">{mode.description}</p>
              </>
            )

            if ('to' in mode) {
              return (
                <Link key={mode.title} to={mode.to} className="relative min-h-[250px] rounded-[24px] border border-ember/40 bg-linear-to-br from-surface/95 to-background/95 p-8 text-inherit no-underline shadow-card transition duration-200 hover:-translate-y-1 hover:border-ember max-md:min-h-[220px] motion-reduce:transform-none motion-reduce:transition-none">
                  {content}
                </Link>
              )
            }

            return (
              <article className="relative min-h-[250px] rounded-[24px] border border-border bg-linear-to-br from-surface/95 to-background/95 p-8 shadow-card transition duration-200 hover:border-electric/40 max-md:min-h-[220px] motion-reduce:transition-none" key={mode.title}>
                {content}
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}
