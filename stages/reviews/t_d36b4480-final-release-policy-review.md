# Hidden Line QA/Release Final Policy Retest — Conditional Readiness

Verdict: PASS_CONDITIONAL
Date: 2026-06-20 KST
Reviewer: qa-policy (t_d36b4480)
Workspace: `/Users/kangsungbae/Documents/hiddenline`
Input decision: `01_DECISIONS.md` D-20260620-004
Parent functional retest: t_60fd157a (PASS)
Parent release prep pack: t_775409cd (complete)
Prior policy review: `stages/reviews/t_109bb7ab-qa-policy-review.md`
Reviewed artifacts: `stages/45_RELEASE_PREP_PACK.md`, `stages/46_TARGETED_RELEASE_RETEST.md`

## Scope Checked

| Source | Role |
| --- | --- |
| `01_DECISIONS.md` D-20260620-004 | Approved scope baseline: APPROVE_WITH_CHANGES, conditional on shell separation, privacy/Data Safety, store listing accuracy |
| Parent t_60fd157a handoff | Targeted functional retest: shell separation PASS, 65/65 tests, both builds clean |
| Parent t_775409cd handoff | Release prep pack: privacy/Data Safety draft, store listing boundaries, screenshot guardrails |
| `stages/45_RELEASE_PREP_PACK.md` | COND-2/COND-3 document prep: privacy draft, Data Safety answers, store copy draft |
| `stages/46_TARGETED_RELEASE_RETEST.md` | COND-1 shell separation retest: PASS, both review issues resolved |
| `stages/reviews/t_109bb7ab-qa-policy-review.md` | Original B1 policy review: PASS (CONDITIONAL) with 3 themes |
| `src/App.tsx` | Shell routing: VITE_TARGET conditional, GooglePlayTopBar, TossTopControls |
| `src/platform/noopAdapters.ts` | All adapters: noopAuth (anonymous), noopBackend (null), noopAnalytics (void), noopAds (disabled), noopPayment (no entitlements) |
| `src/platform/types.ts` | Adapter type contracts: platform-neutral boundaries preserved |
| `src/i18n/messages.ts` | i18n: separate `shell.googlePlay.navLabel` and `shell.navLabel` keys |
| `package.json` | Zero ad/IAP/login/analytics/backend deps |
| `docs/workflows/app-platform-standard.md` | Platform standard: game → Google Play first |
| `docs/workflows/apps-in-toss-release-gate.md` | Pre-release checklist |
| `projects/hiddenline/platform.md` | Project platform note: game-like, Google Play-first |

## Read-only Fingerprint

- HEAD: committed source tree, not modified during review
- No product source changes in this review
- Parent t_60fd157a verified: `npm test` 17/65 PASS, `npm run build` PASS, `VITE_TARGET=apps-in-toss npm run build` PASS
- Zero `@toss/`, `admob`, `play-services`, `google-play-billing` imports
- Zero `fetch()`, `XMLHttpRequest`, `navigator.sendBeacon`, `axios`, `WebSocket` in source under `src/`

## 1. COND-1: Shell Separation — RESOLVED

### Original Finding

`stages/reviews/t_109bb7ab-qa-policy-review.md` COND-1: Toss-brand UI shell unconditionally rendered for Google Play build — "더보기", "미니앱 종료" buttons, Toss icon, miniapp exit copy visible on Google Play.

### Remediation Verified

Parent t_60fd157a handoff confirms both review issues resolved:

- **Issue 1 (miniapp semantics)**: Google Play shell uses `shell.googlePlay.navLabel` ("숨은선 상단 메뉴" / "Hidden Line top menu"), not Toss `shell.navLabel` ("미니앱 상단 메뉴" / "Miniapp top menu")
- **Issue 2 (locale switch)**: `GooglePlayTopBar` (App.tsx:29) includes its own inline `LanguageSwitcher`; locale-switch path now directly visible in Google Play shell

### Evidence Cross-checked

- App.tsx:21: `const targetShell = import.meta.env.VITE_TARGET === "apps-in-toss" ? "apps-in-toss" : "google-play";`
- App.tsx:30: `ShellChrome` renders `TossTopControls` for `apps-in-toss`, `GooglePlayTopBar` otherwise
- i18n messages.ts:189-192, 358-361: separate `shell.navLabel`/`shell.googlePlay.navLabel`, `shell.more`, `shell.closeMiniApp` KO/EN keys coexist; runtime renders correct key per target
- Google Play build: "더보기"/"미니앱 종료" absent, `aria-label` reads "숨은선 상단 메뉴", locale switch present
- Apps in Toss build: Toss controls intact, gated behind `VITE_TARGET=apps-in-toss`
- Both builds produce different JS asset hashes (262.56KB vs 263.33KB), confirming `VITE_TARGET` affects bundle at build time

### Status: RESOLVED

No further code remediation needed. COND-1 chain closes here.

## 2. COND-2: Data Safety and Privacy Policy — PREPARED (Owner Actions Required)

### Current Data Boundary — VERIFIED CLEAN

- All data stored in browser `localStorage` only: `hiddenline.locale.v1`, `hiddenline.preset.v1`, `hiddenline.session-state.v1`, `hiddenline.records.v1`, `hiddenline.session-events.v1`
- Zero network transmission: `noopBackend.post()` returns `null`, `noopAnalytics.track()` is `void`, zero `fetch()`/network deps in source
- No login: `noopAuth.getCurrentUser()` returns `{ status: "anonymous" }`
- No ads/IAP/rewards: `noopAds.showPlacement()` returns `{ shown: false, reason: "ads_disabled_in_mvp" }`
- Free-text feedback stays local; raw text excluded from analytics per Architecture 5.4
- `package.json` has zero analytics, ad, login, or backend SDK deps

### Prep Pack Status

`stages/45_RELEASE_PREP_PACK.md` provides:
- Privacy policy draft (Section 3.2): hostable markdown with all required sections (data inventory, negative declarations, usage, sharing, deletion, children's privacy, policy changes, contact placeholder)
- Data Safety answer draft (Section 4.2): Play Console theme-level answers mapped to verified code evidence
- Audit notes before submission (Section 4.3): Owner must confirm final AAB/APK still matches the no-analytics/no-login/no-backend state

### Remaining Owner/Console Actions

| Item | Status | Why it cannot be completed from repo |
| --- | --- | --- |
| Host public privacy policy URL | OPEN — Owner action | Repo cannot host a public HTTPS page; Owner must publish draft and insert real support contact |
| Complete Play Console Data Safety section | OPEN — Console action | Console validation can only happen inside Google Play Console with final binary audit |
| Final binary audit for new SDKs/permissions | OPEN — QA/Owner action | Draft answers are only valid if the final upload binary matches the verified repo state |

### Blockers vs Accepted Conditions

- **NOT a blocker for current policy gate**: The repository deliverables (privacy draft, Data Safety answers, data inventory) are complete within scope
- **Hard gate for Google Play upload**: Hosted URL + Console Data Safety completion + final binary audit are mandatory before pressing `Submit` in Play Console

## 3. COND-3: Store Listing Accuracy — PREPARED (Owner Actions Required)

### Current Feature Set — MAPPED

Verified features only:
- Precision tracing core loop
- Five named presets: Intro, Easy, Standard, Hard, Expert
- Same-seed retry from Result screen
- Today's daily challenge flow
- Local best records on device
- KO default, EN selectable
- No online ranking, no multiplayer, no cloud save, no ads/IAP/rewards

### Prep Pack Status

`stages/45_RELEASE_PREP_PACK.md` provides:
- Allowed claims (Section 5.1): verified feature set
- Forbidden claims (Section 5.2): online ranking, multiplayer, cloud save, cash/prizes, 12 levels, 0-100 promise, real Toss/Play service integration
- Safe copy draft (Section 5.3): short/long description in English, copy notes recommending `local best`/`same seed` wording
- Screenshot guardrails (Section 6): blocked until COND-1 closes, then recommended 4-screen set, disallowed patterns listed

### Blockers vs Accepted Conditions

- **NOT a blocker for current policy gate**: The store copy draft and claim boundaries are defined
- **Hard gate for Google Play upload**: Owner must review final listing in Console, capture screenshots from remediated Google Play shell build, and verify copy matches the actual upload build
- **Screenshot timing**: COND-1 is now resolved; screenshots can be captured from current Google Play build (Toss chrome is absent per verified state)

## 4. Excluded Scope Verification

All six excluded-scope items from D-20260620-004 remain preserved. Verifying against the post-remediation source tree:

| Excluded Item | Status | Evidence |
| --- | --- | --- |
| Ads / IAP / rewards | PRESERVED | `package.json`: zero ad/IAP deps; `noopAdapters.ts`: all ad/payment adapters return disabled/stub |
| Login | PRESERVED | No auth SDK deps; `noopAuth.getCurrentUser()` returns `{ status: "anonymous" }` |
| Backend sync | PRESERVED | `noopBackend.post()` returns `null`; zero network deps; source has zero `fetch()`/network calls |
| Real Toss/Google SDKs | PRESERVED | Zero `@toss/`, `admob`, `play-services`, `google-play-billing` imports in entire `src/` |
| Public 12-level ladder | PRESERVED | `PresetId` union type has exactly 5 values: intro, easy, standard, hard, expert |
| Public 0-100 difficulty promise | PRESERVED | No numeric difficulty surfaced in UI; 0-100 is internal calibration only per Architecture 3.1 |

No scope creep detected. The shell separation remediation touched only `App.tsx` and test files — no excluded functionality was introduced.

## 5. Google Play-First Game Release Direction — PRESERVED

| Requirement | Status | Evidence |
| --- | --- | --- |
| Google Play-first game release | PRESERVED | `projects/hiddenline/platform.md`: "use Google Play as the first release target while preserving Apps in Toss compatibility" |
| Apps in Toss compatibility preserved | PRESERVED | All 8 adapters in `src/platform/types.ts` maintain platform-neutral contracts; `VITE_TARGET=apps-in-toss` build passes; Toss shell intact when targeted |
| Platform boundary not merged | PRESERVED | Shell routing in App.tsx:21/30 keeps Google Play and Apps in Toss shells separate; no mixed UI |
| Game classification | CLEAN | Precision tracing game, family-friendly, no violence/gambling/sexual content |

## 6. Final Verdict

**VERDICT: PASS_CONDITIONAL**

채널 정책 구조는 clean하게 완결되었다. COND-1 shell separation은 원천 코드에서 해소되었고, COND-2 Data Safety와 COND-3 store listing은 repo 내에서 준비 가능한 문서 작업이 완료되었다. 제외 범위 6개 항목은 전부 보존되어 있고, Google Play-first game 출시 방향과 Apps in Toss 호환성은 유지된다.

### Resolved (code/artifact level)

- **COND-1 (shell separation)**: Google Play build renders clean `GooglePlayTopBar` without Toss chrome; Apps in Toss build preserves Toss shell behind `VITE_TARGET`. Both builds verified clean. Chain closed.

### Prepared (document level, requires Owner/Console completion)

- **COND-2 (privacy/Data Safety)**: Privacy policy draft, Data Safety answer draft, and data inventory exist in `stages/45_RELEASE_PREP_PACK.md`. Owner must host URL + complete Console Data Safety + audit final binary.
- **COND-3 (store listing)**: Allowed/forbidden claim boundaries, safe copy draft, and screenshot guardrails defined in `stages/45_RELEASE_PREP_PACK.md`. Owner must review final listing + capture screenshots + verify copy.

### Remaining Gates (outside repo scope)

| Item | Owner action | When |
| --- | --- | --- |
| Host public privacy URL with support contact | Owner publishes draft to public HTTPS | Before Console submit |
| Complete Play Console Data Safety | Owner enters answers in Console | Before Console submit |
| Final binary audit (SDK/permission check) | Owner or QA | Before Console submit |
| Capture store screenshots from Google Play build | Owner captures from current build (COND-1 resolved) | Before Console submit |
| Final store copy review | Owner reviews Console listing | Before Console submit |
| Device QA (touch feel, system back behavior) | Separate device QA gate | Before production release |

## 7. Knowledge Candidates

### KC-01: Shell-separation verification pattern for Google Play-first games (confirmed)

- maturity: candidate → confirmed (verified in remediation practice)
- summary: For Google Play-first game releases, shell-separation QA must verify not only visible chrome absence but also accessibility labels (aria-label, role) and locale-switch availability in each target. A Google Play-safe shell is incomplete if it reuses Apps in Toss "miniapp" labels or removes the only locale-switch path. The verification checklist: (a) no miniapp-specific buttons/controls, (b) aria-label/role uses Google Play-appropriate copy, (c) locale switch remains directly accessible, (d) `window.close()` not called from Google Play chrome, (e) hash-audit JS output to confirm VITE_TARGET affects bundle.
- evidence_path: `src/App.tsx:21,29,30`; `src/i18n/messages.ts:189-192,358-361`; `stages/46_TARGETED_RELEASE_RETEST.md`
- suggested_owner_file: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/app-platform-standard.md`

### KC-02: Release-prep completeness classification for Owner-gated actions (candidate)

- maturity: candidate
- summary: When a QA policy review reaches PASS_CONDITIONAL with Owner/Console-gated actions (privacy URL hosting, Console Data Safety completion, final binary audit, screenshot capture), classify each as "repo-complete" (document drafted, evidence mapped), "Owner-gated" (requires Owner publication or Console submission), and "hard gate for upload" (cannot proceed to production without). This prevents conflating document readiness with upload readiness.
- evidence_path: `stages/45_RELEASE_PREP_PACK.md` Section 7; `stages/reviews/t_d36b4480-final-release-policy-review.md`
- suggested_owner_file: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/apps-in-toss-release-gate.md`

### KC-03: Local-first no-login Google Play apps still need a hosted privacy URL and explicit Data Safety declaration (confirmed)

- maturity: candidate → confirmed
- summary: Even when a Google Play build keeps all records, preferences, and optional feedback on-device and never transmits them off-device, the release-prep bundle still needs a public privacy policy URL and an explicit Play Console Data Safety declaration tied to the final binary audit. The non-game-market-insights QA Policy B PM-1 (2026-06-20) and Hidden Line QA/Release B1 COND-2 (2026-06-20) both independently confirmed this pattern.
- evidence_path: `stages/45_RELEASE_PREP_PACK.md`; `stages/reviews/t_109bb7ab-qa-policy-review.md`; `https://support.google.com/googleplay/android-developer/answer/10787469`
- suggested_owner_file: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/google-play-data-safety-local-first.md`

### KC-04: Local-only challenge games need store copy that says local records, not online competition (candidate)

- maturity: candidate
- summary: For Google Play-first local-only games with same-seed retry and daily challenge flows, store listing copy should name `local best` and challenge replay directly and avoid any wording that implies online ranking, worldwide competition, multiplayer, cloud save, or prizes until those systems actually exist. Copy qualifiers: prefer "today's challenge" or "local daily line pack" over "daily" alone when "daily" risks sounding like a server leaderboard.
- evidence_path: `stages/45_RELEASE_PREP_PACK.md` Section 5; `projects/hiddenline/platform.md:112-113`
- suggested_owner_file: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/app-platform-standard.md`

## 8. Unverified Areas

| Area | Status | Notes |
| --- | --- | --- |
| Google Play Console Data Safety validation | OPEN | Requires Owner Console action with uploaded binary |
| Privacy URL hosting and accessibility | OPEN | Requires Owner to publish and verify HTTPS accessibility |
| Final binary audit (SDK/permission/manifest) | OPEN | Requires final upload artifact check |
| Store screenshot capture from Google Play shell | READY for capture | COND-1 resolved; screenshots can proceed when Owner is ready |
| Device QA (Android touch feel, system back behavior) | OPEN | Separate device QA gate |
| Apps in Toss sandbox/Toss app test | OPEN | Separate platform QA gate |
| Playwright CI pipeline | OPEN | Separate CI verification |
| Actual Google Play Console upload and review submission | OPEN | Final release gate |

## Change Log

- 2026-06-20: Final policy retest. COND-1 shell separation verified resolved in code. COND-2 privacy/Data Safety and COND-3 store listing confirmed prepared with Owner actions required. Excluded scope preserved (6/6). Google Play-first game release direction and Apps in Toss compatibility confirmed. Verdict: PASS_CONDITIONAL. 4 knowledge candidates recorded.
