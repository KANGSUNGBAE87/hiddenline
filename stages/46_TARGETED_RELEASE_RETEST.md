---
version: 1.0.0
status: final
updated: 2026-06-20T02:56:00+09:00
canonical: false
project: Hidden Line / 히든라인
phase: QA/Release targeted functional retest
basis_date: 2026-06-20 KST
input_decision_id: D-20260620-004
parent_dev_review: t_6b32773d (CHANGES_REQUIRED, archived; issues resolved in source)
scope: Shell separation targeted retest — release-readiness only
---

# Hidden Line QA/Release — Targeted Functional Retest: Shell Separation

## Verdict: PASS

All acceptance criteria met. Both issues from parent review t_6b32773d are resolved
in current source. Google Play/default target renders a clean shell without Toss-specific
miniapp controls/copy/icon, and includes its own locale-switch path. Apps in Toss
target remains gated behind `VITE_TARGET=apps-in-toss` with full Toss chrome intact.
Core flow, i18n, excluded scope verified. PROCEED_TO_POLICY_GATE.

## Build Verification

| Command | Result | Evidence |
| --- | --- | --- |
| `npm test` | 17 files / 65 tests PASS | Run 2026-06-20 02:55 KST, duration 1.73s |
| `npm run build` (default = google-play) | PASS — tsc noEmit ×2, vite build, 3 assets | JS: `index-BRBSyeYv.js` (262.56KB) |
| `VITE_TARGET=apps-in-toss npm run build` | PASS — tsc noEmit ×2, vite build, 3 assets | JS: `index-D-uCPxme.js` (263.33KB) |

JS asset hash differs between Google Play and Apps in Toss builds, confirming
`VITE_TARGET` env affects the bundle at build time (App.tsx:21: `targetShell` routing).

## Shell Separation Verification

### 1. Google Play / Default Target — Toss controls absent, locale switch present

**Evidence**: `tests/ui/app-flow.test.tsx:21-34` ("Google Play shell hides Toss-specific
controls and keeps locale switching"), App.tsx:29 (`GooglePlayTopBar`)

| Assertion | Status | Evidence |
| --- | --- | --- |
| "더보기" button absent | PASS | `app-flow.test.tsx:27`: `queryByRole("button", { name: "더보기" })` → not found |
| "미니앱 종료" button absent | PASS | `app-flow.test.tsx:28`: `queryByRole("button", { name: "미니앱 종료" })` → not found |
| Shell aria-label uses Google Play copy (not "미니앱") | PASS | `app-flow.test.tsx:29`: `banner` role, name = "숨은선 상단 메뉴" (`shell.googlePlay.navLabel`) |
| LanguageSwitcher visible and functional | PASS | `app-flow.test.tsx:31-33`: ko→en toggle works; heading changes "오늘의 숨은선" → "Today's Hidden Line" |
| window.close() not called from Google Play chrome | PASS | `app-flow.test.tsx:58-66`: close spy never called |
| Play screen also free of Toss controls | PASS | `app-flow.test.tsx:55`: in play screen, "미니앱 종료" still absent |

**Review Issue 1 resolved**: Google Play shell uses `shell.googlePlay.navLabel`
("숨은선 상단 메뉴" / "Hidden Line top menu"), not the Toss `shell.navLabel`
("미니앱 상단 메뉴" / "Miniapp top menu"). Both i18n key families coexist in the
message bundle but the runtime renders only the correct one per target.

**Review Issue 2 resolved**: `GooglePlayTopBar` (App.tsx:29) includes its own
inline `LanguageSwitcher` component. The locale-switch path is now directly
visible in the Google Play shell, not dependent on the Toss-only `TossTopControls`
menu.

### 2. Apps in Toss Target — Toss shell intact

**Evidence**: `tests/ui/app-flow.test.tsx:36-41`
("Apps in Toss shell keeps Toss-specific controls when explicitly targeted")

| Assertion | Status | Evidence |
| --- | --- | --- |
| "더보기" button present | PASS | `app-flow.test.tsx:39` |
| "미니앱 종료" button present | PASS | `app-flow.test.tsx:40` |

### 3. Shell routing architecture

App.tsx:21: `const targetShell = import.meta.env.VITE_TARGET === "apps-in-toss" ? "apps-in-toss" : "google-play";`

App.tsx:30: `ShellChrome` renders `<TossTopControls>` for `apps-in-toss`, `<GooglePlayTopBar>` otherwise.

## Core Flow Smoke Check

### Home → Play → exit dialog

**Evidence**: `tests/ui/app-flow.test.tsx:43-85`

| Assertion | Status | Evidence |
| --- | --- | --- |
| Home render: heading, subtitle, start button present | PASS | `app-flow.test.tsx:43-50` |
| Start button → Play Ready screen | PASS | Play screen shows "시작점에 손가락을 올려보세요", canvas present |
| Play back asks exit confirmation | PASS | `app-flow.test.tsx:68-85`: dialog with "계속하기"/"이번 시도 종료"/"홈으로 나가기" |
| Google Play shell stays clean during Play | PASS | `app-flow.test.tsx:55`: no "미니앱 종료" in Play screen |

### i18n KO ↔ EN

**Evidence**: `tests/ui/language-switcher.test.tsx` (1 test), `tests/i18n/index.test.ts` (1 test)

| Assertion | Status | Evidence |
| --- | --- | --- |
| KO default, heading reads "오늘의 숨은선" | PASS | `language-switcher.test.tsx` |
| EN toggle changes heading to "Today's Hidden Line" | PASS | `language-switcher.test.tsx` |
| Locale persisted to localStorage | PASS | `hiddenline.locale.v1` = "en" after switch |
| TypeScript types enforce ko default, en selectable | PASS | Architecture 7.4 compliant |

## Excluded Scope Preservation

No excluded scope appeared in the remediation diff. Verified against baseline
`stages/40_RELEASE_REPORT.md` excluded scope table:

| Excluded Item | Status | Verification |
| --- | --- | --- |
| Ads / IAP / rewards | PRESERVED | package.json: zero ad/IAP deps |
| Login | PRESERVED | No auth deps; app is no-login local-first |
| Backend sync | PRESERVED | Local storage only |
| Real Toss/Google SDKs | PRESERVED | No `@toss/` or Play Services imports; only static tossBrand icon |
| Public 12-level ladder | PRESERVED | PresetId union type unchanged: 5 named presets only |
| Public 0-100 difficulty promise | PRESERVED | No numeric difficulty surfaced in UI |

## Knowledge Candidates

### KC-01: Shell-separation QA must verify accessibility semantics and locale-control discoverability (confirmed)

- maturity: candidate → confirmed (verified in practice)
- summary: Shell-separation QA must verify not only visible chrome absence but also accessibility labels (aria-label, role) and locale-switch availability in each target. A Google Play-safe shell is incomplete if it reuses Apps in Toss "miniapp" labels or removes the only locale-switch path.
- evidence_path: `src/App.tsx:29-30`; `tests/ui/app-flow.test.tsx:21-66`; `src/i18n/messages.ts:189-190,358-359`
- suggested_owner_file: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/app-platform-standard.md`

## Unverified Areas (same as baseline)

- 실제 기기(Android/iOS) 터치 정밀도 및 Safe Area 동작 → device QA gate
- 실제 Apps in Toss 샌드박스/토스앱 테스트 환경 → platform QA gate
- Google Play Console 업로드 및 Data Safety 섹션 → release gate
- Playwright CI pipeline → 별도 검증

## Change Log

- 2026-06-20: Initial targeted retest. Both review issues resolved (miniapp semantics, locale switch). npm test 65/65 PASS, both builds clean. Shell separation verified. Core flow and i18n intact. Excluded scope preserved. Verdict: PASS.
