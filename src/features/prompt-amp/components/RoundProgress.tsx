import type { RoundStatus } from '../lib/types'

const labels = ['分析意图', '生成规格', '自审优化']

interface Props {
  rounds: [RoundStatus, RoundStatus, RoundStatus]
}

export default function RoundProgress({ rounds }: Props) {
  return (
    <div className="pa-progress">
      {rounds.map((status, i) => (
        <div key={i} className={`pa-step pa-step--${status}`}>
          <div className="pa-step-dot">
            {status === 'done' ? '✓' : status === 'error' ? '!' : i + 1}
          </div>
          <span className="pa-step-label">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}
