#!/usr/bin/env node
// Helper for the /add-data workflow.
//
//   node scripts/jlpt-data.mjs stats  <vocab|grammar> [level]
//   node scripts/jlpt-data.mjs append <vocab|grammar> <new-entries.json>
//
// `stats` prints only what generation needs (next id + every existing
// word/sentence) so the 400KB data file never has to be read in full.
// `append` assigns ids, rejects collisions, and rewrites the file in place
// keeping its 2-space + CRLF formatting.

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const FILES = { vocab: 'public/data/vocabulary.json', grammar: 'public/data/grammar.json' }
const PREFIX = { vocab: 'vocab', grammar: 'grammar' }
const KEY = { vocab: 'word', grammar: 'sentence' }

const die = (msg) => {
  console.error(`error: ${msg}`)
  process.exit(1)
}

const [cmd, type, arg] = process.argv.slice(2)
if (!FILES[type]) die(`type must be "vocab" or "grammar" (got ${type ?? 'nothing'})`)

const path = resolve(process.cwd(), FILES[type])
const cards = JSON.parse(readFileSync(path, 'utf8'))
const key = KEY[type]

const maxSeq = (level) =>
  cards
    .filter((c) => c.level === level)
    .reduce((max, c) => Math.max(max, Number(c.id.split('-')[2])), 0)

if (cmd === 'stats') {
  const levels = arg ? [arg] : ['N5', 'N4', 'N3', 'N2', 'N1']
  for (const level of levels) {
    const n = cards.filter((c) => c.level === level).length
    if (!n && arg === undefined) continue
    const next = String(maxSeq(level) + 1).padStart(3, '0')
    console.log(`${level}: ${n} entries, next id = ${PREFIX[type]}-${level}-${next}`)
  }
  console.log(`\n--- existing ${key}s (all levels, ${cards.length} total) ---`)
  console.log(cards.map((c) => c.payload[key]).join(type === 'vocab' ? ' ' : '\n'))
  process.exit(0)
}

if (cmd === 'append') {
  if (!arg) die('append needs a path to a JSON file holding an array of new cards')
  const incoming = JSON.parse(readFileSync(resolve(process.cwd(), arg), 'utf8'))
  if (!Array.isArray(incoming) || incoming.length === 0) die('new-entries file must be a non-empty array')

  const ids = new Set(cards.map((c) => c.id))
  const keys = new Map(cards.map((c) => [c.payload[key], c.id]))
  // the quiz labels its buttons with the meaning, so same-level duplicates
  // render as two identical options
  const meanings = new Map(
    type === 'vocab' ? cards.map((c) => [`${c.level}|${c.payload.meaning}`, c.id]) : [],
  )
  const seq = {}

  for (const card of incoming) {
    if (!card.level) die(`missing level on ${JSON.stringify(card).slice(0, 80)}`)
    if (!card.id) {
      seq[card.level] ??= maxSeq(card.level)
      card.id = `${PREFIX[type]}-${card.level}-${String(++seq[card.level]).padStart(3, '0')}`
    }
    if (ids.has(card.id)) die(`duplicate id ${card.id}`)
    const dup = keys.get(card.payload[key])
    if (dup) die(`duplicate ${key} "${card.payload[key]}" — already in ${dup}`)
    if (type === 'vocab') {
      const mk = `${card.level}|${card.payload.meaning}`
      const dupMeaning = meanings.get(mk)
      if (dupMeaning) die(`duplicate meaning "${card.payload.meaning}" in ${card.level} — already in ${dupMeaning}`)
      meanings.set(mk, card.id)
    }
    ids.add(card.id)
    keys.set(card.payload[key], card.id)
  }

  const merged = [...cards, ...incoming]
  writeFileSync(path, JSON.stringify(merged, null, 2).replace(/\n/g, '\r\n'), 'utf8')
  console.log(`appended ${incoming.length} → ${FILES[type]} now has ${merged.length} entries`)
  console.log(`ids: ${incoming[0].id} … ${incoming[incoming.length - 1].id}`)
  process.exit(0)
}

die('command must be "stats" or "append"')
