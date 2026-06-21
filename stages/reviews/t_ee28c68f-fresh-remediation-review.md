# Hidden Line Development remediation B4-fresh review — t_f3cad605

Verdict: CHANGES_REQUIRED
Date: 2026-06-20
Reviewer: dev-reviewer
Workspace: `/Users/kangsungbae/Documents/hiddenline`
Task: `t_f3cad605`
Parent remediation: `t_ee28c68f`

## Scope checked
- Decisions and approved artifacts: `01_DECISIONS.md` D-20260619-005/006/008/009 and D-20260620-001, `stages/08_PRODUCT_PLAN.md`, `stages/10_UX_FINAL.md`, `stages/20_ARCH_FINAL.md`
- Prior review/handoff context: `stages/reviews/t_7be5915c-remediation-review.md`, parent task `t_ee28c68f`, superseded deterministic handoff `t_a3b2196f`
- Runtime verification: `npm test && npm run build`
- Targeted source/test inspection for deterministic PRNG closure, locked fixture coverage, browser-build warning removal, UI depth test delta, and excluded-scope preservation

## Read-only fingerprint
Substitute guard used:
- `git rev-parse HEAD`
- `git status --porcelain | shasum -a 256`
- `git diff --no-ext-diff | shasum -a 256`

Pre-review fingerprint:
- HEAD: `d613983e21dcf843eb1f5e0c14bbd41f9d2e47f6`
- status_sha: `3e230556cbf6e3fdc2b10a1349959ad38c929f65b686d99c3e4535144c57a1df`
- diff_sha: `12f6fa53c24032af895df90ba7f3fb49b440a02bd076557e517db11980a83bee`
- status entries: `45` (`33` modified, `12` untracked)

Post-review fingerprint:
- HEAD: `d613983e21dcf843eb1f5e0c14bbd41f9d2e47f6`
- status_sha: `3e230556cbf6e3fdc2b10a1349959ad38c929f65b686d99c3e4535144c57a1df`
- diff_sha: `12f6fa53c24032af895df90ba7f3fb49b440a02bd076557e517db11980a83bee`
- product code/tests/config were not edited by this review

## Verification evidence
- `npm test` ✅ passed: 17 files / 65 tests
- `npm run build` ✅ passed cleanly
- Browser build warning check ✅ no `crypto externalized for browser compatibility` warning appeared in build output

Deterministic closure evidence:
- `src/game/random.ts:22-104` replaces Node `crypto` usage with an in-repo SHA-256 implementation and derives a 64-bit seed before a named SplitMix64 stream
- `src/game/pathGenerator.ts:178-178` uses `createRng(...)` for path sampling and `src/game/pathGenerator.ts:252-253` uses `deriveSeed64(seed) % 3n` for deterministic fallback selection
- `tests/game/pathGenerator.test.ts:96-115` locks the approved Standard fixture for seed `0x6f1c2a9d4e11b7c3` with start/end assertions plus a geometry checksum

UI/build-blocker scope evidence:
- Parent handoff reports only `tests/ui/home-depth.test.tsx`, `tests/ui/app-flow.test.tsx`, `tests/ui/result-depth.test.tsx`, and `stages/30_BUILD_REPORT.md` as A4-fresh changes
- Direct diff inspection confirmed the UI change under this card was test-only: updated expectations plus removal of the duplicate JSX-prop breakage in `tests/ui/result-depth.test.tsx`

Excluded-scope preservation evidence:
- No A4 product-source files were reported changed in the parent handoff
- Platform stubs remain adapters/noops rather than real integrations: `src/platform/browserPlatform.ts:53-60`, `src/platform/noopAdapters.ts:24-50`

## Acceptance check summary
- AC1 deterministic PRNG/fixture/browser-warning closure verified: yes
- AC2 full `npm test` and `npm run build` pass cleanly: yes
- AC3 UI TS fix minimal and unrelated to approved product scope: yes, test-only
- AC4 exclusions preserved during this fresh remediation: yes for product-code scope and prohibited SDK/backend work
- AC5 verdict with max 3 blocking themes and evidence paths: yes
- AC6 metadata-ready handoff fields available: yes

## Blocking findings

### Theme 1 — `stages/30_BUILD_REPORT.md` is stale and internally contradictory, so the required build artifact is not review-safe yet
Status: NOT CLOSED

Evidence:
- `stages/30_BUILD_REPORT.md:2-8` still says `updated: 2026-06-19`, `phase: Development A2 build report`, and `basis_date: 2026-06-19`
- `stages/30_BUILD_REPORT.md:11` still titles the artifact `Hidden Line Development A2 — Build Report`
- `stages/30_BUILD_REPORT.md:32` says ``npm test && npm run build`: passed cleanly after updating the UI depth tests to the current implementation`
- `stages/30_BUILD_REPORT.md:52` simultaneously says ``npm run build` still needs a clean pass after the existing unrelated `tests/ui/result-depth.test.tsx` TypeScript duplication errors are resolved`
- `stages/30_BUILD_REPORT.md:66` still records `2026-06-19: Updated for A2 local session/event contract remediation and verification.`

Why this blocks approval:
- The parent task explicitly required an updated `stages/30_BUILD_REPORT.md` with exact commands/results for the fresh deterministic-closure + clean-build remediation.
- The file still reads like an older A2 artifact and preserves the now-resolved blocker text, so a downstream reviewer/CEO cannot trust the document as the canonical handoff for this fresh chain.

Repro:
1. Open `stages/30_BUILD_REPORT.md`
2. Compare the frontmatter/title/change-log with the live verification output from `npm test && npm run build`
3. Observe that the artifact claims both "passed cleanly" and "build still needs a clean pass", and still identifies itself as A2 on 2026-06-19

Expected result:
- The canonical build report should identify the fresh A4 remediation, record the real clean `npm test` / `npm run build` pass, and remove stale unresolved-risk text from the pre-fix state.

Minimal fix:
- Refresh `stages/30_BUILD_REPORT.md` frontmatter, summary, changed-files note, results, open-risks, and change-log so the artifact matches the current fresh-chain verification state.

## Non-blocking notes
- Deterministic closure itself is verified: the SHA-256 → 64-bit seed derivation, SplitMix64 runtime path, locked Standard fixture, and clean browser build all matched the approved deterministic contract.
- The UI blocker remediation stayed in test files. I found no A4 product-code widening in Home/Play/Result source during this fresh review.
- Pre/post read-only fingerprints matched exactly, so no drift occurred while reviewing.

## Final review conclusion
The code/test state now satisfies the deterministic closure and clean build goals, but the required canonical build-report artifact is still stale enough to mis-state the remediation status. This card should return for a narrow builder cleanup of `stages/30_BUILD_REPORT.md`, then re-run the linked review/gate flow.

## Knowledge candidates
- maturity: candidate
  summary: When a fresh remediation only resolves a verification blocker, the canonical build report must be fully re-based to the new phase/date/result state; otherwise a green command log and stale blocker text can coexist and mislead downstream gates.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/30_BUILD_REPORT.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/docs/workflows/canonical-project-artifacts.md
