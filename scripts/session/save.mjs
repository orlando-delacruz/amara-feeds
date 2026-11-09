#!/usr/bin/env node
/**
 * /save — deterministic half of the session save.
 *
 * The command template (`/save`) is only a prompt; it cannot read git state or
 * the transcript by itself. This script does the part that must be exact:
 *
 *   1. reads the previous save point from workflow/.last-save.json
 *   2. captures the branch, HEAD, working-tree status, staged + unstaged diffs,
 *      untracked files, and the commit log since that save point
 *   3. writes the full diff to workflow/patches/<stamp>.diff
 *   4. splices a compact State block into workflow/session.md between the
 *      STATE markers, leaving the agent-authored Context section untouched
 *   5. advances workflow/.last-save.json
 *
 * Keeping the diff out of session.md matters: a full diff is often thousands of
 * lines, and inlining it would defeat the purpose of saving a small context.
 *
 * The agent then rewrites the Context section from the live conversation.
 */

import { Buffer } from 'node:buffer'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import process from 'node:process'

const ROOT = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
const WORKFLOW = join(ROOT, 'workflow')
const PATCHES = join(WORKFLOW, 'patches')
const SESSION = join(WORKFLOW, 'session.md')
const STATE_FILE = join(WORKFLOW, '.last-save.json')

const STATE_BEGIN = '<!-- STATE:BEGIN — maintained by scripts/session/save.mjs, do not edit by hand -->'
const STATE_END = '<!-- STATE:END -->'
const CONTEXT_PLACEHOLDER = [
  '## Context',
  '',
  '_No context saved yet. Run `/save` after a work session and the agent will',
  'replace this section with what the session did, the decisions taken, and what',
  'comes next._',
  '',
].join('\n')

/** Max bytes of diff to write; beyond this we truncate and say so. */
const MAX_PATCH_BYTES = 8 * 1024 * 1024

/** Paths that must never reach a savable artifact, even if someone un-ignores them. */
const REDACT = [/(^|\/)\.env($|\.)/]

/** The save mechanism's own bulk output — not project work, and gitignored. */
const IGNORE_PREFIXES = ['workflow/patches/', 'workflow/.last-save.json']

function git(args) {
  try {
    return execSync(`git ${args}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  } catch (error) {
    return {
      failed: true,
      message: (error.stderr || error.message || '').toString().trim(),
    }
  }
}

function gitOrEmpty(args) {
  const out = git(args)
  return typeof out === 'string' ? out : ''
}

function isSensitive(path) {
  return REDACT.some((re) => re.test(path.replace(/\\/g, '/')))
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function readPreviousSave() {
  if (!existsSync(STATE_FILE)) {
    return null
  }
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'))
  } catch {
    return null
  }
}

function ensureDirs() {
  mkdirSync(PATCHES, { recursive: true })
}

function main() {
  ensureDirs()

  const previous = readPreviousSave()
  const branch = gitOrEmpty('rev-parse --abbrev-ref HEAD').trim() || '(unknown)'
  const head = gitOrEmpty('rev-parse HEAD').trim() || '(no commits)'
  // The save point is whatever the previous run recorded — even when HEAD has
  // not moved since. Treating "same HEAD" as "no previous save" made a second
  // save look like the first one and replayed ten commits of history.
  const lastCommit = previous?.commit ?? null

  const statusRaw = gitOrEmpty('status --porcelain')
  const statusLines = statusRaw.split('\n').filter(Boolean)

  // `git status` collapses a wholly-untracked directory to one `dir/` entry.
  // Resolve those to real files so the saved state names what actually changed.
  const untrackedFiles = gitOrEmpty('ls-files --others --exclude-standard')
    .split('\n')
    .filter(Boolean)

  // Split into human-meaningful buckets.
  const changed = []
  const deleted = []
  for (const line of statusLines) {
    const code = line.slice(0, 2)
    const path = line.slice(3).trim().replace(/^"|"$/g, '')
    if (code === '??' || isSensitive(path)) {
      continue
    }
    if (code.includes('D')) {
      deleted.push(path)
    } else {
      changed.push(path)
    }
  }
  const untracked = untrackedFiles.filter(
    (path) =>
      !isSensitive(path) && !IGNORE_PREFIXES.some((prefix) => path.startsWith(prefix)),
  )

  const commits = lastCommit
    ? gitOrEmpty(`log --oneline ${lastCommit}..HEAD`).split('\n').filter(Boolean)
    : gitOrEmpty('log --oneline -10').split('\n').filter(Boolean)

  // Full diff bundle: staged + unstaged. Untracked files are listed, not
  // diffed — `git diff` cannot show them without `--no-index` per file.
  const diffParts = []
  const stagedDiff = gitOrEmpty('diff --cached')
  const unstagedDiff = gitOrEmpty('diff')
  if (stagedDiff.trim()) {
    diffParts.push('# Staged\n', stagedDiff)
  }
  if (unstagedDiff.trim()) {
    diffParts.push('# Unstaged\n', unstagedDiff)
  }
  let patchBody = diffParts.join('\n')
  let truncated = false
  if (Buffer.byteLength(patchBody, 'utf8') > MAX_PATCH_BYTES) {
    patchBody = patchBody.slice(0, MAX_PATCH_BYTES)
    truncated = true
  }

  const patchName = `${stamp()}.diff`
  const patchPath = join(PATCHES, patchName)
  const hasDiff = patchBody.trim().length > 0
  if (hasDiff) {
    writeFileSync(
      patchPath,
      truncated ? `${patchBody}\n\n# TRUNCATED at ${MAX_PATCH_BYTES} bytes\n` : patchBody,
      'utf8',
    )
  }

  const rel = (p) => relative(ROOT, p).replace(/\\/g, '/')
  const list = (items) => (items.length ? items.map((p) => `- \`${p}\``).join('\n') : '_none_')

  const stateBlock = [
    STATE_BEGIN,
    '',
    `**Saved:** ${new Date().toISOString()}  `,
    `**Branch:** \`${branch}\`  `,
    `**HEAD:** \`${head}\`  `,
    `**Previous save point:** ${lastCommit ? `\`${lastCommit}\`` : '_none — this is the first save_'}`,
    '',
    '### Changed since the last save',
    '',
    list(changed),
    '',
    '### New (untracked) files since the last save',
    '',
    list(untracked),
    '',
    '### Deleted',
    '',
    list(deleted),
    '',
    `### Commits${lastCommit ? ` since \`${lastCommit}\`` : ' (last 10 — no previous save)'}`,
    '',
    commits.length ? commits.map((c) => `- ${c}`).join('\n') : '_none_',
    '',
    '### Diff bundle',
    '',
    hasDiff
      ? `Full diff written to \`${rel(patchPath)}\`${truncated ? ' (truncated)' : ''}.`
      : '_no tracked changes to diff_',
    '',
    STATE_END,
  ].join('\n')

  // Splice: replace the existing State block, or append one after the Context.
  let session
  if (existsSync(SESSION)) {
    session = readFileSync(SESSION, 'utf8')
  } else {
    session = [
      '# Session',
      '',
      'Saved by `/save`. Read by `/load`.',
      '',
      CONTEXT_PLACEHOLDER,
      '',
    ].join('\n')
  }

  const begin = session.indexOf(STATE_BEGIN)
  const end = session.indexOf(STATE_END)
  if (begin !== -1 && end !== -1 && end > begin) {
    session = session.slice(0, begin) + stateBlock + session.slice(end + STATE_END.length)
  } else {
    session = `${session.trimEnd()}\n\n${stateBlock}\n`
  }
  writeFileSync(SESSION, session, 'utf8')

  writeFileSync(
    STATE_FILE,
    `${JSON.stringify({ commit: head, branch, savedAt: new Date().toISOString() }, null, 2)}\n`,
    'utf8',
  )

  // Stdout is inserted into the /save prompt: keep it short and useful.
  const lines = [
    `Saved state to ${rel(SESSION)}`,
    `  branch:    ${branch}`,
    `  HEAD:      ${head}`,
    `  previous:  ${lastCommit ?? '(none)'}`,
    `  changed:   ${changed.length}`,
    `  new:       ${untracked.length}`,
    `  deleted:   ${deleted.length}`,
    `  commits:   ${commits.length}`,
    `  patch:     ${hasDiff ? rel(patchPath) + (truncated ? ' (truncated)' : '') : '(none)'}`,
    '',
    'The State block is written. Now replace ONLY the ## Context section in',
    'workflow/session.md with a summary of this conversation.',
  ]
  if (!statusLines.length && !commits.length) {
    lines.splice(1, 0, '  note:      no changes since the last save')
  }
  console.log(lines.join('\n'))
}

try {
  main()
} catch (error) {
  console.error(`save failed: ${error.message}`)
  process.exit(1)
}
