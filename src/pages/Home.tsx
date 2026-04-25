export default function Home() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          歡迎 <span className="text-slate-400">·</span> ようこそ
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Pocket Teacher Japanese — 純瀏覽器執行的日文學習工具。
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-6 text-sm text-slate-500">
        Phase 0 骨架已建立。五十音、單字、漢字、文法、聽力、句型等模組將在後續 Phase 陸續加入。
      </div>
    </section>
  )
}
