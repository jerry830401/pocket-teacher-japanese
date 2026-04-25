import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from '@/shared/Layout'
import Home from '@/pages/Home'

const KanaPage        = lazy(() => import('@/features/kana/KanaPage'))
const VocabularyPage  = lazy(() => import('@/features/vocabulary/VocabularyPage'))
const GrammarPage     = lazy(() => import('@/features/grammar/GrammarPage'))

function Loading() {
  return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      載入中⋯
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route
          path="/kana"
          element={
            <Suspense fallback={<Loading />}>
              <KanaPage />
            </Suspense>
          }
        />
        <Route
          path="/vocabulary"
          element={
            <Suspense fallback={<Loading />}>
              <VocabularyPage />
            </Suspense>
          }
        />
        <Route
          path="/grammar"
          element={
            <Suspense fallback={<Loading />}>
              <GrammarPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
