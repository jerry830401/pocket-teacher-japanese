---
description: 為指定 JLPT 等級生成新學習資料、審查正確性，並寫入 JSON
allowed-tools: Read, Write, Edit, Bash
---

為 PTJP 新增 JLPT 學習資料。參數格式：`/add-data <type> <level> <count>`

- `type`：`vocab` 或 `grammar`
- `level`：`N5`、`N4`、`N3`、`N2`、`N1`
- `count`：要新增的筆數（建議 10–30）

範例：`/add-data vocab N5 20`

---

## 步驟一：確認參數

解析 `$ARGUMENTS`，格式為 `<type> <level> <count>`。

- 若參數不足或格式錯誤，停止並說明正確用法。
- 有效 type：`vocab`、`grammar`
- 有效 level：`N5`、`N4`、`N3`、`N2`、`N1`
- count 必須是 1–50 的整數

---

## 步驟二：讀取現有資料

根據 type 讀取對應檔案：
- vocab → `public/data/vocabulary.json`
- grammar → `public/data/grammar.json`

記錄：
1. 目前最大的流水號（例如 `vocab-N5-100` → 100），新資料從 101 開始編號
2. 現有該 level 的所有 `word`（vocab）或 `answer`+`sentence`（grammar），避免重複

---

## 步驟三：生成新資料

根據 type 生成 `count` 筆新資料，嚴格遵守以下格式與規範。

### Vocab 格式

```json
{
  "id": "vocab-{LEVEL}-{NNN}",
  "type": "vocabulary",
  "level": "{LEVEL}",
  "payload": {
    "word": "漢字或假名",
    "reading": "平假名讀音",
    "meaning": "繁體中文意思",
    "pos": "noun|verb|i-adj|na-adj|adverb"
  },
  "tags": ["適當的分類標籤"]
}
```

可用 tags：`pronoun`、`person`、`family`、`place`、`object`、`food`、`transport`、`time`、`weather`、`emotion`、`action`、`size`

### Grammar 格式

```json
{
  "id": "grammar-{LEVEL}-{NNN}",
  "type": "grammar",
  "level": "{LEVEL}",
  "payload": {
    "sentence": "含___的日文例句",
    "answer": "正確填入的助詞或語尾",
    "choices": ["answer", "錯誤選項1", "錯誤選項2", "錯誤選項3"],
    "meaning": "繁體中文翻譯",
    "grammar": "文法名稱：繁體中文說明"
  },
  "tags": ["相關助詞或文法標籤"]
}
```

Grammar 規範：
- `sentence` 必須含且只含一個 `___`
- `choices` 恰好 4 個，`answer` 必須是其中之一，不可重複
- `choices` 的順序：第一個放 answer，其餘為干擾選項
- 干擾選項必須是同類型的助詞或語尾（不能隨意湊數）
- `meaning` 是完整句子的繁體中文翻譯

### 生成原則（兩種 type 共用）

- 所有資料必須確實屬於指定 JLPT 等級的範圍
- 不得與現有資料重複（相同的 word 或相同的 sentence 結構）
- `reading` 只用平假名，不含漢字
- `meaning` 用繁體中文，不用簡體
- 意思若有多個常見用法，用頓號分隔（例如：「現在、此刻」）

---

## 步驟四：審查

逐條自我審查以下項目，標出有問題的條目：

**Vocab 審查**
- [ ] 讀音正確（例如 食べる → たべる，不是 しょくべる）
- [ ] 意思符合該等級的常見用法（不用罕見義項）
- [ ] pos 分類正確（動詞用 verb，い形容詞用 i-adj）
- [ ] tags 與詞義相符

**Grammar 審查**
- [ ] `answer` 確實出現在 `choices` 中
- [ ] `choices` 恰好 4 個且無重複
- [ ] 填入 `answer` 後句子文法正確且自然
- [ ] `meaning` 是填入 answer 後完整句子的翻譯
- [ ] 干擾選項與答案是同類型，具有合理迷惑性
- [ ] 文法說明準確

若有問題，就地修正後繼續，並在最後報告修正了哪些條目。

---

## 步驟五：寫入

將新資料 append 到現有 JSON 陣列末尾並寫回檔案。

寫入後執行驗證：

```bash
python3 -c "
import json, sys
path = 'public/data/vocabulary.json' if 'vocab' in sys.argv[1] else 'public/data/grammar.json'
with open(path) as f:
    data = json.load(f)
ids = [c['id'] for c in data]
assert len(ids) == len(set(ids)), 'ID 重複！'
print(f'✔ 共 {len(data)} 筆，無重複 ID')
" vocab
```

---

## 步驟六：回報結果

輸出摘要：
- 新增了幾筆（哪個 type、哪個 level）
- 審查時發現並修正了哪些問題（若無則說「審查通過，無需修正」）
- 現在該 level 共有幾筆
- 提示：可執行 `npm run dev` 在瀏覽器確認顯示正常
