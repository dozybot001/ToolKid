import { Link } from 'react-router-dom'

export default function BackNav() {
  return (
    <nav className="tk-nav">
      <Link to="/" className="tk-nav-back">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 3L5 8l5 5" />
        </svg>
        ToolKid
      </Link>
    </nav>
  )
}
