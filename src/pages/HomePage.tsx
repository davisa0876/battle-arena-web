import { Link } from 'react-router-dom'

const modes = [
  {
    icon: '⚔',
    title: 'Solo Battle',
    description: 'Test your team against challenging arena opponents.',
    status: 'Coming Soon',
  },
  {
    icon: '◎',
    title: 'Online Battle',
    description: 'Face players from around the world in real time.',
    status: 'Coming Soon',
  },
  {
    icon: '✦',
    title: 'Creature Collection',
    description: 'Browse the imported creature catalog and study base stats.',
    status: 'Available',
    to: '/creatures',
  },
] as const

export function HomePage() {
  return (
    <>
      <section className="mx-auto w-[min(900px,calc(100%-2.5rem))] px-0 pb-32 pt-28 text-center max-md:pb-24 max-md:pt-20">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ember-400">
          Phase Two
        </p>
        <h1 className="mt-4 font-display text-[clamp(3.5rem,10vw,7.5rem)] font-bold leading-[0.9] tracking-[-0.06em] text-white">
          Battle{' '}
          <span className="bg-linear-to-br from-ember-300 via-ember-400 to-orange-500 bg-clip-text text-transparent">
            Arena
          </span>
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-[clamp(1rem,2.2vw,1.3rem)] text-arena-400">
          Build your team. Master your strategy. Enter the arena.
        </p>
      </section>

      <section
        className="mx-auto w-[min(1120px,calc(100%-2.5rem))] pb-28"
        aria-labelledby="modes-heading"
      >
        <div className="mb-8">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-ember-400">
            Choose your path
          </p>
          <h2
            id="modes-heading"
            className="m-0 font-display text-[clamp(1.6rem,4vw,2.4rem)] font-semibold tracking-[-0.04em] text-white"
          >
            The arena is taking shape
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
          {modes.map((mode) => {
            const content = (
              <>
                <div
                  className="mb-10 grid size-12 place-items-center rounded-[14px] border border-arena-700 bg-arena-900 text-[23px] text-ember-300"
                  aria-hidden="true"
                >
                  {mode.icon}
                </div>
                <span className="absolute top-8 right-7 text-[10px] font-extrabold uppercase tracking-[0.14em] text-arena-400">
                  {mode.status}
                </span>
                <h3 className="mb-2.5 font-display text-[1.35rem] font-semibold text-white">
                  {mode.title}
                </h3>
                <p className="m-0 leading-relaxed text-arena-400">{mode.description}</p>
              </>
            )

            if ('to' in mode) {
              return (
                <Link
                  key={mode.title}
                  to={mode.to}
                  className="relative min-h-[250px] rounded-[20px] border border-ember-400/40 bg-linear-to-br from-arena-800/90 to-arena-950/95 p-8 text-inherit no-underline transition duration-200 hover:-translate-y-1 hover:border-ember-300 max-md:min-h-[220px]"
                >
                  {content}
                </Link>
              )
            }

            return (
              <article
                className="relative min-h-[250px] rounded-[20px] border border-arena-700 bg-linear-to-br from-arena-800/90 to-arena-950/95 p-8 transition duration-200 hover:-translate-y-1 hover:border-ember-400/40 max-md:min-h-[220px]"
                key={mode.title}
              >
                {content}
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}
