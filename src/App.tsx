import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'

const CalmMD = lazy(() => import('./features/calmmd'))
const QuizGo = lazy(() => import('./features/quizgo'))
const AutoSpace = lazy(() => import('./features/auto-space'))
const PureColor = lazy(() => import('./features/pure-color'))
const Translator = lazy(() => import('./features/translator'))
const FetchReadme = lazy(() => import('./features/fetch-readme'))
const FileSizeChart = lazy(() => import('./features/file-size-chart'))

function Loading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100dvh',
      background: '#0e0e12',
      color: '#8a8a9a',
      fontFamily: 'var(--tk-font-sans)',
    }}>
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/calmmd" element={<CalmMD />} />
          <Route path="/quizgo" element={<QuizGo />} />
          <Route path="/auto-space" element={<AutoSpace />} />
          <Route path="/pure-color" element={<PureColor />} />
          <Route path="/translator" element={<Translator />} />
          <Route path="/fetch-readme" element={<FetchReadme />} />
          <Route path="/file-size-chart" element={<FileSizeChart />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
