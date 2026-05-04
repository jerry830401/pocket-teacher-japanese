import type { SrsCard } from '@/lib/srs/types'
import { db } from './db'

const BACKUP_VERSION = 1

export interface BackupData {
  version: number
  exportedAt: number
  srsCards: SrsCard[]
  settings: unknown
}

export async function exportBackup(): Promise<void> {
  const srsCards = await db.srsCards.toArray()
  const settingsRaw = localStorage.getItem('ptjp-settings')
  const settings = settingsRaw ? JSON.parse(settingsRaw) : null

  const backup: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    srsCards,
    settings,
  }

  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const date = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `ptjp-backup-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export interface ImportSummary {
  cardCount: number
  exportedAt: number
}

export async function parseBackupFile(file: File): Promise<{ data: BackupData; summary: ImportSummary }> {
  const text = await file.text()
  let data: BackupData
  try {
    data = JSON.parse(text) as BackupData
  } catch {
    throw new Error('無法解析 JSON 檔案')
  }

  if (data.version !== BACKUP_VERSION) {
    throw new Error(`不支援的備份版本：${data.version}`)
  }
  if (!Array.isArray(data.srsCards)) {
    throw new Error('備份檔案格式錯誤')
  }

  return {
    data,
    summary: {
      cardCount: data.srsCards.length,
      exportedAt: data.exportedAt,
    },
  }
}

export async function importBackup(data: BackupData): Promise<void> {
  await db.srsCards.clear()
  if (data.srsCards.length > 0) {
    await db.srsCards.bulkPut(data.srsCards)
  }

  if (data.settings) {
    localStorage.setItem('ptjp-settings', JSON.stringify(data.settings))
  }

  // reload so Zustand re-hydrates from the restored localStorage
  window.location.reload()
}
