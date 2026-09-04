#!/usr/bin/env node
// Helper for the /add-data workflow.
//
//   node scripts/jlpt-data.mjs stats  <vocab|grammar> [level]
//   node scripts/jlpt-data.mjs show    <vocab|grammar> <last:N | id-range | level>
//   node scripts/jlpt-data.mjs overlap <vocab> <last:N | id-range | level>
//   node scripts/jlpt-data.mjs append  <vocab|grammar> <new-entries.json>
//
// `stats` prints only what generation needs (next id + every existing
// word/sentence) so the 400KB data file never has to be read in full.
// `show` prints the full payload of a selected slice, for the same reason:
// reviewing 30 new entries should not mean reading 1400.
// `overlap` finds same-level cards whose meanings share a term. buildChoices
// only drops distractors whose answer key is byte-identical, so a partial
// overlap ships two right-looking buttons — and the collision is usually
// hundreds of entries away, where nobody reviewing a new batch would look.
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

const select = (selector) => {
  if (!selector) die('needs a selector: "last:N", "N5-401..N5-430", or a level like "N4"')
  const last = selector.match(/^last:(\d+)$/)
  const range = selector.match(/^(?:[a-z]+-)?(N[1-5])-(\d+)\.\.(?:[a-z]+-)?(?:N[1-5]-)?(\d+)$/)
  let picked
  if (last) {
    picked = cards.slice(-Number(last[1]))
  } else if (range) {
    const [, level, from, to] = range
    picked = cards.filter((c) => {
      const [, lv, seq] = c.id.split('-')
      return lv === level && Number(seq) >= Number(from) && Number(seq) <= Number(to)
    })
  } else if (/^N[1-5]$/.test(selector)) {
    picked = cards.filter((c) => c.level === selector)
  } else {
    die(`unrecognised selector "${selector}" — use "last:N", "N5-401..N5-430", or a level`)
  }
  if (!picked.length) die(`selector "${selector}" matched no entries`)
  return picked
}

if (cmd === 'show') {
  console.log(JSON.stringify(select(arg), null, 2))
  process.exit(0)
}

if (cmd === 'overlap') {
  if (type !== 'vocab') die('overlap applies to vocab only — grammar cards carry their own choices')
  const picked = select(arg)

  // A learner reads the whole meaning string off the button, so two cards clash
  // when they share a listed sense. A parenthetical qualifier resolves the clash
  // only if BOTH sides carry one: "危險的（口語）" beside a bare "危險的" still
  // leaves the bare button looking correct.
  const senses = (meaning) => meaning.split(/[、,，/／]/).map((t) => t.trim()).filter(Boolean)
  const stem = (sense) => sense.replace(/[（(][^）)]*[）)]/g, '').trim()
  const qualified = (sense) => sense !== stem(sense)

  const byLevel = new Map()
  for (const c of cards) {
    if (!byLevel.has(c.level)) byLevel.set(c.level, [])
    byLevel.get(c.level).push(c)
  }

  const seen = new Set()
  const hits = []
  for (const card of picked) {
    for (const other of byLevel.get(card.level)) {
      if (other.id === card.id) continue
      const pair = [card.id, other.id].sort().join(' ')
      if (seen.has(pair)) continue
      for (const a of senses(card.payload.meaning)) {
        for (const b of senses(other.payload.meaning)) {
          let level = null
          if (a === b) level = 'HIGH'
          else if (stem(a) === stem(b) && !(qualified(a) && qualified(b))) level = 'MED '
          if (!level) continue
          seen.add(pair)
          hits.push(
            `${level} ${card.id} ${card.payload.word}「${card.payload.meaning}」\n` +
            `     ↔ ${other.id} ${other.payload.word}「${other.payload.meaning}」  共用「${a === b ? a : stem(a)}」`,
          )
        }
      }
    }
  }

  console.log(hits.length ? hits.join('\n') : 'no overlapping meanings')
  console.log(`\n--- ${picked.length} entries checked, ${hits.length} overlap(s) ---`)
  console.log('HIGH = identical sense (two identical-looking buttons)')
  console.log('MED  = same sense, only one side qualified — qualify both, or reword one')
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

die('command must be "stats", "show", "overlap" or "append"')
