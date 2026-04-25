import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from '@/shared/Layout'
import Home from '@/pages/Home'

const KanaPage = lazy(() => import('@/features/kana/KanaPage'))

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
      </Route>
    </Routes>
  )
}

export default App
