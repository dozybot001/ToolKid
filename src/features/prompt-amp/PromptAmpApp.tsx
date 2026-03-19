import { useState, useCallback, useRef } from 'react'
import BackNav from '../../components/BackNav'
import ApiSettings from './components/ApiSettings'
import RoundProgress from './components/RoundProgress'
import SpecEditor from './components/SpecEditor'
import { callLLM } from './lib/api'
import { buildRound1Prompt, buildRound2Prompt, buildRound3Prompt } from './lib/prompts'
import type { ApiConfig, SpecSection, RoundStatus } from './lib/types'

function parseSections(text: string): SpecSection[] {
  const parts = text.split(/^## /m).filter(Boolean)
  return parts.map((part, i) => {
    const newline = part.indexOf('\n')
    const title = newline > -1 ? part.slice(0, newline).trim() : part.trim()
    const content = newline > -1 ? part.slice(newline + 1).trim() : ''
    return { id: `s-${i}`, title, content }
  })
}

export default function PromptAmpApp() {
  const [prompt, setPrompt] = useState('')
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null)
  const [rounds, setRounds] = useState<[RoundStatus, RoundStatus, RoundStatus]>(['idle', 'idle', 'idle'])
  const [sections, setSections] = useState<SpecSection[]>([])
  const [streamText, setStreamText] = useState('')
  const [error, setError] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const updateRound = (index: number, status: RoundStatus) => {
    setRounds((prev) => {
      const next = [...prev] as [RoundStatus, RoundStatus, RoundStatus]
      next[index] = status
      return next
    })
  }

  const handleAmplify = useCallback(async () => {
    if (!apiConfig?.apiKey) {
      setError('请先配置 API Key')
      return
    }
    if (!prompt.trim()) {
      setError('请输入你的初始 prompt')
      return
    }

    setError('')
    setSections([])
    setStreamText('')
    setIsRunning(true)
    setRounds(['idle', 'idle', 'idle'])

    const abort = new AbortController()
    abortRef.current = abort

    try {
      // Round 1: Analyze
      updateRound(0, 'running')
      const round1 = await callLLM(
        apiConfig,
        buildRound1Prompt(prompt.trim()),
        (text) => setStreamText(text),
        abort.signal,
      )
      updateRound(0, 'done')

      // Round 2: Generate spec
      updateRound(1, 'running')
      setStreamText('')
      const round2 = await callLLM(
        apiConfig,
        buildRound2Prompt(prompt.trim(), round1),
        (text) => {
          setStreamText(text)
          setSections(parseSections(text))
        },
        abort.signal,
      )
      updateRound(1, 'done')

      // Round 3: Self-review
      updateRound(2, 'running')
      setStreamText('')
      const round3 = await callLLM(
        apiConfig,
        buildRound3Prompt(round2),
        (text) => {
          setStreamText(text)
          setSections(parseSections(text))
        },
        abort.signal,
      )
      updateRound(2, 'done')
      setSections(parseSections(round3))
      setStreamText('')
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      const failedRound = rounds.findIndex((r) => r === 'running')
      if (failedRound >= 0) updateRound(failedRound, 'error')
      setError(e instanceof Error ? e.message : '未知错误')
    } finally {
      setIsRunning(false)
      abortRef.current = null
    }
  }, [apiConfig, prompt])

  const handleStop = () => {
    abortRef.current?.abort()
    setIsRunning(false)
  }

  const hasProgress = rounds.some((r) => r !== 'idle')

  return (
    <>
      <BackNav />
      <div className="tk-page-header">
        <h1 className="tk-page-title">Prompt Amplifier</h1>
        <p className="tk-page-subtitle">
          输入粗略想法，通过 3 轮 AI 分析，生成结构化的详细 Prompt 规格
        </p>
      </div>

      <ApiSettings onChange={setApiConfig} />

      <div className="pa-input-area">
        <textarea
          className="tk-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="输入你的初始想法，例如：帮我写一个登录页面..."
          disabled={isRunning}
        />
        <div className="pa-actions tk-row">
          <button className="tk-btn" onClick={handleAmplify} disabled={isRunning}>
            {isRunning ? '生成中…' : '放大 Prompt'}
          </button>
          {isRunning && (
            <button className="tk-btn tk-btn--ghost" onClick={handleStop}>
              停止
            </button>
          )}
        </div>
      </div>

      {error && <p className="pa-error">{error}</p>}

      {hasProgress && <RoundProgress rounds={rounds} />}

      {isRunning && streamText && sections.length === 0 && (
        <div className="pa-stream-preview tk-surface">
          <span className="tk-label">分析中…</span>
          <pre className="pa-stream-text">{streamText}</pre>
        </div>
      )}

      <SpecEditor
        sections={sections}
        onChange={setSections}
        streaming={isRunning}
      />
    </>
  )
}
