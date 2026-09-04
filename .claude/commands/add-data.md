---
description: 為指定 JLPT 等級生成新學習資料、審查正確性，並寫入 JSON
allowed-tools: Read, Write, Edit, Bash
---

為 PTJP 新增 JLPT 學習資料。參數格式：`/add-data <type> <level> <count>`

- `type`：`vocab` 或 `grammar`
- `level`：`N5`、`N4`、`N3`、`N2`、`N1`
- `count`：要新增的筆數（建議 10–50）

範例：`/add-data vocab N4 30`

---

## 步驟一：確認參數

解析 `$ARGUMENTS`，格式為 `<type> <level> <count>`。

- 若參數不足或格式錯誤，停止並說明正確用法。
- 有效 type：`vocab`、`grammar`
- 有效 level：`N5`、`N4`、`N3`、`N2`、`N1`
- count 必須是 1–100 的整數

---

## 步驟二：讀取現有資料

根據 type 讀取對應檔案：
- vocab → `public/data/vocabulary.json`
- grammar → `public/data/grammar.json`

記錄：
1. 目前最大的流水號（例如 `vocab-N5-589` → 589），新資料從下一號開始編號
2. **整個檔案所有 level** 的 `word`（vocab）或 `sentence`（grammar）—— 過濾範圍不限當前 level，因為同一個詞可能已被收錄在其他 level，重複收錄會造成學習資料衝突

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

**可用 tags（JLPT 27 主題分類）：**

| Tag | 說明 |
|-----|------|
| `greeting` | 問候語、寒暄、常用表達 |
| `question` | 疑問詞（なに、どこ、いつ…） |
| `person` | 人稱代名詞（私、あなた…）、職業 |
| `family` | 家族稱謂（母、お父さん…） |
| `number` | 數字、助數詞、序數 |
| `time` | 時間（今日、来年、午後…）、星期 |
| `place` | 場所（学校、駅、公園…） |
| `direction` | 方向、位置（右、上、そこ…） |
| `food` | 食物、料理、飲料 |
| `body` | 身體部位 |
| `home` | 家居、日常物品、家具 |
| `clothing` | 衣物、配件 |
| `nature` | 自然（山、川、花…） |
| `animal` | 動物 |
| `weather` | 天氣（雨、晴れ…） |
| `transport` | 交通工具、移動動詞 |
| `school` | 學校、學習相關 |
| `work` | 工作、職場 |
| `shopping` | 購物、金錢、數量 |
| `hobby` | 興趣、休閒、娛樂 |
| `health` | 健康、身體狀況、醫療 |
| `emotion` | 情感、心理狀態 |
| `color` | 顏色 |
| `size` | 大小、程度形容詞 |
| `adjective` | 其他形容詞（不屬於上述） |
| `verb` | 一般動詞（不屬於上述類別） |
| `adverb` | 副詞、接續詞 |

每筆 vocab 至少標一個 tag，可以標多個。

### Grammar 格式

```json
{
  "id": "grammar-{LEVEL}-{NNN}",
  "type": "grammar",
  "level": "{LEVEL}",
  "payload": {
    "sentence": "含___的日文例句",
    "sentenceRuby": "含___與<ruby>漢字<rt>よみ</rt></ruby>標記的版本",
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
- `sentenceRuby` 是 `sentence` 的 ruby 標記版本，漢字上方顯示平假名讀音
  - 格式：`<ruby>漢字<rt>よみ</rt></ruby>`，`___` 保持原樣不變
  - 假名、助詞、符號不需要加 ruby 標記
  - 例：`<ruby>私<rt>わたし</rt></ruby>___<ruby>学生<rt>がくせい</rt></ruby>です。`
- `choices` 恰好 4 個，`answer` 必須是其中之一，不可重複
- `choices` 的順序：第一個放 answer，其餘為干擾選項
- 干擾選項必須是同類型的助詞或語尾（不能隨意湊數）
- `meaning` 是完整句子的繁體中文翻譯

**Grammar tags 兩層系統：**

第一層（必填一個，代表功能類別）：

| Tag | 說明 |
|-----|------|
| `particle` | 助詞（は、が、を、に、で、へ、と、も、や、から、まで、の、か） |
| `copula` | です／だ、ではありません 等基本判斷表現 |
| `verb-form` | 動詞活用（ます形、て形本身、ない形、目的移動 に行く、すぎ、やすい、にくい） |
| `adjective-form` | い形容詞／な形容詞的活用、連接、修飾 |
| `sentence-pattern` | 複合語法點（てください、たい、できる、なければならない、たら、ば、と思います 等） |
| `tense-aspect` | 時態與體貌（ています、ました、てから、た後で、もう、まだ、時、間、たことがある） |
| `conjunction` | 接續、因果（から原因、ので） |
| `expression` | 固定表達、副詞、疑問詞用法（いつも、たぶん、どこ、どうやって 等） |

第二層（精確標籤，依語法點選填，可複選）：

- **助詞**：`は`、`が`、`を`、`に`、`で`、`へ`、`と`、`も`、`や`、`から`、`まで`、`の`、`か`
- **動詞形式**：`te-form`、`ta-form`、`masu-form`、`nai-form`
- **時態修飾**：`past`、`negative`、`aspect`
- **語法功能**：`conditional`、`permission`、`prohibition`、`obligation`、`desire`、`ability`、`suggestion`、`concession`、`quotation`、`simultaneous`、`purpose`、`intent`、`habit`、`experience`、`existence`、`location`、`request`
- **具體語法點**：`ています`、`てから`、`てください`、`てみる`、`ておく`、`たことがある`、`たほうがいい`、`なければならない`、`ことができる`、`と思います`、`と言いました`、`ながら`、`つもり`、`よう`、`ないように`、`ようにしている`、`に行く`、`すぎ`、`やすい`、`にくい`、`にとって`、`によって`、`によると`、`もらう`
- **副詞**：`adverb`、`interrogative`、`fixed-phrase`
- **形容詞類型**：`i-adj`、`na-adj`

每筆 grammar 格式範例：
- 助詞題：`["particle", "に"]`
- 語法句型：`["sentence-pattern", "te-form", "てください"]`
- 形容詞活用：`["adjective-form", "i-adj", "past"]`
- 接續詞：`["conjunction", "ので"]`

### 生成原則（兩種 type 共用）

- 所有資料必須確實屬於指定 JLPT 等級的範圍
- 不得與現有資料重複（相同的 word 或相同的 sentence 結構）；vocab 須對照**所有 level** 的 word 集合去重，不只是當前 level
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
- [ ] tags 只使用上方表格中的 27 個，且與詞義相符
- [ ] 沒有使用舊版廢棄 tag（object、action、pronoun、expression、conjunction）

**Grammar 審查**
- [ ] `answer` 確實出現在 `choices` 中
- [ ] `choices` 恰好 4 個且無重複
- [ ] 填入 `answer` 後句子文法正確且自然
- [ ] `meaning` 是填入 answer 後完整句子的翻譯
- [ ] 干擾選項與答案是同類型，具有合理迷惑性
- [ ] 文法說明準確
- [ ] tags 第一層必須是以下八個之一：`particle`、`copula`、`verb-form`、`adjective-form`、`sentence-pattern`、`tense-aspect`、`conjunction`、`expression`
- [ ] tags 第二層使用上方表格中的具體標籤，不自創新標籤

若有問題，就地修正後繼續，並在最後報告修正了哪些條目。

---

## 步驟五：寫入

將新資料 append 到現有 JSON 陣列末尾並寫回檔案。

寫入後執行驗證：

```bash
python3 -c "
import json, sys
t = '$ARGUMENTS'.split()[0]
path = 'public/data/vocabulary.json' if t == 'vocab' else 'public/data/grammar.json'
with open(path) as f:
    data = json.load(f)
ids = [c['id'] for c in data]
assert len(ids) == len(set(ids)), 'ID 重複！'
print(f'✔ 共 {len(data)} 筆，無重複 ID')
"
```

---

## 步驟六：回報結果

輸出摘要：
- 新增了幾筆（哪個 type、哪個 level）
- 審查時發現並修正了哪些問題（若無則說「審查通過，無需修正」）
- 現在該 level 共有幾筆
- 提示：可執行 `pnpm run dev` 在瀏覽器確認顯示正常
