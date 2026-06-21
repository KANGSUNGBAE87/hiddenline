# Hidden Line QA/Release remediation B — shell separation review

Verdict: CHANGES_REQUIRED
Date: 2026-06-20 KST
Reviewer: dev-reviewer (t_6b32773d)
Workspace: `/Users/kangsungbae/Documents/hiddenline`
Input decision: `01_DECISIONS.md` D-20260620-004
Parent dev-builder: `t_d62cc6f0`
Scope: COND-1 remediation only — Google Play/default shell must not expose Apps in Toss miniapp shell, while Apps in Toss shell compatibility remains explicitly available.

## Read-only fingerprint
- Workspace baseline at review start: `git rev-parse HEAD` = `d613983e21dcf843eb1f5e0c14bbd41f9d2e47f6`
- Review was performed read-only against the existing tracked diff; no product files were edited by this reviewer.
- Targeted remediation files reviewed: `src/App.tsx`, `tests/ui/app-flow.test.tsx`, `tests/ui/language-switcher.test.tsx`, `stages/40_RELEASE_REPORT.md`, `stages/41_RELEASE_REMEDIATION_NOTE.md`

## Verification run
| Command | Result | Evidence |
| --- | --- | --- |
| `npm test` | PASS | 17 files / 65 tests passed in 1.77s |
| `npm run build` | PASS | default/Google Play build succeeded; `dist/assets/index-UyYXa5zv.js` |
| `VITE_TARGET=apps-in-toss npm run build` | PASS | explicit Apps in Toss build succeeded; `dist/assets/index-DKQ6GSCI.js` |

Separate-shell testability exists: `tests/ui/app-flow.test.tsx` stubs `VITE_TARGET=google-play` and `VITE_TARGET=apps-in-toss`, and both production builds succeeded.

## Scope preservation check
PASS. The reviewed remediation stays inside shell-target separation and does not add excluded-scope product capabilities.

Evidence:
- `package.json` still contains only `react` and `react-dom` runtime deps; no real Toss/Google SDK, ads, IAP, login, or backend packages were added.
- `src/platform/noopAdapters.ts` remains stub-only for auth/payment/ads/backend.
- No reviewed file introduces public 12-level ladder or public 0-100 difficulty promises.
- `stages/41_RELEASE_REMEDIATION_NOTE.md` accurately states the intended narrow scope.

## Issue themes

### 1. Google Play shell separation is still incomplete in accessibility semantics
Severity: Medium

Evidence:
- `src/App.tsx:29-30` renders `GooglePlayTopBar`, but it still uses `i18n.t("shell.navLabel")` for the `aria-label`.
- `src/i18n/messages.ts:189-193` and `src/i18n/messages.ts:357-360` define that label as `미니앱 상단 메뉴` / `Miniapp top menu`.
- `tests/ui/app-flow.test.tsx:27` explicitly asserts this miniapp label on the Google Play path.

Why this blocks closure:
- The accepted remediation goal was that Google Play/default must not expose the Apps in Toss miniapp shell.
- Even after hiding the Toss buttons and icon, the Google Play shell still exposes miniapp wording to assistive tech and test expectations.
- This means the remediation only removed visual chrome; it did not fully separate the shell contract.

Expected result:
- Google Play/default shell should use Google Play-neutral wording for its accessible top bar, not any `miniapp` label.

Minimum fix:
- Split shell copy by target instead of reusing `shell.*` miniapp keys for the Google Play top bar.
- Update the Google Play test to assert the neutral label instead of `미니앱 상단 메뉴`.

### 2. Google Play/default target lost the only user-selectable locale control
Severity: Medium

Evidence:
- `src/App.tsx:27-30` nests `LanguageSwitcher` only inside `TossTopControls`; `GooglePlayTopBar` has no locale control.
- Repo-wide search shows no other runtime usage of `LanguageSwitcher` or `settings.language` outside `App.tsx`/messages.
- `tests/ui/language-switcher.test.tsx:17-27` covers locale switching only for `apps-in-toss`.
- `tests/ui/app-flow.test.tsx:48-49` now encodes the Google Play path as having no language control on the play screen, but there is still no alternate Google Play locale entry on home/result/default shell.

Why this blocks closure:
- Project and shared app-platform rules require Korean default with English user-selectable from the first version.
- Before this remediation, the app-level chrome exposed the language switcher globally. After separation, the default/Google Play target no longer exposes any obvious locale switch path.
- This is a real user-facing regression introduced by the shell split, not an unrelated product enhancement.

Expected result:
- Google Play/default users must still be able to switch between Korean and English without entering the Apps in Toss shell.

Minimum fix:
- Add a Google Play-safe locale affordance (for example on Home or the neutral top bar) without reintroducing Toss-specific controls.
- Add a Google Play-path test that proves locale switching works in the default target.

## Verdict rationale
CHANGES_REQUIRED.

The remediation successfully made shell targets separately buildable/testable and preserved excluded scope, but it did not fully satisfy D-20260620-004. Google Play/default still exposes miniapp-specific semantics through accessibility copy, and the shell split regressed the only visible locale-switch path for the default target. Downstream QA/release must not treat this remediation as approved.

## Narrow remediation required
1. Keep `VITE_TARGET`-based shell split.
2. Introduce Google Play-neutral shell copy/ARIA labels.
3. Restore a user-selectable locale path for Google Play/default.
4. Extend tests so Google Play/default asserts both:
   - no Toss miniapp chrome or miniapp wording
   - locale switching still works
5. Re-run `npm test`, `npm run build`, and `VITE_TARGET=apps-in-toss npm run build`.

## Knowledge candidates
- maturity: candidate
  summary: Shell separation reviews must check accessibility semantics and control discoverability, not only visible chrome. A Google Play-safe shell can still fail closure if it reuses Apps in Toss `miniapp` labels or removes the only locale-control path.
  evidence_path: `/Users/kangsungbae/Documents/hiddenline/src/App.tsx`; `/Users/kangsungbae/Documents/hiddenline/tests/ui/app-flow.test.tsx`; `/Users/kangsungbae/Documents/hiddenline/tests/ui/language-switcher.test.tsx`; `/Users/kangsungbae/Documents/hiddenline/stages/reviews/t_6b32773d-shell-remediation-review.md`
  suggested_owner_file: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/app-platform-standard.md`
