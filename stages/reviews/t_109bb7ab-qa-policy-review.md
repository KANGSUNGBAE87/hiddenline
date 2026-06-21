# Hidden Line QA/Release B1 — Policy and Platform Review

Verdict: PASS (CONDITIONAL)
Date: 2026-06-20 KST
Reviewer: qa-policy (t_109bb7ab)
Workspace: `/Users/kangsungbae/Documents/hiddenline`
Reviewed artifact: `stages/40_RELEASE_REPORT.md` (QA/Release A1 functional report)
Input decision: `01_DECISIONS.md` D-20260620-003
Parent: t_635c5fad (QA functional: PROCEED_TO_POLICY_QA)

## Scope checked

| Source | Role |
| --- | --- |
| `01_DECISIONS.md` D-20260620-003 | Approved scope baseline: QA/Release split into functional + policy |
| `stages/40_RELEASE_REPORT.md` | QA functional PASS report — 65/65 tests, build clean |
| `stages/20_ARCH_FINAL.md` | Architecture contract: platform boundary, PII policy, deterministic seed |
| `stages/30_BUILD_REPORT.md` v1.3.0 | Fresh canonical build report |
| `stages/08_PRODUCT_PLAN.md` | Product scope: 5 presets, monetization closed, excluded scope |
| `stages/10_UX_FINAL.md` | UX scope: screen flows, same-seed retry priority |
| `docs/workflows/app-platform-standard.md` | Default platform rule |
| `docs/workflows/apps-in-toss-release-gate.md` | Pre-release checklist |
| `docs/tools/apps-in-toss-platform.md` | Apps in Toss development standard |
| `projects/hiddenline/platform.md` | Project platform note |
| `src/platform/noopAdapters.ts` | Adapter stub implementations |
| `src/platform/types.ts` | Adapter type contracts |
| `src/platform/browserPlatform.ts` | Browser platform assembly |
| `src/platform/tossBrand.ts` | Toss brand config |
| `src/App.tsx` | App shell with TossTopControls |
| `src/i18n/messages.ts` | Locale messages including shell strings |
| `package.json` | Dependency audit |

## Read-only fingerprint

- HEAD: committed source tree, not modified during review
- `npm test`: 17 files / 65 tests pass (verified in parent QA A1)
- `npm run build`: clean pass (verified in parent QA A1)
- Build output: `dist/index.html` (0.46KB), `dist/assets/index-CxKSPU0p.css` (27.83KB), `dist/assets/index-DpafP5XK.js` (263.11KB)
- No product source changes in this review

## 1. Excluded Scope Verification

| Excluded Item | Status | Evidence |
| --- | --- | --- |
| Ads / IAP / rewards | PRESERVED | `package.json`: zero ad/IAP deps (React only); `noopAdapters.ts`: all ad/payment adapters return stub/dis|
| Login | PRESERVED | No auth SDK deps; `noopAuth.getCurrentUser()` returns `{ status: "anonymous" }` |
| Backend sync | PRESERVED | `noopBackend.post()` returns `null`; zero network deps in package.json |
| Real Toss/Google SDKs | PRESERVED | Zero `@toss/`, `play-services-*`, `admob`, `google-play-billing` imports anywhere |
| Public 12-level ladder | PRESERVED | No 12-level ordered list in types/config/UI; `PresetId` = 5 values only |
| Public 0-100 difficulty promise | PRESERVED | No numeric difficulty in UI; internal calibration only per Architecture 3.1 |

All six excluded items remain fully excluded in the current build. No scope creep detected.

## 2. Google Play Game Release Readiness

Hidden Line is classified as a game-like app per platform note (`projects/hiddenline/platform.md`). First release target is Google Play while preserving Apps in Toss compatibility.

### 2.1 Structural Policy Compliance — PASS

| Policy Area | Status | Evidence |
| --- | --- | --- |
| Monetization (ads/IAP/rewards) | N/A — excluded | No ad/IAP deps; monetization branch closed per Product Plan 7.2 |
| Login/account | N/A — excluded | No-login local-first; auth adapter is stub |
| Network/backend | N/A — excluded | No backend transport; no network deps |
| Gambling/real-money | CLEAN | Precision tracing game, no betting/gambling mechanics |
| Deceptive claims | CLEAN | 5 named presets only; no public 0-100 or 12-level promise |
| Dark-pattern monetization | N/A — excluded | No monetization surface exists |
| Game content rating | LOW RISK | Family-friendly precision tracing; no violence/sexual/gambling content |

### 2.2 Platform Boundary — PASS

- Domain logic (`src/game/`) has zero platform SDK imports
- Platform adapters (`src/platform/`) maintain clean separation:
  - `AuthAdapter` → stub (anonymous only)
  - `PaymentAdapter` → stub (no entitlements)
  - `AdsAdapter` → stub (ads_disabled_in_mvp)
  - `AnalyticsAdapter` → noop (track() is void)
  - `StorageAdapter` → browser localStorage with memory fallback
  - `ShareAdapter` → native Web Share API with clipboard fallback
- Architecture 1.1 and 7.1 contracts satisfied
- Future Google Play/Apps in Toss SDK integration can happen behind existing adapters

### 2.3 i18n — PASS

- Korean (`ko`) default, English (`en`) selectable per Architecture 7.4
- Language switcher functional; locale persisted to localStorage (`hiddenline.locale.v1`)
- All user-facing strings routed through `createI18n(locale)`
- KO↔EN messages exist for all UI screens including shell chrome

## 3. Privacy and Data Safety

### 3.1 Current Data Flow — PASS

- All data stored in browser `localStorage` only
- No network transmission (noopBackend, noopAnalytics track() is void)
- Free-text feedback (`difficulty_feedback_submitted`) stays local per Architecture 5.4
- PII boundary enforced: raw text excluded from analytics transmission
- No login = no user identification data collected

### 3.2 Conditional: Data Safety Preparation Required

Per `apps-in-toss-release-gate.md` Section 3 and the precedent set in non-game-market-insights QA Policy B (PM-1, 2026-06-20), even localStorage-only apps require the following before Google Play Console submission:

- Privacy policy URL hosted and accessible
- Google Play Data Safety section completed (data types, collection purpose, encryption, deletion)
- Local storage / no-transmission disclosure in Data Safety answers
- `localStorage` usage declared under "App activity" or "App info and performance"

**Current status**: No privacy policy URL, Data Safety questionnaire, or storage disclosure evidence exists in project artifacts. This is not a blocker at current stage (pre-release preparation), but must be completed before actual Google Play upload.

## 4. Apps in Toss Compatibility — PRESERVED

### 4.1 Adapter Structure — PASS

- All required adapter interfaces defined in `src/platform/types.ts`: Storage, Haptics, Analytics, Share, BackendTransport, Auth, Payment, Ads
- Platform assembly in `src/platform/browserPlatform.ts` composes noop adapters
- Future Apps in Toss adapter variants (`src/platform/toss/`) can be added without changing domain logic

### 4.2 Toss UI Shell Readiness — PRESERVED

- `tossBrand.ts`: brand display name ("숨은선"), primary color, icon path
- `TossTopControls` component in `App.tsx`: 더보기/미니앱 종료 buttons, Toss-style menu
- i18n messages include Toss shell strings in both KO and EN
- This UI shell is documented as "local brand draft" for Apps in Toss compatibility preview (`platform.md`)

See Section 5 (Conditional Issues) for the Google Play concern related to this.

## 5. Conditional Issues — Max 3 Themes

### COND-1: Toss-brand UI shell unconditionally rendered for Google Play build

**Source**: `src/App.tsx:27,33` — `TossTopControls` is always rendered via `withChrome()` on all screens, regardless of target platform.

**Risk**: Google Play users see Toss-specific UI patterns:
- "더보기" / "More" button with Toss-style menu — not standard Android
- "미니앱 종료" / "Close miniapp" button — meaningless on Google Play
- Toss-brand icon (`hidden-line-toss-icon.svg`) in app chrome
- `exitMiniApp()` calls `window.close()` which is blocked on Android browsers

**Severity**: Medium. Not a policy violation, but a UX/confusion risk for Google Play users who will not understand "미니앱 종료" or the Toss control pattern. Google Play reviewers may question non-standard system chrome.

**Proposed remediation**:
- Make `TossTopControls` conditional on platform context (e.g., `import.meta.env.VITE_TARGET` or platform capability detection)
- Create a Google Play shell variant with standard Android system back behavior (rely on Android system back button, no custom close/miniapp UI)
- Language switcher can move to Home screen or Android settings
- Alternatively, accept the UI as-is with English localization, since it's functionally harmless and can be iterated later

**Re-verification**: After remediation, verify that Google Play build does not expose Toss-miniapp-specific UI patterns. Apps in Toss build should still have the Toss shell.

### COND-2: Google Play Data Safety and privacy policy not yet prepared

**Source**: `apps-in-toss-release-gate.md:51` and precedent from `non-game-market-insights` QA Policy B PM-1 (data safety disclosure required even for localStorage-only apps).

**Risk**: Google Play Console submission will be blocked without completed Data Safety questionnaire and valid privacy policy URL. Current artifacts have no privacy policy document or Data Safety answers.

**Severity**: Medium-before-submit. Not a blocker for current development phase, but is a hard gate for actual Google Play upload.

**Proposed remediation**:
- Create privacy policy document (can be hosted on GitHub Pages or project site)
- Declare: no personal data collection, no network transmission, localStorage for app preferences and game records only
- Prepare Google Play Data Safety CSV/answers: "No data collected" or "App functionality: Local storage (not transmitted)"
- Document this in `stages/` or `ai/reviews/review.md`

**Re-verification**: Confirm privacy policy URL is accessible and Data Safety section passes Google Play Console validation.

### COND-3: Store listing claims must stay within implemented feature scope

**Source**: `projects/hiddenline/platform.md:112-113`: "Store listing copy and screenshots must match the real app: daily challenge, precision tracing, and local/daily records should not be overstated as online ranked competition until server ranking exists."

**Risk**: Medium. If store listing implies online ranking, leaderboard, or competition features, this would be a deceptive claim. Current feature set: local-only daily challenge, 5 named difficulty presets, same-seed retry, local records. No online ranking, no multiplayer, no cloud save.

**Proposed remediation**:
- Prepare store listing draft that accurately describes: "Precision tracing challenge with daily puzzles, five difficulty levels, and local best records"
- Do not claim: "Compete with players worldwide", "Online leaderboards", "Ranked matches"
- Store screenshots should show actual app screens (Home, Play, Result)

**Re-verification**: Compare store listing draft against actual feature set before submission.

## 6. Verdict

**VERDICT: PASS (CONDITIONAL)**

채널 배치 구조(policy architecture)는 clean하다: 광고/IAP/리워드/로그인/백엔드 전송 없음, 플랫폼 SDK 미의존, 로컬 우선 데이터, PII 경계 유지. Google Play 게임 출시를 위한 정책적 장애물은 없다. Apps in Toss 호환성도 adapter 구조로 보존되어 있다.

위 3개 조건(COND-1~3)은 현재 개발 단계에서 blocker가 아니며, 실제 Google Play Console 업로드 전에 해소해야 하는 pre-release preparation 항목이다. 정책상 출시 진행을 중단할 이유는 없다.

- COND-1 (Toss UI shell): 코드 수정 필요 → CHANGES_REQUIRED 범위, dev-builder task 제안
- COND-2 (Data Safety): 문서 준비 필요 → release preparation task 제안
- COND-3 (광고문구 정확성): 스토어 등록 시 검증 필요 → release gate에서 재확인

**Next gate**: t_15d0c4db (CEO/release gate) — 조건부 통과로 이관 가능.

## 7. Knowledge Candidates

### KC-01: Multi-platform game UI shell separation for Google Play-first releases

- maturity: candidate
- summary: When a game-like app uses Google Play as the first release target, the Apps in Toss compatibility UI shell (더보기/미니앱 종료 buttons, Toss-brand icon, Toss-style menu) should be behind a platform conditional. Unconditionally rendering miniapp-specific chrome on Google Play confuses Android users and risks review questions. The remediation pattern: `import.meta.env.VITE_TARGET` or capability detection to select shell variant.
- evidence_path: `/Users/kangsungbae/Documents/hiddenline/src/App.tsx` (TossTopControls unconditional); `/Users/kangsungbae/Documents/hiddenline/stages/reviews/t_109bb7ab-qa-policy-review.md`
- suggested_owner_file: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/app-platform-standard.md` (Section: Google Play-first game release shell separation)

### KC-02: Data Safety prerequisites for local-first no-login Google Play games

- maturity: candidate
- summary: Even a 100% local-storage, no-network, no-login game app must prepare Google Play Data Safety answers and a privacy policy URL before Console submission. "No data collected" or "No transmission" is a valid answer, but must be explicitly declared. The non-game-market-insights QA Policy B PM-1 (2026-06-20) established this as a recurring requirement pattern.
- evidence_path: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/apps-in-toss-release-gate.md:51`; `/Users/kangsungbae/Documents/hermes-agent/hermes-studio/projects/non-game-market-insights/stages/42_QA_POLICY.md` PM-1
- suggested_owner_file: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/google-play-data-safety-local-first.md`

## 8. Unverified Areas

- 실제 Google Play Console 업로드 및 Data Safety 섹션 통과 → release gate 필요
- Privacy policy URL 작성 및 호스팅 → COND-2 해소 시 검증
- Store listing 초안의 기능 과장 여부 → COND-3 해소 시 검증
- 실제 Android 기기에서 `window.close()` 동작 및 시스템 백 버튼 동작 → device QA gate 필요
- Apps in Toss 샌드박스/토스앱 테스트 환경의 Toss shell 동작 → platform QA gate 필요

## Change Log

- 2026-06-20: Initial B1 policy/release review. Verdict PASS (CONDITIONAL) with 3 conditional themes identified. Excluded scope verified preserved. Google Play game release structural readiness confirmed. Apps in Toss compatibility preserved.
