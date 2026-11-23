import './App.css'
import { SystemStatus } from './components/SystemStatus'

function App() {
  const modes = [
    { icon: '⚔', title: 'Solo Battle', description: 'Test your team against challenging arena opponents.' },
    { icon: '◎', title: 'Online Battle', description: 'Face players from around the world in real time.' },
    { icon: '✦', title: 'Creature Collection', description: 'Discover, collect, and train legendary creatures.' },
  ]

  return (
    <main>
      <nav className="nav" aria-label="Main navigation">
        <a className="brand" href="/" aria-label="Battle Arena home">
          <span className="brand-mark" aria-hidden="true">BA</span>
          Battle Arena
        </a>
        <SystemStatus />
      </nav>

      <section className="hero">
        <div className="eyebrow">Phase One</div>
        <h1>Battle <span>Arena</span></h1>
        <p>Build your team. Master your strategy. Enter the arena.</p>
      </section>

      <section className="modes" aria-labelledby="modes-heading">
        <div className="section-heading">
          <p>Choose your path</p>
          <h2 id="modes-heading">The arena is taking shape</h2>
        </div>
        <div className="mode-grid">
          {modes.map((mode) => (
            <article className="mode-card" key={mode.title}>
              <div className="mode-icon" aria-hidden="true">{mode.icon}</div>
              <span className="coming-soon">Coming Soon</span>
              <h3>{mode.title}</h3>
              <p>{mode.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer>© {new Date().getFullYear()} Battle Arena · Prepare for battle</footer>
    </main>
  )
}

export default App
