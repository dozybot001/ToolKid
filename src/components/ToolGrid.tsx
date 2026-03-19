import { featuredTools, miniTools } from '../data/tools'
import ToolCard from './ToolCard'

export default function ToolGrid() {
  return (
    <div className="tool-sections">
      {/* Featured: 独立风格工具，大卡片 */}
      <div className="tool-grid-featured">
        {featuredTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} variant="featured" />
        ))}
      </div>

      {/* Mini: 统一风格小工具，一行排列 */}
      <div className="tool-grid-mini">
        {miniTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} variant="mini" />
        ))}
      </div>
    </div>
  )
}
