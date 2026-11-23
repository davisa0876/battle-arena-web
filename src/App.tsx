import { SystemStatus } from './components/SystemStatus'

const modes = [
  {
    icon: '⚔',
    title: 'Solo Battle',
    description: 'Test your team against challenging arena opponents.',
  },
  {
    icon: '◎',
    title: 'Online Battle',
    description: 'Face players from around the world in real time.',
  },
  {
    icon: '✦',
    title: 'Creature Collection',
    description: 'Discover, collect, and train legendary creatures.',
  },
] as const

function App() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_50%_8%,rgba(255,138,76,0.16),transparent_34rem),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[auto,48px_48px,48px_48px] bg-arena-950">
      <nav
        className="mx-auto flex w-[min(1120px,calc(100%-2.5rem))] items-center justify-between py-6 max-md:w-[min(1120px,calc(100%-1.75rem))]"
        aria-label="Main navigation"
      >
        <a
          className="flex items-center gap-3 font-display text-base font-bold tracking-wide text-white no-underline max-md:text-[0]"
          href="/"
          aria-label="Battle Arena home"
        >
          <span
            className="grid size-9 place-items-center rounded-[10px] border border-ember-400/50 bg-ember-400/10 font-sans text-xs tracking-[0.08em] text-ember-300"
            aria-hidden="true"
          >
            BA
          </span>
          Battle Arena
        </a>
        <SystemStatus />
      </nav>

      <section className="mx-auto w-[min(900px,calc(100%-2.5rem))] px-0 pb-32 pt-28 text-center max-md:pb-24 max-md:pt-20">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ember-400">
          Phase One
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
          {modes.map((mode) => (
            <article
              className="relative min-h-[250px] rounded-[20px] border border-arena-700 bg-linear-to-br from-arena-800/90 to-arena-950/95 p-8 transition duration-200 hover:-translate-y-1 hover:border-ember-400/40 max-md:min-h-[220px]"
              key={mode.title}
            >
              <div
                className="mb-10 grid size-12 place-items-center rounded-[14px] border border-arena-700 bg-arena-900 text-[23px] text-ember-300"
                aria-hidden="true"
              >
                {mode.icon}
              </div>
              <span className="absolute top-8 right-7 text-[10px] font-extrabold uppercase tracking-[0.14em] text-arena-400">
                Coming Soon
              </span>
              <h3 className="mb-2.5 font-display text-[1.35rem] font-semibold text-white">
                {mode.title}
              </h3>
              <p className="m-0 leading-relaxed text-arena-400">{mode.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-arena-800 px-5 py-7 text-center text-xs text-arena-400/70">
        © {new Date().getFullYear()} Battle Arena · Prepare for battle
      </footer>
    </main>
  )
}

export default App
