import { Link } from 'react-router-dom'
import type { Tool } from '../data/tools'

interface ToolCardProps {
  tool: Tool
  variant: 'featured' | 'mini'
}

export default function ToolCard({ tool, variant }: ToolCardProps) {
  if (variant === 'mini') {
    return (
      <Link className="mini-card" to={tool.path}>
        <span className="mini-card-icon">{tool.icon}</span>
        <span className="mini-card-name">{tool.name}</span>
        <span className="mini-card-subtitle">{tool.subtitle}</span>
      </Link>
    )
  }

  return (
    <Link
      className={`featured-card featured-card--${tool.id}`}
      to={tool.path}
      style={{ '--card-accent': tool.accent } as React.CSSProperties}
    >
      <div className="featured-card-content">
        <div className="featured-card-icon">{tool.icon}</div>
        <div className="featured-card-name">{tool.name}</div>
        <div className="featured-card-subtitle">{tool.subtitle}</div>
        <div className="featured-card-description">{tool.description}</div>
        <div className="featured-card-tags">
          {tool.tags.map((tag) => (
            <span key={tag} className="featured-card-tag">{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
