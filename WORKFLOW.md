# WORKFLOW.md — Graph & Knowledge Workflow

How the Graphify knowledge graph and the Obsidian vault are maintained for this repository.

**Ownership note:** `AGENTS.md` owns agent operating rules and `docs/DEVELOPMENT.md` owns the development workflow. This file owns **only** the graph/knowledge-maintenance workflow and does not override either.

---

## 1. Knowledge graph (Graphify)

The graph lives in `graphify-out/` at the repository root. It indexes code, docs and images into nodes + edges, clusters them into communities, and answers structural questions about the codebase.

### Interpreter

All commands resolve the interpreter recorded at run time in `graphify-out/.graphify_python`. If that file is missing (e.g. someone deleted `graphify-out/`), re-resolve before running any subcommand:

```sh
uv tool run --from graphifyy python -c "import sys; open('graphify-out/.graphify_python','w',encoding='utf-8').write(sys.executable)"
```

`graphify` must be installed as a Python package — it is **not** an npm dependency of this project and does not belong in `package.json`.

### Everyday queries — prefer these over reading the graph

The graph is already built. **Do not rebuild it to answer a question.**

```sh
graphify query "how does record_payment prevent overpay"   # BFS traversal — broad context
graphify query "..." --dfs                                # DFS — trace a specific path
graphify query "..." --budget 1500                        # cap the answer
graphify path "getDb()" "recordPayment()"                 # shortest path between two nodes
graphify explain "serviceErrorFromSupabase()"             # plain-language node explanation
graphify affected "void_sale"                             # what a change impacts
graphify god-nodes --top 20                               # architectural hubs
```

`graphify query`, `path` and `explain` exit **0** with an answer, **3** when a name is ambiguous (candidates listed), **4** when nothing matches. Cite `source_location` when stating a specific fact.

### Rebuilding

```sh
graphify update .        # incremental — re-extracts only new/changed files (no LLM needed)
graphify update . --force # full re-scan; also required after refactors that delete code
graphify cluster-only .   # re-cluster an existing graph
```

Rules:

- **Never rebuild just to answer a question.** `update` / `cluster-only` / a bare path all trigger fresh extraction.
- After a refactor that removes code, the shrink-guard refuses to overwrite `graph.json` with a smaller graph. That is correct — re-run with `--force`.
- Code extraction is deterministic AST and needs no API key. Semantic extraction of docs/images uses **subagents** unless `GEMINI_API_KEY` / `GOOGLE_API_KEY` is set. **graphify needs no API key and never asks for one.**
- Read `graphify-out/GRAPH_REPORT.md` for God Nodes, Surprising Connections and Suggested Questions.

### Honest limits of the graph

- Edges are labelled `EXTRACTED` / `INFERRED` / `AMBIGUOUS`. **Never present an INFERRED or AMBIGUOUS edge as fact.** The graph carries its own AMBIGUOUS list — check it before acting.
- `styled-components` and `react` appear as high-degree nodes because they are imported widely; **high degree ≠ architectural importance**.
- Vision-derived nodes from logo images carry speculative intent claims (e.g. "Possible Amara Store Identity"). They are AMBIGUOUS and should be ignored.
- Undirected graphs collapse import/re-export duplicates onto one endpoint pair. This is expected, not corruption.

---

## 2. Obsidian vault

Vault: `C:\Users\SSD-ORLANDO\Documents\DevVault`
Project area: `01-Projects/ZAF-ONE/`

```
01-Projects/ZAF-ONE/
  Project-Overview.md     entry point — read this first
  Architecture.md
  System-Flows.md
  Business-Rules.md
  Data-Model.md
  API-Reference.md
  Security-Notes.md
  Testing-Guide.md
  Known-Issues.md
  Decisions.md
  Development-Log.md
  Graphify-Export/        2,009 GENERATED notes + graph.canvas — never hand-edit
```

Every curated note carries frontmatter `tags` / `confidence` / `sources` / `updated`, marks claims **VERIFIED / INFERRED / UNVERIFIED / CONFLICTING**, and ends with a `## Related` wikilink row.

### Regenerating the export

```sh
graphify export obsidian \
  --graph  graphify-out/graph.json \
  --labels graphify-out/.graphify_labels.json \
  --dir    "C:/Users/SSD-ORLANDO/Documents/DevVault/01-Projects/ZAF-ONE/Graphify-Export"
```

Run from the repository root. **This overwrites `Graphify-Export/` wholesale.** Regenerate after `graphify update .`; never hand-edit generated notes — curated notes are the ones you maintain by hand.

### Relationship with the repo docs

The vault notes are **a reading aid, not a source of truth.** When they disagree with the repository, the repository wins (`AGENTS.md` §4). Where the vault flags a CONFLICT, resolve it against the ownership table in `AGENTS.md` §3 and fix the owning document.

---

## 3. Secrets discipline in the vault

The vault lives **outside** the repository and is not covered by `.gitignore`. Before writing anything into it:

- **Never** copy `.env` contents, connection strings, keys, tokens, or the production owner password.
- The hosted Supabase project ref and the production owner **login handle** are recorded in `Security-Notes.md` as operational facts, with the password explicitly excluded.
- Mock dev seed credentials (`alice` / `ben` / `owner`) are documented as test-only; they do not touch the production account.
- After any export, re-scan `Graphify-Export/` for secret-shaped strings before trusting it — the graph indexes source files, and `graphify-out/` is gitignored so it should never contain them, but verify rather than assume.

---

## 4. Standard task flow

1. Read `AGENTS.md`; load only the relevant `docs/*` per its ownership table.
2. Inspect the actual implementation before changing anything.
3. For "how does X work / what touches Y" questions → `graphify query` / `path` / `affected` **before** grepping.
4. Implement the smallest change that solves the real problem.
5. Verify proportionally: `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run build`; Gate-4 proofs after any migration change.
   - The suite is currently green at **410/410**. `vite.config.ts` sets `testTimeout: 30000` and `src/test/setup.ts` sets testing-library `asyncUtilTimeout: 10000` — both exist because `findBy*` assertions after async navigation failed intermittently under parallel load. Don't lower them back.
   - A `Test timed out` failure that disappears in isolation is almost always load, not a regression. Re-run before investigating.
6. Update the owning document if behaviour changed; add a `docs/DECISIONS.md` record if a real trade-off was made.
7. Report: what changed, files affected, decisions, validation performed, and **what was not verified**.

---

## 5. Approvals and prohibitions

- **Deploys, hosted `db push`, and production migrations require explicit client approval.**
- Hosted data is **live** — the client is actively using it. Additive migrations only; never wipe; rollbacks touch no data.
- Never stage or commit without being asked. `graphify-out/` is gitignored and regenerable — do not commit it.
- Never commit secrets, bypass authorization, or disable a security control to make something pass.

## 5b. Session save/load commands

Two project commands are registered in `opencode.json` under `commands`.

**`/save`** — run at the end of a work session.
- `scripts/session/save.mjs` captures branch, HEAD, working-tree status, staged
  and unstaged diffs, untracked files, and the commit log since the previous
  save point.
- The full diff goes to `workflow/patches/<stamp>.diff` (gitignored); only a
  summary goes into `workflow/session.md`.
- The script **only** rewrites the area between `<!-- STATE:BEGIN -->` and
  `<!-- STATE:END -->`. The `## Context` section above it is written by the
  agent from the live conversation and is never touched by the script.
- `workflow/.last-save.json` records the save point. It is what "since the last
  save" means — delete it to force a full-history capture.
- **It never stages or commits.** "Commit record" means the SHA and log are
  *recorded*, not that git state changes.

**`/load`** — run at the start of a new session.
- Inlines `workflow/session.md`, then instructs the agent to read `AGENTS.md`,
  only the `docs/*` that `AGENTS.md` §3 assigns to the task, and to answer code
  questions through `graphify query` / `path` / `explain` rather than reading
  files. It is explicitly told not to read `node_modules/`, `dist/`,
  `graphify-out/`, or the vault export.

Editing the command text: `opencode.json` is the source. `.opencode/commands/*.md`
would be the conventional home, but `permission.edit[".opencode/**"]` is `deny`,
so that layout needs that permission narrowed to allow `.opencode/commands/**`.
OpenCode hot-reloads config, so no restart is needed.

**Secrets:** `workflow/session.md` holds conversation context and may be
committed. The script filters `.env*` paths out of the file lists, but the
**agent** must not paste secrets into the Context section — the filter cannot
inspect prose.

## 6. Session handoff

When the client says **"hand-off context to Session.md"**, refresh `SESSION.md` following its existing structure. It has historically drifted out of date — the migration list, admin store default and test baseline in it go stale as migrations land. Check each against the repository, not against its own text.