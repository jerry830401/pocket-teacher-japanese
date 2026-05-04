import { useRef, useState } from "react";
import {
  useSettings,
  QUIZ_ROUND_OPTIONS,
  type QuizRoundSize,
  type QuizKey,
  type MascotKind,
  type CatVariant,
  type DogVariant,
} from "@/stores/useSettings";
import OfflineDataButton from "@/features/progress/OfflineDataButton";
import { isPwa } from "@/lib/pwa";
import Mascot from "@/shared/Mascot";
import {
  exportBackup,
  parseBackupFile,
  importBackup,
  type BackupData,
  type ImportSummary,
} from "@/lib/db/backup";

const ITEMS: { key: QuizKey; label: string }[] = [
  { key: "kana", label: "五十音" },
  { key: "vocab", label: "單字" },
  { key: "grammar", label: "文法" },
  { key: "listening", label: "聽力" },
];

const CAT_VARIANTS: { id: CatVariant; label: string }[] = [
  { id: "black", label: "黑貓" },
  { id: "tuxedo", label: "賓士貓" },
  { id: "calico", label: "三花貓" },
  { id: "orange", label: "橘貓" },
];

const DOG_VARIANTS: { id: DogVariant; label: string }[] = [
  { id: "shiba", label: "柴犬" },
  { id: "corgi", label: "柯基" },
  { id: "poodle", label: "貴賓犬" },
  { id: "husky", label: "哈士奇" },
];

const sectionLabel: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  fontWeight: 700,
  fontSize: "0.875rem",
  color: "var(--color-ink-soft)",
  marginBottom: 8,
};

function PxToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={["px-toggle", checked ? "on" : ""].join(" ")}
      style={{ cursor: "pointer" }}
    >
      <div className="px-toggle-thumb" />
    </div>
  );
}

type ImportState =
  | { phase: "idle" }
  | { phase: "preview"; data: BackupData; summary: ImportSummary }
  | { phase: "error"; message: string }

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<ImportState>({ phase: "idle" });
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await exportBackup();
    } finally {
      setExporting(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const result = await parseBackupFile(file);
      setImportState({ phase: "preview", ...result });
    } catch (err) {
      setImportState({ phase: "error", message: err instanceof Error ? err.message : "讀取失敗" });
    }
  }

  async function handleConfirmImport() {
    if (importState.phase !== "preview") return;
    await importBackup(importState.data);
  }

  const {
    autoNextKana,
    autoNextVocab,
    autoNextGrammar,
    autoNextListening,
    setAutoNext,
    roundSizeKana,
    roundSizeVocab,
    roundSizeGrammar,
    roundSizeListening,
    setRoundSize,
    mascotKind,
    catVariant,
    dogVariant,
    setMascotKind,
    setCatVariant,
    setDogVariant,
  } = useSettings();

  const autoNextValues: Record<QuizKey, boolean> = {
    kana: autoNextKana,
    vocab: autoNextVocab,
    grammar: autoNextGrammar,
    listening: autoNextListening,
  };
  const roundSizeValues: Record<QuizKey, QuizRoundSize> = {
    kana: roundSizeKana,
    vocab: roundSizeVocab,
    grammar: roundSizeGrammar,
    listening: roundSizeListening,
  };

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "0 16px",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 64px)",
      }}
    >
      {/* 頁首 */}
      <div
        style={{
          padding: "14px 0 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "1rem",
            lineHeight: 1.4,
          }}
        >
          設定
        </span>
        <span
          style={{
            fontFamily: '"VT323", monospace',
            fontSize: "1.375rem",
            color: "var(--color-ink-soft)",
          }}
        >
          v{import.meta.env.VITE_APP_VERSION}
        </span>
      </div>

      {/* 老師角色 */}
      <div style={sectionLabel}>老師</div>
      <div className="px-settings-list" style={{ marginBottom: 18 }}>
        <div
          className="px-settings-row"
          style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>角色</span>
            <span
              style={{
                fontFamily: '"VT323", monospace',
                fontSize: "1.375rem",
                color: "var(--color-ink-soft)",
              }}
            >
              {mascotKind === "cat" ? "貓" : "狗"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["cat", "shiba"] as MascotKind[]).map((k) => (
              <button
                key={k}
                className={[
                  "pbtn",
                  "flex-1",
                  mascotKind === k ? "pbtn-primary" : "",
                ].join(" ")}
                style={{ padding: "8px 4px", fontSize: "0.8125rem" }}
                onClick={() => setMascotKind(k)}
              >
                {k === "cat" ? "貓" : "狗"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 貓咪花色 */}
      {mascotKind === "cat" && (
        <>
          <div style={sectionLabel}>貓咪花色</div>
          <div className="px-cat-grid" style={{ marginBottom: 18 }}>
            {CAT_VARIANTS.map((v) => {
              const selected = catVariant === v.id;
              return (
                <div
                  key={v.id}
                  className={["px-cat-pick", selected ? "selected" : ""].join(
                    " ",
                  )}
                  onClick={() => setCatVariant(v.id)}
                >
                  <div className="px-cat-pick-frame">
                    <Mascot kind="cat" variant={v.id} mood="idle" size={3} />
                  </div>
                  <span
                    style={{
                      fontFamily: "system-ui, sans-serif",
                      fontWeight: 700,
                      fontSize: "0.8125rem",
                    }}
                  >
                    {v.label}
                  </span>
                  {selected && <div className="px-cat-pick-check">✓</div>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 狗狗品種 */}
      {mascotKind === "shiba" && (
        <>
          <div style={sectionLabel}>狗狗品種</div>
          <div className="px-cat-grid" style={{ marginBottom: 18 }}>
            {DOG_VARIANTS.map((v) => {
              const selected = dogVariant === v.id;
              return (
                <div
                  key={v.id}
                  className={["px-cat-pick", selected ? "selected" : ""].join(
                    " ",
                  )}
                  onClick={() => setDogVariant(v.id)}
                >
                  <div className="px-cat-pick-frame">
                    <Mascot kind="shiba" variant={v.id} mood="idle" size={3} />
                  </div>
                  <span
                    style={{
                      fontFamily: "system-ui, sans-serif",
                      fontWeight: 700,
                      fontSize: "0.8125rem",
                    }}
                  >
                    {v.label}
                  </span>
                  {selected && <div className="px-cat-pick-check">✓</div>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 答對自動下一題 */}
      <div style={sectionLabel}>答對自動下一題</div>
      <div className="px-settings-list" style={{ marginBottom: 18 }}>
        {ITEMS.map(({ key, label }) => (
          <div key={key} className="px-settings-row">
            <span>{label}</span>
            <PxToggle
              checked={autoNextValues[key]}
              onChange={(v) => setAutoNext(key, v)}
            />
          </div>
        ))}
      </div>

      {/* 每輪題數 */}
      <div style={sectionLabel}>每輪題數</div>
      <div className="px-settings-list" style={{ marginBottom: 18 }}>
        {ITEMS.map(({ key, label }) => (
          <div key={key} className="px-settings-row">
            <span>{label}</span>
            <div style={{ display: "flex", gap: 4 }}>
              {QUIZ_ROUND_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setRoundSize(key, n)}
                  style={{
                    width: 36,
                    padding: "5px 0",
                    border: "2px solid var(--color-ink)",
                    background:
                      roundSizeValues[key] === n
                        ? "var(--color-gold)"
                        : "var(--color-paper)",
                    fontFamily: "system-ui, sans-serif",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: "var(--color-ink)",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 離線 */}
      {isPwa() && (
        <>
          <div style={sectionLabel}>離線</div>
          <OfflineDataButton />
        </>
      )}

      {/* 資料備份 */}
      <div style={{ ...sectionLabel, marginTop: 8 }}>資料備份</div>
      <div className="px-settings-list" style={{ marginBottom: 18 }}>
        {/* 匯出 */}
        <div className="px-settings-row">
          <div>
            <div style={{ fontWeight: 600 }}>匯出備份</div>
            <div style={{ fontSize: "0.8125rem", color: "var(--color-ink-soft)", marginTop: 2 }}>
              下載 JSON 檔至裝置
            </div>
          </div>
          <button
            className="pbtn pbtn-primary"
            style={{ padding: "8px 16px", fontSize: "0.875rem", minWidth: 72 }}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "處理中…" : "匯出"}
          </button>
        </div>

        {/* 匯入 */}
        <div className="px-settings-row">
          <div>
            <div style={{ fontWeight: 600 }}>匯入備份</div>
            <div style={{ fontSize: "0.8125rem", color: "var(--color-ink-soft)", marginTop: 2 }}>
              從 JSON 檔還原進度
            </div>
          </div>
          <button
            className="pbtn"
            style={{ padding: "8px 16px", fontSize: "0.875rem", minWidth: 72 }}
            onClick={() => fileInputRef.current?.click()}
          >
            選擇檔案
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* 匯入預覽 / 錯誤 */}
      {importState.phase === "error" && (
        <div
          style={{
            marginBottom: 18,
            padding: "12px 14px",
            border: "2px solid var(--color-red, #c0392b)",
            background: "var(--color-paper)",
            fontFamily: "system-ui, sans-serif",
            fontSize: "0.875rem",
            color: "var(--color-red, #c0392b)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>⚠ {importState.message}</span>
          <button
            className="pbtn"
            style={{ padding: "4px 10px", fontSize: "0.8125rem" }}
            onClick={() => setImportState({ phase: "idle" })}
          >
            關閉
          </button>
        </div>
      )}

      {importState.phase === "preview" && (
        <div
          style={{
            marginBottom: 18,
            padding: "14px",
            border: "2px solid var(--color-ink)",
            background: "var(--color-paper)",
            fontFamily: "system-ui, sans-serif",
            fontSize: "0.875rem",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>確認匯入</div>
          <div style={{ color: "var(--color-ink-soft)", marginBottom: 4 }}>
            備份時間：{new Date(importState.summary.exportedAt).toLocaleString("zh-TW")}
          </div>
          <div style={{ color: "var(--color-ink-soft)", marginBottom: 12 }}>
            卡片數量：{importState.summary.cardCount} 張
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--color-ink-soft)", marginBottom: 12 }}>
            匯入後目前的學習進度與設定將被覆蓋，頁面會自動重新整理。
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="pbtn pbtn-primary"
              style={{ flex: 1, padding: "10px 0", fontSize: "0.875rem" }}
              onClick={handleConfirmImport}
            >
              確認匯入
            </button>
            <button
              className="pbtn"
              style={{ flex: 1, padding: "10px 0", fontSize: "0.875rem" }}
              onClick={() => setImportState({ phase: "idle" })}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
