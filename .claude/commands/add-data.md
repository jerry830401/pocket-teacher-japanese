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

## 步驟二：查詢現有資料

```bash
node scripts/jlpt-data.mjs stats <type> <level>
```

輸出兩件事：各 level 目前筆數與**下一個可用 id**，以及**所有 level** 的既有 `word`（vocab）／`sentence`（grammar）清單。

- **不要用 Read 直接讀 `public/data/*.json`**。這兩個檔案已超過 1400 筆、400KB，整份讀進 context 只為了拿去重清單，代價完全不成比例。
- 去重範圍是整個檔案、不分 level：同一個詞若已收錄在別的 level，再收一次會造成學習資料衝突。

---

## 步驟三：生成新資料

根據 type 生成 `count` 筆新資料，嚴格遵守以下格式與規範。
**id 交給步驟四的腳本自動配號，這裡可以省略 `id` 欄位**（若要自己填，必須從步驟二的「下一個可用 id」開始連號）。

### Vocab 格式

```json
{
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

**可用 tags（28 個主題分類）：**

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
| `hobby` | 興趣、休閒、娛樂、運動 |
| `health` | 健康、身體狀況、醫療 |
| `emotion` | 情感、心理狀態 |
| `color` | 顏色 |
| `size` | 大小、程度形容詞 |
| `adjective` | 其他形容詞（不屬於上述） |
| `verb` | 一般動詞（不屬於上述類別） |
| `adverb` | 副詞、接續詞（だから、でも、そして…） |
| `misc` | 不屬於任何主題的抽象名詞（理由、方法、結果…） |

每筆 vocab 至少標一個 tag，可以標多個。

> 白名單的**強制來源是 `src/lib/data/tags.ts`**，上表只是附說明的版本。自創 tag 會在步驟五被測試擋下；要新增分類，先改 `tags.ts` 再改這張表。

### Grammar 格式

```json
{
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
- `sentenceRuby` 是 `sentence` 的 ruby 標記版本，**去掉 `<ruby>`／`<rt>` 標記後必須逐字等於 `sentence`**
  - 格式：`<ruby>漢字<rt>よみ</rt></ruby>`，`___` 保持原樣不變
  - 假名、助詞、符號不需要加 ruby 標記
  - 例：`<ruby>私<rt>わたし</rt></ruby>___<ruby>学生<rt>がくせい</rt></ruby>です。`
- `choices` 恰好 4 個，`answer` 必須是其中之一，不可重複
- `choices` 的順序：第一個放 answer，其餘為干擾選項
- 干擾選項必須是同類型的助詞或語尾，且**填進去之後必須是錯的**（見步驟五的「唯一解」檢查）
- `meaning` 是完整句子的繁體中文翻譯

**Grammar tags 兩層系統：**

第一層（必填至少一個，代表功能類別）：

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

第二層（精確標籤，依語法點選填，可複選）：完整清單在 `src/lib/data/tags.ts` 的 `GRAMMAR_TIER2_TAGS`，大致分為助詞（`は`、`が`、`を`…）、動詞形式（`te-form`、`ta-form`…）、時態（`past`、`negative`、`aspect`…）、語法功能（`conditional`、`obligation`、`ability`…）、具體語法點（`ています`、`てください`、`なければならない`…）、副詞與形容詞類型。**不要自創**，需要新標籤就先加進 `tags.ts`。

第二層**不要放主題標籤**（`transport`、`work`、`greeting` 這類屬於 vocab 的分類），文法卡只描述語法。

每筆 grammar 格式範例：
- 助詞題：`["particle", "に"]`
- 語法句型：`["sentence-pattern", "te-form", "てください"]`
- 形容詞活用：`["adjective-form", "i-adj", "past"]`
- 接續詞：`["conjunction", "ので"]`

### 生成原則（兩種 type 共用）

- 所有資料必須確實屬於指定 JLPT 等級的範圍
- 不得與現有資料重複；對照步驟二輸出的**所有 level** 清單去重
- `reading` 只用平假名，不含漢字
- `meaning` 用繁體中文，不用簡體
- 意思若有多個常見用法，用頓號分隔（例如：「現在、此刻」）

---

## 步驟四：寫入

**用 Write 工具**把生成的陣列寫成暫存 JSON（例如 `tmp-add-data.json`）。
不要用 Bash heredoc——幾十筆以上的 JSON 會讓 heredoc 解析失敗（`unexpected EOF`）而且不會建檔。寫好後：

```bash
node scripts/jlpt-data.mjs append <type> tmp-add-data.json
```

腳本會自動配號、擋掉重複的 id／word／sentence，並保留原檔的 2 空格 + CRLF 格式。
寫入成功後刪掉暫存檔。若腳本因重複而中止，回步驟三改掉那幾筆再重跑（腳本是全有全無，不會寫入半套）。

---

## 步驟五：驗證與審查

```bash
pnpm exec vitest run src/lib/data
```

**這些規則已經由測試強制，不需要人工逐條檢查**：id 格式與唯一性、level 合法、`pos` 白名單、`reading` 純平假名、tag 白名單（vocab 與 grammar 兩層）、跨 level 的 word／sentence 去重、同 level 的 meaning 去重、`___` 恰好一個、`sentenceRuby` 與 `sentence` 一致、`choices` 恰 4 個無重複、`answer` 在 `choices` 內。測試紅了就照訊息修，修到綠。

釋義撞車再多跑一道機械檢查（`meaning` 部分重疊不會被測試擋下，但 quiz 會出現兩個都對的按鈕）：

```bash
node scripts/jlpt-data.mjs overlap vocab last:<count>
```

修完釋義要**重跑 `overlap` 整個 level**（`overlap vocab <LEVEL>`）——改寫很容易撞到第三筆條目。

**其餘測試判不出來的部分，交給 `data-reviewer` subagent 審**：

```
用 data-reviewer 審 <type> 最後 <count> 筆
```

它會用 `node scripts/jlpt-data.mjs show <type> last:<count>` 取回剛寫入的條目逐條檢查，回報問題清單但不改檔案——幾十筆條目的審查過程因此不佔用這裡的 context。它檢查的是：

- [ ] **讀音正確**（食べる → たべる，不是 しょくべる）——機器只驗「是不是平假名」，不驗「對不對」
- [ ] **意思符合該等級的常見用法**，不用罕見義項；`pos` 與詞義相符
- [ ] **釋義要能區分**：同 level 內 `meaning` 字串完全相同會被測試擋下（quiz 按鈕印的就是 meaning）。真同義詞（危ない／危険な）要在釋義裡寫出差別，寫不出差別就別收第二個
- [ ] **等級歸屬正確**，不要把 N3 的詞塞進 N5
- [ ] **唯一解**：把每個干擾選項實際填回句子，確認它在該語境下真的是錯的。這是最常見的瑕疵——`に`／`へ`、`から`／`ので`、`上手`／`得意` 這類可互換的組合放在同一題，學習者選了正確答案卻被判錯
- [ ] **`meaning` 是填入 `answer` 後整句的翻譯**，不是題幹的翻譯
- [ ] **文法說明準確**，且與 `answer` 對應

拿到報告後由你來改（你握有生成當下的脈絡）：就地編輯 `public/data/*.json`，改完重跑上面的測試。報告裡標為「待確認」的項目不要自行猜測，在步驟六一併告訴使用者。

若不開 subagent，就自己照上面這張清單逐條看，用 `node scripts/jlpt-data.mjs show <type> last:<count>` 取回條目（同樣不要整份 Read）。無論哪種方式，修正一律就地編輯 `public/data/*.json`，改完重跑上面的測試，並在步驟六報告修正了哪些條目。

---

## 步驟六：回報結果

輸出摘要：
- 新增了幾筆（哪個 type、哪個 level）、id 區間
- 審查時發現並修正了哪些問題（若無則說「審查通過，無需修正」）
- 現在該 level 共有幾筆
- 提示：可執行 `pnpm run dev` 在瀏覽器確認顯示正常
