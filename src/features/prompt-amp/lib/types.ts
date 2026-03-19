export interface ApiConfig {
  endpoint: string
  apiKey: string
  model: string
}

export interface SpecSection {
  id: string
  title: string
  content: string
}

export type RoundStatus = 'idle' | 'running' | 'done' | 'error'

export interface RoundState {
  status: RoundStatus
  output: string
}
