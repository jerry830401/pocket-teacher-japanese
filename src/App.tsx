import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/shared/Layout'

const LearnPage    = lazy(() => import('@/pages/LearnPage'))
const QuizPage     = lazy(() => import('@/pages/QuizPage'))
const ReviewPage   = lazy(() => import('@/pages/ReviewPage'))
const ProgressPage = lazy(() => import('@/features/progress/ProgressPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))

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
        <Route path="/" element={<Navigate to="/learn" replace />} />
        <Route
          path="/learn"
          element={
            <Suspense fallback={<Loading />}>
              <LearnPage />
            </Suspense>
          }
        />
        <Route
          path="/quiz"
          element={
            <Suspense fallback={<Loading />}>
              <QuizPage />
            </Suspense>
          }
        />
        <Route
          path="/review"
          element={
            <Suspense fallback={<Loading />}>
              <ReviewPage />
            </Suspense>
          }
        />
        <Route
          path="/progress"
          element={
            <Suspense fallback={<Loading />}>
              <ProgressPage />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<Loading />}>
              <SettingsPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
