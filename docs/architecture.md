# PTJP 架構文件

> 本文件記錄核心資料流與設計不變式。修改測驗、複習、SRS 相關功能前，請先對照此文件確認沒有違反規範。

## 學習 → 測驗 → 錯題複習 流程

### 關鍵檔案

| 檔案 | 職責 |
|------|------|
| `src/pages/QuizPage.tsx` | 測驗頁（科目 tile、各 Screen 元件） |
| `src/pages/ReviewPage.tsx` | 錯題複習頁（弱卡列表 + 啟動複習） |
| `src/features/kana/components/FlashCardQuiz.tsx` | 假名測驗（QuizPage 與 ReviewPage 共用） |
| `src/features/vocabulary/components/VocabQuiz.tsx` | 單字測驗（QuizPage 與 ReviewPage 共用） |
| `src/features/grammar/components/GrammarQuiz.tsx` | 文法測驗（QuizPage 與 ReviewPage 共用） |
| `src/features/listening/components/ListeningQuiz.tsx` | 聽力測驗（僅 QuizPage，不進入弱卡複習） |
| `src/lib/srs/sm2.ts` | SM-2 間隔重複演算法 |
| `src/lib/db/db.ts` | IndexedDB 操作（markAsSeen、getSeenIds、saveCard） |

### 資料流

```
public/data/*.json
    ↓ loadVocabulary() / loadGrammar() / loadKana()
所有卡片
    ↓ getSeenIds()   ← 篩出 IndexedDB 有記錄的（= 看過的）
已看過的卡片
    ↓ VocabQuiz / GrammarQuiz / FlashCardQuiz / ListeningQuiz
答題 → review(card, quality)
    ↓ saveCard()
IndexedDB srsCards
    ↓ isWeak() 篩選（ReviewPage 啟動時）
弱卡清單 → ReviewPage 顯示
    ↓ startReview(subject, ids)
複習測驗（同一套 Quiz 元件）
```

### SRS 更新規則（`src/lib/srs/sm2.ts`）

答題時呼叫 `review(card, quality)`：
- 答對：`quality = 5`
- 答錯：`quality = 1`

| 情況 | repetitions | easeFactor | interval |
|------|-------------|------------|---------|
| 答對 (q ≥ 3) | +1 | 微升 | rep=0 → 1天；rep=1 → 6天；rep≥2 → interval × EF |
| 答錯 (q < 3) | 重設為 0 | 下降（最低 1.3） | 重設為 1 天 |

### 弱卡判定（`src/pages/ReviewPage.tsx`）

```ts
function isWeak(card: SrsCard) {
  return card.easeFactor < 2.5 && card.repetitions < 3
}
```

兩個條件都必須成立：難易係數因答錯而低於初始值 2.5，**且**連續答對次數不足 3。

### 測驗前置條件（`src/pages/QuizPage.tsx`）

測驗只抽「已看過的牌」。看過的牌數量必須 ≥ `roundSize`（預設值由 `useSettings` 讀取），否則顯示「尚未學習足夠題目」。

## 不變式（Invariants）

修改任何測驗或複習功能時，以下規則不得違反：

1. **Quiz 元件共用**：學習（QuizPage）和複習（ReviewPage）使用同一套 Quiz 元件，SRS 更新邏輯必須保持一致，不得在複習路徑另開分支。
2. **弱卡篩選職責**：Quiz 元件不判斷「弱卡」，弱卡篩選由 ReviewPage 負責，透過 `cards` prop 傳入。
3. **新增科目時同步 ReviewPage**：新增科目若需要弱卡複習，必須在 ReviewPage 的科目篩選邏輯中加入對應的 `cardId` 前綴（目前支援 `kana-`、`vocab-`、`grammar-`）。聽力科目刻意不進入弱卡複習，因為其卡片底層複用 `vocab-` 前綴。
4. **markAsSeen 與 saveCard 不混用**：`markAsSeen` 只在「第一次瀏覽」時呼叫（寫入初始 SrsCard）；答題結果更新走 `saveCard(review(card, quality))`，兩條路徑不能互換。
5. **測驗前先學習**：Quiz 元件收到的 `cards` 必定是已看過的牌，不允許直接把全部卡片丟進測驗。
