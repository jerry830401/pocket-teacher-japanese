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
  // only if BOTH cards carry one — and it qualifies the sense it sits in, not the
  // whole string: "在、去、來（尊敬語）" still offers a bare 在 and a bare 去.
  const senses = (meaning) => meaning.split(/[、,，/／]/).map((t) => t.trim()).filter(Boolean)
  const stem = (sense) => sense.replace(/[（(][^）)]*[）)]/g, '').trim()
  const qualified = (card) => /[（(][^）)]*[）)]/.test(card.payload.meaning)

  const pickedIds = new Set(picked.map((c) => c.id))
  const levels = new Set(picked.map((c) => c.level))

  // group by stem so a term shared by three cards prints as one group, not three
  // pairs — "which card keeps the plain gloss" is the decision being made, and it
  // cannot be made one pair at a time
  const groups = new Map()
  for (const c of cards) {
    if (!levels.has(c.level)) continue
    for (const sense of senses(c.payload.meaning)) {
      const key = `${c.level}|${stem(sense)}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push({ card: c, sense })
    }
  }

  const hits = []
  for (const [key, members] of groups) {
    const ids = new Set(members.map((m) => m.card.id))
    if (ids.size < 2 || ![...ids].some((id) => pickedIds.has(id))) continue
    const exact = members.some((a, i) => members.slice(i + 1).some((b) => a.sense === b.sense && a.card.id !== b.card.id))
    if (!exact && members.every((m) => qualified(m.card))) continue
    const list = members
      .map((m) => `${m.card.id} ${m.card.payload.word}「${m.card.payload.meaning}」`)
      .filter((line, i, arr) => arr.indexOf(line) === i)
    hits.push(`${exact ? 'HIGH' : 'MED '} 共用「${key.split('|')[1]}」（${ids.size} 筆）\n     ` + list.join('\n     '))
  }

  // a card repeating a sense inside its own meaning escapes both the schema test
  // and the comparison above, which never compares a card with itself
  const selfDupes = picked
    .filter((c) => new Set(senses(c.payload.meaning)).size !== senses(c.payload.meaning).length)
    .map((c) => `DUP  ${c.id} ${c.payload.word}「${c.payload.meaning}」— 同一筆內義項重複`)

  console.log([...hits, ...selfDupes].join('\n') || 'no overlapping meanings')
  console.log(`\n--- ${picked.length} entries checked, ${hits.length} overlap group(s), ${selfDupes.length} self-duplicate(s) ---`)
  console.log('HIGH = a sense string appears verbatim on two cards')
  console.log('MED  = same sense, at least one card carries no qualifier anywhere')
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
