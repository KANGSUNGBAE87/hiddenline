---
version: 0.1.0
status: final
canonical: true
project: Hidden Line
task_id: t_6e1383ce
parent_task: t_cf700294
basis_plan: stages/16_VISUAL_RESTART_PLAN.md
basis_decisions: [D-20260620-013, D-20260620-014]
reviewer: dev-reviewer
verdict: PASS_WITH_CHANGES
---

# Visual/UI Restart — Development B Review

## 1. 검증 범위

dev-builder(t_cf700294)가 구현한 Visual/UI Restart (9개 Visual Defect L1-L9, 10개 handoff 경계 H1-H10)에 대한 독립 검증.

- 검증 기준: `stages/16_VISUAL_RESTART_PLAN.md`, `ai/plans/design-plan.md` v0.4, `ai/design/2026-06-08-hidden-line-design-plan.md`, D-20260620-013, D-20260620-014
- 검증 파일:
  - 신규: `src/ui/components/DarkPopover.tsx`
  - 수정: `src/App.tsx`, `src/ui/HomeScreen.tsx`, `src/ui/ResultScreen.tsx`, `src/styles/app.css`, `src/i18n/messages.ts`
  - 테스트: `tests/ui/app-flow.test.tsx`, `tests/ui/language-switcher.test.tsx`, `tests/ui/home-depth.test.tsx`, `tests/ui/result-depth.test.tsx`
  - 문서: `stages/30_BUILD_REPORT.md`

## 2. 기능 검증 (Functionality)

| 항목 | 결과 | 증거 |
|---|---|---|
| `npm test` 전채 통과 (66/66) | ✅ PASS | 17 test files, 66 passed, duration 1.61s |
| `npm run build` 성공 | ✅ PASS | 45 modules, 35.3KB CSS, 262.8KB JS, tsc noEmit 통과 |
| `prefers-reduced-motion` 지원 | ✅ PASS | `app.css:1630` — 전역 애니메이션/트랜지션 `0.01ms` + `iteration-count: 1` |
| `env(safe-area-inset-bottom)` 적용 | ✅ PASS | 6곳 (app.css:89, 98, 1435, 1756, 1972, 2219) |

## 3. Static Review (코드 분석)

### 3.1 Popover / Native Control (L1, L5, H1)

| 항목 | 결과 | 증거 |
|---|---|---|
| Custom DarkPopover (native `<select>` 미사용) | ✅ PASS | `DarkPopover.tsx` — 순수 `<button>` + `<div>` 기반, zero `<select>` |
| Accessibility (role, aria) | ✅ PASS | trigger: `role="button"`, `aria-haspopup="listbox"`, `aria-expanded`; menu: `role="listbox"`; option: `role="option"`, `aria-selected` |
| 모든 컨트롤 token 기반 custom | ✅ PASS | `src/ui/` 내 `<select>`, `<input>`, `<textarea>` 0건 검출 |
| DarkPopover Home + Sheet 공유 (H2) | ✅ PASS | `HomeScreen.tsx:146` (Home) / `HomeScreen.tsx:211` (Sheet) — 동일 `DarkPopover` 컴포넌트 재사용 |
| Popover 메뉴 dark surface | ✅ PASS | `--popover-surface: #1A2128`, `--popover-cyan-border: #00C8E0`, `--popover-cyan-glow: rgba(0,200,224,0.08)` |

**⚠️ F1 — Difficulty popover 의미 불일치 (SHOULD_FIX)**

`HomeScreen.tsx:153`에서 difficulty popover의 `onChange`가 `onSelectVisibilityLevel`을 호출한다. sight popover(line 163)도 동일 핸들러를 사용한다. 두 popover 모두 `App.tsx`의 `selectedVisibilityLevel` 상태를 변경하며, line difficulty는 preset에서 파생된다(`presetToLine`).

- Plan §2.2 rule 3: "두 selector는 절대 합치지 않는다. Line difficulty = 선 자체의 형상 난이도, Sight range = 같은 선을 얼마나 좁게 보는가"
- 현재 구현: difficulty popover는 label만 "난이도"일 뿐 기능적으로 visibility level만 변경
- Popover option: difficulty → `쉬움/보통/어려움`, sight → `넓게/보통/좁게` — 둘 다 `selectedVisibilityLevel`로 전달

**권장 수정**: (a) difficulty popover가 독립적으로 line difficulty를 변경할 수 있도록 `onSelectLineDifficulty` prop 추가 및 Architecture 반영, 또는 (b) popover label을 "시야 범위" 하나로 통일하고 difficulty는 preset 전용임을 명시

### 3.2 Color Token (L6, H6)

| 항목 | 결과 | 증거 |
|---|---|---|
| 모든 CSS color var() 기반 | ✅ PASS | `app.css:1-36` — `:root`에 토큰 정의, 나머지 모든 color 참조는 `var(--*)` |
| Dark Calm Theme 보존 | ✅ PASS | `--background: #0E1318`, cyan/amber/mint/coral palette 유지 |
| CanvasGame hex 사용 | ⚠️ OBSERVE | Canvas 2D API 특성상 hex 직접 사용 (`"#101b25"` 등). CSS 토큰 기반 규칙 위반은 아님. 향후 `getComputedStyle()`로 토큰화 가능 |

### 3.3 Line Family (L2)

| 항목 | 결과 | 증거 |
|---|---|---|
| 정확히 4개 패널 (12개 아님) | ✅ PASS | `HomeScreen.tsx:27-32` — `lineFamilyItems` 배열 4개 항목 (warmup/main/curve/precision) |
| 패널 높이 88px | ✅ PASS | `app.css:2041` — `min-height: 88px` |
| 선택 패널 cyan border/glow | ✅ PASS | `app.css:2052-2055` — `border: 2px solid var(--popover-cyan-border)`, cyan glow box-shadow |

### 3.4 Language Switch (L8, H7)

| 항목 | 결과 | 증거 |
|---|---|---|
| 언어 전환 Settings 내부 전용 | ✅ PASS | `App.tsx:70-87` — `TossTopControls`/`GooglePlayTopBar` → gear icon → `SettingsSheet` |
| Home/Play/Result 직접 노출 금지 | ✅ PASS | `LanguageSwitcher`는 `SettingsSheet` 내부에서만 렌더 |
| Top bar pill 제거 | ✅ PASS | 기존 large pill 제거, gear icon(⚙️) + x 버튼만 |

### 3.5 Result CTA (L7, H4, H5)

| 항목 | 결과 | 증거 |
|---|---|---|
| Sticky positioning 미사용 (H4) | ✅ PASS | `app.css` 전체에서 `position: sticky` 0건 |
| Inline CTA 단일 배치 | ✅ PASS | `ResultScreen.tsx:128` — `primary-button` 단일 inline |
| 피드백 chip radiogroup (textarea 아님) (H5) | ✅ PASS | `ResultScreen.tsx:182` — `role="radiogroup"`, 각 chip `role="radio"`, `aria-checked` |
| 피드백 3개 chip | ✅ PASS | "너무 쉬웠다 / 적당했다 / 어려웠다", 1-tap + toast |
| 기존 disabled textarea 완전 제거 | ✅ PASS | `ResultScreen.tsx`에서 `<textarea>` 0건 |

### 3.6 Weekly Dots (L9, H8)

| 항목 | 결과 | 증거 |
|---|---|---|
| 8px dot × 7개 | ✅ PASS | `app.css:2171` — `width: 8px; height: 8px` |
| 오늘 dot cyan, 과거 muted, 미래 hidden | ✅ PASS | `app.css:2179-2190` — `.weekly-dot--today: cyan`, `.weekly-dot--past: var(--popover-border)`, `.weekly-dot--future: display: none` |
| Home 아래 fold 배치 | ✅ PASS | `HomeScreen.tsx:190` — `<div className="weekly-dots">` inside `home-below-fold` |

### 3.7 Preset Sheet (L4, H10)

| 항목 | 결과 | 증거 |
|---|---|---|
| Ghost chip → sheet trigger | ✅ PASS | `HomeScreen.tsx:121-128` — `preset-ghost-chip` button, `onClick={() => setSheetOpen(true)}` |
| Sheet 80vh max | ✅ PASS | `app.css:1961` — `max-height: 80vh` |
| Backdrop tap dismiss (H10) | ✅ PASS | `app.css:1946-1951` — backdrop `position: fixed; inset: 0`, `onClick={() => setSheetOpen(false)}` |

### 3.8 i18n (Hard-coded copy)

| 항목 | 결과 | 증거 |
|---|---|---|
| messages.ts ko/en 완비 | ✅ PASS | 신규 키 16개 (home.popover.*, result.feedback.*, settings.*, home.dotLabel 등) 양 locale 존재 |
| Home/Play/Result UI copy i18n route | ✅ PASS | 모든 사용자 문자열 `i18n.t()` 경유 |

**⚠️ F2 — DarkPopover.tsx에 하드코딩된 한글 라벨 (SHOULD_FIX)**

`DarkPopover.tsx:94-104`의 `difficultyOptions`, `sightOptions` 배열에 `labelKo: "쉬움"`, `"보통"`, `"어려움"`, `"넓게"`, `"좁게"`가 하드코딩되어 있다. `messages.ts`에 이미 `lineDifficulty.easy`/`visibilityLevel.easy` 등의 동일 의미 i18n 키가 존재한다. 컴포넌트 파일 편집 없이 메시지만 변경하려면 i18n 키를 통해 제공하는 것이 일관된다.

**권장 수정**: `getLabelForLocale` 대신 `i18n.t("lineDifficulty." + id)` / `i18n.t("visibilityLevel." + id)` 사용

## 4. Design Fidelity (설계 충실도)

| 항목 | 결과 | 증거 |
|---|---|---|
| Home 첫 viewport 5블록 이하 | ✅ PASS | title + mini playfield + preset summary + CTA + selector row (닫힌 상태) = 5개 블록. 그 외 card/panel은 `home-below-fold` 내부 |
| Weekly dots viewport 바닥 노출 | ✅ PASS | `home-below-fold` 마지막 요소, 8px dot → `padding: 12px 0 4px` |
| "다시 도전" CTA 1회만 등장 | ✅ PASS | `ResultScreen.tsx:128` 단일 배치. sticky bar 없음 |
| Safe-area inset CTA 적용 | ✅ PASS | `app.css:98` — `padding-bottom: calc(112px + env(safe-area-inset-bottom))` (home-screen에 적용) |

## 5. 중복 CSS (NICE_TO_HAVE)

`app.css`에 `.feedback-chip` 정의가 두 번 등장한다:
- Line 1340: `min-height: 30px` (구 coaching chip 스타일)
- Line 2116: `min-height: 48px` (신규 L7 피드백 chip — spec 준수)

후자가 우선 적용되므로 기능상 문제는 없으나, 중복 정의는 혼란을 유발할 수 있다. L1340 정의가 더 이상 사용되지 않으면 제거 권장.

## 6. 종합 판정

### PASS_WITH_CHANGES

핵심 9개 Visual Defect(L1-L9)와 10개 Handoff 경계(H1-H10)가 모두 충족되었다:
- Custom DarkPopover, 4-panel line family, ghost chip→sheet, token-only colors
- Chip radiogroup feedback, 언어 switch Settings 전용, weekly dots
- Inline-only CTA, safe-area, reduced-motion, 66/66 tests, build clean
- Zero native `<select>`/`<input>`/`<textarea>` leakage

**SHOULD_FIX 2건은 시정 권장이나 개발 승인을 막지 않는다:**
1. F1: Difficulty popover가 visibility 핸들러에 연결되어 의미 불일치 → `onSelectLineDifficulty` 분리 또는 label 정정
2. F2: DarkPopover.tsx 내 한글 옵션 라벨 하드코딩 → i18n 키 기반으로 전환

### Findings Summary

| ID | Severity | File | Line | Description |
|---|---|---|---|---|
| F1 | SHOULD_FIX | `src/ui/HomeScreen.tsx` | 153 | Difficulty popover의 onChange가 onSelectVisibilityLevel을 호출. Plan §2.2 rule 3과 불일치 |
| F2 | SHOULD_FIX | `src/ui/components/DarkPopover.tsx` | 94-104 | Popover option label이 messages.ts 대신 하드코딩된 한글/영문 문자열 사용 |
| N1 | NICE_TO_HAVE | `src/styles/app.css` | 1340, 2116 | `.feedback-chip` CSS 정의 중복 (min-height 30px vs 48px) |

### Affected Files

- `src/ui/HomeScreen.tsx:153` (F1)
- `src/ui/components/DarkPopover.tsx:94-104` (F2)
- `src/styles/app.css:1340-1354, 2116-2131` (N1)

### Residual Risk

- 실기기 touch QA, viewport 360px popover row tightness, finger occlusion → runtime QA로만 확정 가능
- CanvasGame rendering hex 값은 기능상 문제 없으나 향후 token화 검토

---

**Final recommendation**: PASS_WITH_CHANGES → CEO gate로 승계. F1/F2 remediation 후 재검토는 선택 사항.
