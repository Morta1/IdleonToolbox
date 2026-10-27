# Parser Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the parse pipeline safer to change and cheaper to run, without changing a single parsed value: a golden-output gate, named save indices, one decode step, a parse worker, and a measured decision on the pass loop.

**Architecture:** `parsers/index.ts` stays the entry point. New pieces: a golden-output tool (`tools/parse-golden/`), the pass/dependency harness (`tools/parse-graph/`), `parsers/accountOptions.ts` (named `OptLacc` indices), a decode stage inside `getStaticData`, and `workers/parse.worker.ts` behind the existing `parseData` call sites.

**Source of this plan:** the redesign review of 2026-10-27 plus two measurements run the same day (below). Every number here comes from those runs.

## Measurements (2026-10-27)

Harness: in-memory transform of `parsers/index.ts` and `safeSection.ts` (no repo change), Date frozen, 10 fixtures. Controls: two independent parses match exactly; the instrumented parse matches the plain parse exactly (0 diffs).

**1. Convergence: 3 passes is exactly enough, with no margin.**

| Fixture group | p1→p2 changed values | p2→p3 | p3→p4, p4→p5, p5→p6 |
|---|---|---|---|
| early (first, second, third, fourth, fresh) | 800 to 1,900 | 1 (`arcade`) | 0 |
| endgame (highend, latest, latest-2026-08, multikill-pin, speedrun-rank1) | 10,400 to 14,500 | 930 to 1,330 | 0 |

- No stale values today: nothing changes after pass 3 on any fixture.
- On endgame saves pass 3 still moves about 1,000 values across 15 to 18 sections (sailing, sneaking, farming, summoning, royalGuardian, spelunking, hole, gaming, coralReef, research, minehead, button, breeding, cooking, equinox). One new cross-system read could need a 4th pass, and nothing would notice.
- Characters are stable after pass 2. All late changes are account sections.

**2. Dependencies: one cycle covers almost everything.**

- 96 account keys; 64 sections read other sections; 759 real read edges.
- 294 edges are reads of a section before it is written in the same pass (they get the previous pass's value). 46 of 64 reading sections have at least one.
- After removing whole-account enumeration (below), **58 sections form one strongly connected cycle**. A section-level node graph is therefore impossible; only splitting sections into smaller values can break it.
- The cycle is driven by late "global bonus" sections that are written at the end of the pass but read everywhere:

| Key read before it is written | Sections reading it early |
|---|---|
| jellyOperator | 27 |
| sushiStation | 26 |
| legendTalents | 24 |
| upgradeVault | 18 |
| voteBallot | 14 |
| minehead, research | 12 each |
| gaming | 11 |
| characters (previous pass) | 10 |

- `legendTalents`, `gaming` and `spelunking` enumerate every key of the account (spread or key iteration), so they formally depend on everything.
- ~~Some section results keep a reference to the live `account` object.~~ **Corrected in Task 3:** that was a harness artifact (Node's 10-frame stack limit hid the index.ts frame). With full stacks: 0 post-parse reads, no result path holds the account, and `structuredClone` of the whole result succeeds on `latest` and `third`.
- Sections written more than once per pass: `stamps` ×3, `statues` ×3, `breeding`, `farming`, `lab`, `atoms` ×2.

**Decision taken from the data:** no node-graph conversion now. Keep the 3 passes, guard them in CI, and run one bounded experiment on the hub sections (Task 9) before deciding anything bigger.

## Global Constraints

- **Zero value changes.** Every task except Task 9's experiment must leave the golden output (Task 1) byte-identical on all fixtures. A diff is a bug in the refactor, not a fix.
- **Work only in the worktree** `C:\Dev\idleon\toolbox\IdleonToolbox\.claude\worktrees\parser-foundations` on branch `feat/parser-foundations` (user, 2026-10-27: the main checkout stays free for other work). Never touch files in the main checkout. Never merge or push without an explicit go for that step.
- `node_modules` there is a junction to the main checkout's: never `git worktree remove` it by hand (see the fix-task `worktree.mjs` notes); unlink the junction first. Dev server, if needed, on a port not used by the main checkout (not 3001/3002), only after checking it is free; never kill node processes you did not start.
- Build and e2e in the worktree: `TURBOPACK_ROOT="C:/Dev/idleon/toolbox/IdleonToolbox" NEXT_PUBLIC_BUILDS_URL="https://builds.idleontoolbox.workers.dev/api" npm run build` (Turbopack can't see the junctioned `next` otherwise, and `.env.local` points builds at a local worker), then `npx playwright test --config playwright.port3012.config.js ...` (untracked copy of `playwright.config.js` on port 3012; `node e2e/generate-specs.js` first).
- One commit per task on `feat/parser-foundations`. No Co-Authored-By or any trailer. Never `--no-verify`.
- Never edit generated files (`website-data.json`, `generated-types.ts`, `generated-firebase-types.ts`, `website-data.d.ts`); change the generator instead.
- No patch notes: nothing here is user-visible except Task 7's smoother UI, which gets a proposed note for approval.
- Minimal tests: one test per new behaviour, extend existing `it.each` tables, no per-stat sweeps (see CLAUDE.md "Writing vitest tests").
- No em dashes in code comments or UI copy.

## Review Focus

1. Golden output identical before and after Tasks 2 to 8.
2. `OPT` names: every index named from game evidence (N.js reader or existing parser comment), never guessed.
3. Worker parse returns the same `{ account, characters }` as the main-thread parse, for logged-in, demo and empty states.
4. Empty-account contract still holds (`empty-account.test.js`, `null-fallback-shape.test.js`).

---

## Phase A: gates and names (do now)

### Task 1: Golden parse output tool

**Files:** `tools/parse-golden/golden.mjs` (new), `package.json` script `parse:golden`.

- [ ] Parse every fixture in `__test__/fixtures/` with Date frozen at a constant, deep-clone `{ account, characters }` (skip functions, mark cycles), write a stable-key JSON per fixture plus one SHA-256 summary to `.golden/` (gitignored).
- [ ] `--compare` mode: re-parse, diff against `.golden/`, print the first 50 differing paths grouped by section, exit 1 on any difference.
- [ ] Reuse the clone/diff from the 2026-10-27 harness (scratch `passes.harness.test.mjs`).
- [ ] Commit `Tools: golden parse output for refactor checks`.

### Task 2: Pass convergence guard

**Files:** `parsers/index.ts` (internal `passes` option, default 3), `__test__/parsers/pass-convergence.test.js` (new).

- [ ] Add `passes?: number` to `ParseOptions`, used only by tests. Default behaviour unchanged.
- [ ] Test: for `latest` and `highend`, `parseData(..., { passes: 4 })` deep-equals the default parse. One `it.each` over the two fixtures.
- [ ] Comment on the loop: pass 3 is load-bearing on endgame saves (2026-10-27 measurement); this test fails the day a 4th pass is needed.
- [ ] Commit `Parsers: guard that three passes still converge`.

### Task 3: Parse graph tool

**Files:** `tools/parse-graph/` (config, harness, `analyze.cjs`), `package.json` script `parse:graph`.

- [ ] Move the 2026-10-27 harness in: vite transform that exposes pass hooks, account Proxy, safeSection labels, analysis (stale edges, hubs, SCCs, enumerating readers, post-parse reads).
- [ ] Output a short markdown report so later tasks can show progress: stale edge count, largest cycle size, top hubs.
- [ ] Commit `Tools: parse dependency graph report`.

### Task 4: Named account option indices

**Files:** `parsers/accountOptions.ts` (new), every file reading `accountOptions?.[N]` (382 reads, 252 indices), `tools/opt-inventory.mjs` (new).

- [ ] Inventory script: every `accountOptions[N]` / `accountOptions?.[N]` read in `parsers/`, `components/`, `utility/`, with file, line and count per index.
- [ ] `OPT` const: name the indices that already have a meaning in a nearby comment, parser name or memory note. Unnamed ones stay out of the map for now.
- [ ] Codemod named reads only: `account?.accountOptions?.[99]` → `account?.accountOptions?.[OPT.penPals]`. Keep the optional chaining and fallback of each site exactly as it was.
- [ ] `npm run parse:golden -- --compare` clean; full vitest; eslint.
- [ ] The golden gate only covers parser output, and this codemod also reaches `components/` and `utility/` (e.g. `components/tools/active-calculator/KillsSection.jsx`). For those files: `next build` succeeds, and `e2e` smoke, no-nan and hydration specs pass (`npm run test:e2e`).
- [ ] Commit `Parsers: name account option indices`.

### Task 5: Decode JSON-in-JSON fields once

**Files:** `parsers/index.ts` (`getStaticData`), parsers calling `tryToParse(idleonData?.X)` on the same raw key.

- [ ] Inventory the 201 `tryToParse` calls by raw key; pick keys parsed in 2 or more places.
- [ ] Decode those once in `getStaticData` into a `decoded` object on static data; switch callers to it. Callers outside the pipeline (components) stay as they are.
- [ ] Golden compare clean; commit `Parsers: decode shared save fields once`.

### Task 6: Game index usage report

**Files:** z-processing `analysis/` (new `opt-usage.js`), `/new-it-version` skill doc.

- [ ] Per game version: every `OptionsListAccount")[N]` read and write in N.js (554 literal indices on 2026-10-27, plus computed `[Math.round(B + i)]` bases), with the calling function names.
- [ ] Diff against the previous version: new indices, indices whose callers changed, indices the toolbox reads that the game no longer touches, indices not yet in `OPT`.
- [ ] Add the report to the `/new-it-version` checklist.
- [ ] Commit in z-processing `Analysis: account option usage report`.

## Phase B: user-facing wins

### Task 7: Make the parse result cloneable (DROPPED 2026-10-27)

> Not needed as planned: `npm run parse:graph` shows the result holds no live account (see Measurements). **But** Task 8 found the real blocker in the browser: `hole.ts` wraps ~20 `holesObject` arrays in a zero-default `Proxy`, which browsers refuse to post (Node's `structuredClone` accepts Proxies, which is why the Node check passed). Solved in Task 8: `parsers/zeroIndexArray.ts` tracks those proxies, the worker detaches them to plain arrays and the main thread re-attaches them at the same paths, so UI reads of missing slots still return 0.

**Files:** sections found by the post-parse read check, `__test__/parsers/` (one test).

- [ ] Use `parse:graph` to list sections whose results hold the live `account` (post-parse reads) or functions.
- [ ] Replace stored `account` references with the specific values they need, or compute them at call time from an `account` argument.
- [ ] Test: `structuredClone(parseFixture(latest))` succeeds and deep-equals the original.
- [ ] Before changing a result's shape, grep `components/`, `pages/`, `utility/` and `hooks/` for every reader of the removed field or reference, and update them in the same commit. The golden gate cannot see a component reading a field that no longer exists.
- [ ] Golden compare clean; `next build`; `e2e` smoke and no-nan specs; open the pages of each changed section on the demo account (`?demo=true`) and confirm they render the same numbers as before.
- [ ] Commit `Parsers: keep parse results plain data`.

### Task 8: Parse in a Web Worker

**Files:** `workers/parse.worker.ts` (new), `components/common/context/AppProvider.jsx` (6 call sites), `utility/helpers.js:971`, `e2e/` smoke.

- [ ] Test (from dropped Task 7): `structuredClone(parseFixture(latest))` succeeds and deep-equals the original, so a future function or class instance in a result fails CI instead of the worker.
- [ ] Worker wraps `parseData`; main thread keeps a sync fallback for environments without workers (tests, build).
- [ ] Check the worker bundle: no React, no MUI, no firebase. Parsers importing `utility/helpers` must only pull pure helpers; split any helper that drags UI code.
- [ ] Route every entry point through the worker, so no path keeps a main-thread parse with different behaviour: the 6 `parseData` calls in `AppProvider.jsx` (cloud updates, `reparseOwnAccount` companion toggle, demo, manual load) and the clipboard import in `utility/helpers.js:971` (`handleLoadJson`).
- [ ] The account now arrives asynchronously. Check that nothing reads `state.account` between dispatch and arrival in a way that breaks: dashboard alerts, goals, and any effect that fires on load. Test with real loads in the browser (demo, clipboard import, a cloud update), not only unit tests.
- [ ] Verify: same output as the main-thread parse on the demo account; no main-thread long task over 200 ms during a cloud update (Performance panel); hydration and chunk-audit e2e green.
- [ ] Propose a patch note for approval (smoother updates), add only if approved.
- [ ] Commit `Parse saves in a background worker`.

## Phase C: bounded experiment, then decide

### Task 9: Hub split experiment (no commit unless it passes)

- [ ] For the top hubs (`jellyOperator`, `sushiStation`, `legendTalents`, `upgradeVault`, `voteBallot`), find the bonus values other sections read from them (the `getXxxBonus` helpers).
- [ ] Prototype: compute those bonus values early in the pass, from the save and already-final sections, separately from the full section parse.
- [ ] Measure with `parse:graph` and the convergence harness. Success means endgame p2→p3 changes drop to 0 **and** golden output is unchanged at 3 passes.
- [ ] Decide and write the result into this plan:
  - Success: keep the split, drop to 2 passes in a separate task, and repeat for the next hubs.
  - Failure: discard the prototype, keep 3 passes plus the Task 2 guard. Close the node-graph idea.

## Not in this plan (decided 2026-10-27)

- Framework and styling migration (React Router, Tailwind): bugs it would prevent are already gated.
- Full valibot schemas over the save; running game code as the runtime; a rewrite.
- Engine package extraction: revisit when a second consumer needs real calculations (the bot's hand-mirrored `guild-stats.ts` is the first sign). Task 8 draws most of that boundary.
- Per-domain website-data loading: re-measure chunks after Task 8 first, since the parser's data moves into the worker.
