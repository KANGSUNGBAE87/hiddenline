# Hidden Line Development remediation B2 review — t_f322cc41

Verdict: CHANGES_REQUIRED
Date: 2026-06-20
Reviewer: dev-reviewer
Workspace: `/Users/kangsungbae/Documents/hiddenline`
Task: `t_f322cc41`
Parent remediation: `t_7be5915c`

## Scope checked
- Decisions and approved artifacts: `01_DECISIONS.md`, `stages/08_PRODUCT_PLAN.md`, `stages/10_UX_FINAL.md`, `stages/20_ARCH_FINAL.md`
- Prior review/handoff context: `t_1dfe53d5`, `t_3fed6b22`, `t_7be5915c`
- Runtime verification: `npm test`, `npm run build`
- Targeted source/test inspection for preset contract, event/session persistence, `return_next_day`, local-only feedback, and deterministic fixture/PRNG closure

## Read-only fingerprint
Pre-review substitute guard:
- `scripts/readonly_guard.py`: not present in repo
- substitute fingerprint: `git rev-parse HEAD` + `git status --short`
- HEAD: `d613983e21dcf843eb1f5e0c14bbd41f9d2e47f6`
- pre-review status entries: `44`

Post-review note:
- product code/tests/config were not edited by this review
- only reviewer artifact added: `stages/reviews/t_7be5915c-remediation-review.md`

## Verification evidence
- `npm test` ✅ passed: 17 files / 71 tests
- `npm run build` ✅ passed
- build warning still present: Vite reports `Module "crypto" has been externalized for browser compatibility` from `src/game/random.ts`

## Acceptance check summary
- AC1 docs/handoffs read: yes
- AC2 read-only review with fingerprint: yes, using git substitute guard
- AC3 remaining blockers closed: no
- AC4 test/build and targeted inspection: yes
- AC5 max 3 themes with evidence: yes
- AC6 ready for CEO gate decision: yes, with `CHANGES_REQUIRED`

## Blocking findings

### Theme 1 — Approved 5 named presets / Intro-first / progressive result flow are still not implemented
Status: NOT CLOSED

Expected contract:
- `stages/08_PRODUCT_PLAN.md:74-99` locks first public exposure to `Intro / Easy / Standard / Hard / Expert`
- `stages/10_UX_FINAL.md:133-143` requires Intro onboarding before first run
- `stages/10_UX_FINAL.md:186-200` requires same-seed retry as the first result CTA with `more actions` containing adjacent preset / daily / feedback
- `stages/20_ARCH_FINAL.md:154-167` says public UX must expose only 5 named presets and keep the internal 20+ floor hidden

Current implementation:
- `src/App.tsx:179-191` still bootstraps a daily pack and defaults selection to `main / normal / normal`, not an Intro preset
- `src/ui/HomeScreen.tsx:262-327` still exposes `lineDifficulty`, `visibility`, and line-family cards as player-facing controls
- `src/ui/HomeScreen.tsx:366-368` still labels the primary CTA from line type (`오늘의 선 시작하기` or line-family start), not from Intro-first preset onboarding
- `src/ui/ResultScreen.tsx:152-158` still exposes only `Retry` and `Home`; there is no approved progressive-disclosure shell for adjacent preset / daily / feedback actions
- `tests/ui/app-flow.test.tsx` and `tests/ui/home-depth.test.tsx` still pass against this public daily-pack UI, which confirms the old contract remains the tested behavior

Repro:
1. Render `<App />`
2. Observe Home exposes line family + line difficulty + visibility controls instead of 5 named presets
3. Finish a run and observe Result offers only retry/home rather than retry-first plus `더 많은 선택`

Expected result:
- First public surface is Intro/Easy/Standard/Hard/Expert only
- First run defaults to Intro
- Revisit restores approved preset state
- Result keeps same-seed retry first and hides adjacent/daily/feedback under progressive disclosure

Minimal fix:
- Reintroduce a public `preset_id` layer and map it to internal generator/scoring parameters
- Restore Intro-first default and revisit restore logic
- Move adjacent/daily/feedback actions behind the approved result-shell interaction

### Theme 2 — Repository scaffolding exists, but the approved local event/session/return-next-day/feedback contract is still not wired into app behavior
Status: PARTIALLY CLOSED ONLY

What is closed:
- `src/storage/schema.ts:43-85` now defines `PresetId`, session events, and session-state keys
- `src/storage/localStorageRepository.ts:103-111` now provides `appendEvent`, `getSessionState`, `setSessionState`, and `setLastPresetId`

What is still missing from the approved contract:
- `stages/20_ARCH_FINAL.md:263-279` requires `last_session_state_loaded`, `last_session_state_saved`, `return_next_day`, and local-only free-text feedback boundary
- `stages/20_ARCH_FINAL.md:297-321` requires the shared event mapping table including `app_opened`, `home_viewed`, `preset_list_viewed`, `onboarding_viewed`, `retry_same_seed_started`, `adjacent_preset_selected`, `daily_entry_opened`, `daily_run_started`, `difficulty_feedback_prompted`, and more
- `stages/10_UX_FINAL.md:247-279` requires daily entry and 5-point difficulty feedback capture

Current implementation evidence:
- `search_files` across `src/**/*.ts*` finds approved event names only in the type union at `src/storage/schema.ts:45-63`; there are no emit sites in app/home/play/result code
- `src/App.tsx:187-198` creates `LocalStorageRepository`, but `src/App.tsx:308-313` only updates in-memory line selection and start navigation; it does not call `setLastPresetId`, `setSessionState`, or `appendEvent`
- `src/App.tsx:179-180` memoizes `createDailyContext()` once for the full mount, so the app cannot detect a day rollover and cannot emit `return_next_day`
- `src/App.tsx:279-295` transitions to Result/Retry without logging `run_completed`, `run_failed`, `result_viewed`, or `retry_same_seed_started`
- `src/ui/ResultScreen.tsx:138-158` renders coaching chips plus Retry/Home only; there is no daily entry CTA, no difficulty feedback prompt, and no local-only free-text path
- `tests/storage/localStorageRepository.test.ts:45-100` covers run-record behavior only; `search_files` across `tests/**/*.test.ts*` found zero coverage for `appendEvent`, `getSessionState`, `setSessionState`, or `lastPresetId`

Repro:
1. Search for `appendEvent(`, `getSessionState(`, `setSessionState(`, `setLastPresetId(` usages outside `src/storage/localStorageRepository.ts`
2. Search for approved event names such as `app_opened`, `home_viewed`, `return_next_day`, `difficulty_feedback_prompted`
3. Observe there are no runtime emit/hydrate sites and no tests for the new repository helpers

Expected result:
- The new repository must be used by app flows, not just declared
- Session load/save and revisit logic must be observable in code/tests
- Raw feedback text must remain local-only with approved prompt/submission events

Minimal fix:
- Wire the repository into app lifecycle and result actions
- Emit the approved local event contract from screen transitions
- Save/load last session state and last preset state
- Add the approved 5-point feedback flow and keep raw text off analytics
- Add regression tests for repository usage, not only repository existence

### Theme 3 — Deterministic fixture/PRNG closure is still open, and the current implementation also leaves a browser-compatibility warning
Status: NOT CLOSED

Expected contract:
- `stages/20_ARCH_FINAL.md:91-105` requires SHA-256 truncated 64-bit seed derivation plus a named deterministic PRNG contract
- `stages/20_ARCH_FINAL.md:129-145` requires a locked fixture using `preset=Standard`, `seed=0x6f1c2a9d4e11b7c3`, checksum, and start/end assertions
- `01_DECISIONS.md:101-103` explicitly narrowed this remediation scope to closing the deterministic seed/fixture gap

Current implementation:
- `src/game/random.ts:5-12` still drives runtime RNG from `stableHash()` (32-bit FNV-style hash)
- `src/game/random.ts:23-32` still uses a custom 32-bit stream generator, not the approved named PRNG contract
- `src/game/random.ts:14-20` adds `deriveSeed64()`, but it is not used by `createRng()`
- `src/game/pathGenerator.ts:252` still derives fallback branching from `stableHash(seed) % 3`
- `tests/game/pathGenerator.test.ts:49-57` only checks same-input-equals-same-output inside the current implementation; it does not lock the architecture fixture or verify checksum/start/end for `0x6f1c2a9d4e11b7c3`
- `npm run build` still emits a browser warning because `src/game/random.ts:1` imports Node `crypto`
- `stages/30_BUILD_REPORT.md:40` explicitly says the deterministic seed/PRNG contract was left as a CEO decision instead of being closed in code/tests

Repro:
1. Open `src/game/random.ts`
2. Confirm runtime RNG still starts from `stableHash(seed)` and not from the 64-bit helper
3. Search tests for `0x6f1c2a9d4e11b7c3` and observe no locked fixture exists
4. Run `npm run build` and observe the `crypto` externalization warning

Expected result:
- Either the implementation matches the approved deterministic contract, or the approved architecture/decision is formally reopened before merge
- A locked fixture exists in tests
- Browser build does not depend on Node-only `crypto` in shipped client code without an approved boundary

Minimal fix:
- Align runtime RNG with the approved deterministic contract and add the locked fixture test, or reopen the architecture/decision before CEO gate
- Remove the browser `crypto` warning as part of the final deterministic path

## Non-blocking notes
- Excluded runtime scope still appears preserved: auth/payment/ads/backend remain noop adapters (`src/platform/noopAdapters.ts`, `src/platform/browserPlatform.ts`), and targeted search found no product-flow calls to those adapters.
- The local repository additions are a real improvement, but they are insufficient evidence that the approved behavior contract is closed.

## Final review conclusion
This remediation is not ready for Development approval. The workspace is better than the original B review because session/event repository scaffolding now exists, but the approved public preset UX, runtime local event/session wiring, return-next-day behavior, feedback flow, and deterministic closure are still not finished.

## Knowledge candidates
- maturity: confirmed
  summary: In local-first app validations, a new repository or schema is not enough to close a measurement contract; review must verify actual emit/hydrate call sites and regression tests for those flows.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/src/storage/localStorageRepository.ts
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/docs/workflows/apps-in-toss-development-gate.md
- maturity: confirmed
  summary: A deterministic architecture requirement is not closed by adding a helper alone; the runtime PRNG path, locked fixture test, and browser-compatible implementation must all converge before the fairness contract can be considered verified.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/src/game/random.ts
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/projects/hiddenline/platform.md
- maturity: candidate
  summary: When a product plan fixes public difficulty language to named presets, result-flow regressions often survive in adjacent UI surfaces even after underlying generator work improves; review should re-check Home defaults and Result CTA ordering together.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/10_UX_FINAL.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/agent/operating-rules.md
