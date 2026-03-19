import ToolGrid from '../components/ToolGrid'

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-header">
        <h1 className="landing-title">ToolKid</h1>
        <p className="landing-subtitle">dozy's toolbox</p>
      </header>
      <ToolGrid />
      <footer className="landing-footer">
        <a
          href="https://github.com/dozybot001"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </footer>
    </div>
  )
}
