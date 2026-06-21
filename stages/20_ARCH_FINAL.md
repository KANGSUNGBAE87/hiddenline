---
version: 0.4.0
status: final-candidate
updated: 2026-06-20
canonical: true
phase: Architecture A2 revision
project: Hidden Line / 히든라인
basis_date: 2026-06-20
source_artifacts:
  - /Users/kangsungbae/Documents/hiddenline/00_PROJECT_BRIEF.md
  - /Users/kangsungbae/Documents/hiddenline/01_DECISIONS.md
  - /Users/kangsungbae/Documents/hiddenline/stages/08_PRODUCT_PLAN.md
  - /Users/kangsungbae/Documents/hiddenline/stages/10_UX_FINAL.md
  - /Users/kangsungbae/Documents/hiddenline/stages/15_UI_DESIGN.md
  - /Users/kangsungbae/Documents/hiddenline/stages/20_ARCH_FINAL.md
  - /Users/kangsungbae/Documents/지식저장소/AI_CONTEXT.md
  - /Users/kangsungbae/Documents/지식저장소/agent/index.md
  - /Users/kangsungbae/Documents/지식저장소/agent/profile.md
  - /Users/kangsungbae/Documents/지식저장소/agent/operating-rules.md
  - /Users/kangsungbae/Documents/지식저장소/docs/workflows/design-preflight.md
  - /Users/kangsungbae/Documents/지식저장소/docs/workflows/app-platform-standard.md
  - /Users/kangsungbae/Documents/지식저장소/docs/tools/apps-in-toss-platform.md
  - /Users/kangsungbae/Documents/지식저장소/docs/workflows/apps-in-toss-development-gate.md
  - /Users/kangsungbae/Documents/지식저장소/projects/hiddenline/platform.md
scope_status: final-candidate-for-ceo-approval
---

# Hidden Line Architecture A2 — Visual/UI implementation architecture revision

이 문서는 `stages/08_PRODUCT_PLAN.md`, `stages/10_UX_FINAL.md`, 승인된 `stages/15_UI_DESIGN.md`, 그리고 결정 `D-20260620-006`만을 사용해 UI remediation pass를 구현 가능한 구조로 번역한 Architecture 문서다. 제품 범위와 UX 흐름을 넓히지 않으며, Development 시작이나 승인 자체를 의미하지 않는다.

## 0. Revision summary

이번 revision의 목적은 UI remediation pass를 dev-builder가 추측 없이 구현할 수 있도록 화면 책임, 상태 전이, adapter seam, QA hook, 그리고 B risk response를 명시하는 것이다.

### What stays fixed
- 5 named presets only: Intro, Easy, Standard, Hard, Expert
- same-seed retry first on Result
- Google Play first for the game release, while preserving Apps in Toss compatibility
- no public 0-100 promise, no public 12-level promise
- no ads / IAP / login / backend SDK implementation in this stage
- Development remains Owner-gated

### What this revision clarifies
- Home selected-preset summary + sheet entry + below-fold hint split
- preset sheet/card structure and CSS class boundaries
- 44px slim sticky retry bar plus end inline CTA contract
- button/token/style system to remove native-looking controls
- viewport / safe-area / i18n / reduced-motion QA hooks
- explicit exclusion of flow widening and release/upload approval

## 0.1 B challenge response

| B finding | decision | response |
|---|---|---|
| Result sticky bar safe-area height is undefined on notched devices | ACCEPT | Define the sticky retry bar as 44px visual height plus safe-area inset padding in the scroll shell. The bar may never consume the safe-area itself, so thumb-zone tapability remains intact on iPhone-style notches. |
| End inline CTA state transition between sticky bar and inline CTA is undefined | ACCEPT | Treat sticky bar and inline CTA as two presentations of the same same-seed retry contract. Sticky is the persistent scroll presentation; inline is the end-of-recap presentation; both dispatch the same retry action and share the same disabled/locked rules. |
| Adapter over-specification includes out-of-scope stubs | ACCEPT | Keep only the shared platform seams already required by the app standard: storage, analytics, locale, haptics, auth/login, ads, IAP, share, backend transport. Remove any extra adapter expansion from the architecture contract. |
| Button taxonomy missing Icon button category from UI Design | ACCEPT | Add `icon` to the button taxonomy for back/close/more/language/settings and treat it as a first-class tokenized control, not a native browser icon button. The taxonomy remains small and explicit. |

No B finding is rejected. The response keeps the launchability and safety improvements while preserving the approved UX scope.

## 1. Source of truth and implementation boundary

### 1.1 Input hierarchy
Use these as authoritative inputs only:
1. `stages/08_PRODUCT_PLAN.md`
2. `stages/10_UX_FINAL.md`
3. approved `stages/15_UI_DESIGN.md`
4. `01_DECISIONS.md` decision `D-20260620-006`

No new product interpretation is introduced here.

### 1.2 Required implementation boundary
The codebase must remain split into:
- domain logic: game rules, preset contracts, retry semantics, result state
- UI shell: Home / Gameplay / Result rendering and local interaction state
- platform adapters: storage, analytics, locale, haptics, future login/ads/IAP/share/backend transport

The UI remediation pass only changes how the approved UX is rendered and wired. It does not add platform-specific logic to domain modules.

### 1.3 Explicit exclusions
This architecture does not add:
- product-flow widening
- ads, IAP, login, backend SDK work
- release/upload approval flow
- public difficulty ladder or player-facing numeric promise
- new gameplay modes
- new monetization surfaces

## 2. Screen responsibilities and state model

### 2.1 Screen map
- Home: selected preset summary, brief preview, sheet entry, below-fold hint, primary start CTA
- Preset sheet: full 5-preset choice surface, then select-and-return
- Gameplay: minimal chrome, playfield first, no new control expansion
- Result: same-seed retry first, recap, then additional actions

### 2.2 UI state slices
Suggested state slices:
- `app.locale`
- `home.selectedPresetId`
- `home.sheetOpen`
- `gameplay.sessionState`
- `result.outcome`
- `result.retryMode = same-seed | adjacent-preset | back-home`
- `layout.viewportClass`
- `layout.safeArea`
- `layout.reducedMotion`

The layout slices are derived, not user-authored business state.

### 2.3 State transitions
- Home → Preset sheet open: user taps selected preset summary or ghost chip
- Preset sheet → Home: user confirms preset or dismisses sheet
- Home → Gameplay: user taps primary start CTA
- Gameplay → Result: run completes or fails
- Result first reveal: same-seed retry is shown first
- Result more actions: adjacent preset, back home, other secondary actions

Back/close behavior must follow the active UI layer only. If a sheet is open, back closes the sheet. If Result first reveal is active, back returns to Home only after any required in-screen dismissal behavior is honored by the current platform shell.

## 3. Home architecture

### 3.1 Required Home composition
Home is not a preset grid page. It is a launch summary page with one clear action.

Home must contain, in order:
1. title / short welcome
2. selected-preset summary block
3. primary start CTA
4. below-fold hint / preview continuation cue
5. only then lower-priority informational content

### 3.2 Selected-preset summary contract
The summary is a compact two-line block, not a multi-card chooser.

Required fields:
- preset name
- one short descriptive line in active locale
- ghost chip entry point: “난이도 고르기 ›” / localized equivalent

Implementation rule:
- the summary block itself is clickable
- clicking the block opens the preset sheet
- the ghost chip is a secondary affordance that opens the same sheet
- no horizontal preset segment exists on Home

### 3.3 Below-fold hint contract
The approved design requires a below-fold cue so the first viewport does not feel empty.

Implementation options allowed by this architecture:
- a subtle gradient fade at the bottom of the hero preview
- a tiny weekly-dot / peek indicator that implies more content below
- a partial mini-playfield crop that hints at continuation

Constraint:
- the hint must not compete with the primary CTA
- at 360×740 the cue should preserve a visible lower-edge peek rather than fill the first screen with extra controls

### 3.4 Home composition seam
Use a dedicated home composition boundary, for example:
- `HomeHeader`
- `SelectedPresetSummary`
- `HomePrimaryCta`
- `HomePreviewHint`
- `HomeSecondaryInfo`

The selected preset summary and the preview hint must not be coupled to the preset sheet implementation.

## 4. Preset sheet / card architecture

### 4.1 Sheet behavior
The preset chooser lives in a sheet or bottom sheet, not as a permanent home grid.

Sheet responsibilities:
- expose all 5 named presets
- show enough description to choose confidently
- keep selection atomic and fast
- close cleanly after selection

### 4.2 Card structure
Each preset card must have three layers:
1. preset label: `Intro / Easy / Standard / Hard / Expert`
2. short description copy in locale
3. selected state affordance

Card content should remain compact enough for 360px width without wrapping into awkward blocks.

### 4.3 CSS class boundaries
The implementation must define explicit, non-native class boundaries. Minimum recommended classes:
- `preset-sheet`
- `preset-sheet__header`
- `preset-sheet__grid`
- `preset-card`
- `preset-card--selected`
- `preset-card__label`
- `preset-card__desc`
- `preset-card__badge`
- `preset-sheet__footer`
- `preset-sheet__cta`

For Home:
- `home-selected-preset`
- `home-selected-preset__summary`
- `home-selected-preset__entry`
- `home-preview-hint`

Do not let the browser default button style leak through. All interactive nodes must use the shared button/token layer described below.

### 4.4 Sheet interaction rule
- tapping a card updates selection immediately
- tapping confirm commits and closes the sheet
- tapping outside or pressing back closes the sheet without changing the committed preset unless the user already confirmed

This separation prevents accidental preset drift.

## 5. Result architecture

### 5.1 First reveal contract
Result first reveal is the highest-priority post-run state.

For both success and failure:
- show the outcome summary first
- show same-seed retry first
- show the slim sticky bar immediately if the screen can scroll
- keep the end-of-content inline CTA available after recap

### 5.2 44px slim sticky retry bar
The sticky bar is a narrow, thumb-zone-safe control used to preserve visibility during scrolling.

Required properties:
- 44px visual height
- fixed or sticky positioning inside the result shell
- one clear action: same-seed retry
- no overpowered visual treatment that hides the recap
- should not overlap or obscure the main result content on entry

Recommended internal layout:
- left: short label
- right: same-seed retry CTA
- optional small seed-preservation note only if it fits without clutter

### 5.3 End inline CTA
The recap area must also contain a full inline CTA at the end of the scrollable content.

Rule:
- the sticky bar preserves action visibility while the user scrolls
- the end inline CTA completes the same-seed retry contract when the user reaches the bottom
- both point to the same same-seed retry path, not separate actions

### 5.4 Additional result actions
Secondary actions such as adjacent preset or home return must remain below the primary retry action.

Do not widen result scope into reward, ad, share, or ranking prompts in this stage.

## 6. Button / token / style architecture

### 6.1 Button taxonomy
Use a small, explicit button system:
- `primary`
- `secondary`
- `ghost`
- `danger`
- `chip`

Native-looking buttons are not acceptable for the approved UI remediation pass.

### 6.2 Shared token layer
Centralize colors, spacing, radius, and elevation in tokens, not ad hoc per component.

Minimum token groups:
- `color.*`
- `surface.*`
- `border.*`
- `text.*`
- `radius.*`
- `space.*`
- `shadow.*`
- `motion.*`
- `focus.*`

### 6.3 Control styling rules
All interactive controls must define:
- custom background
- custom border
- custom radius
- custom text color
- hover/pressed/disabled states
- keyboard focus ring

Controls must not render as browser gray buttons or default select widgets.

### 6.4 Style ownership boundary
- domain modules may emit semantic intents such as `primaryAction`, `secondaryAction`, `dangerAction`
- UI layer maps those intents to the button taxonomy
- no domain module imports CSS class names

This keeps the UI shell replaceable while preserving product logic.

## 7. i18n, viewport, safe-area, reduced-motion QA hooks

### 7.1 Locale structure
- default locale: `ko`
- selectable locale: `en`
- all user-facing strings in locale bundles
- no hard-coded result copy, sheet copy, or helper copy inside feature logic

Suggested locale split:
- `home.*`
- `preset.*`
- `result.*`
- `common.*`
- `errors.*`
- `accessibility.*`

### 7.2 Viewport verification hooks
The architecture must be verified at these viewport classes:
- 360×740
- 390×844
- 430×932

For each viewport verify:
- selected-preset summary remains readable
- preset sheet cards do not rely on hidden overflow for critical text
- the 44px retry bar stays usable in the thumb zone
- the end inline CTA remains reachable without content collision
- no native-looking buttons appear

### 7.3 Safe-area and finger occlusion hooks
Required checks:
- bottom CTA / sticky bar respects safe-area insets
- no critical interactive element sits beneath the nav bar or thumb occlusion zone
- result sticky bar does not cover the recap's first line on entry
- Home below-fold hint does not become a tap trap

### 7.4 Reduced-motion hooks
If `prefers-reduced-motion` is active:
- remove glow pulsing and any continuous motion accents
- keep state changes but flatten transition intensity
- preserve clarity of selected preset and retry action

No motion effect may be required for core task completion.

## 8. Platform and adapter seam

### 8.1 Platform-neutral core
The UI remediation architecture must remain platform-neutral between:
- Google Play shell
- Apps in Toss shell

The shell decides chrome, back/close, and future SDK presence. The domain and feature logic should not know which store path is active.

### 8.2 Adapter boundaries
Keep these behind adapters even if stubbed:
- storage
- analytics
- locale resolution
- haptics
- auth/login
- ads
- IAP
- share
- backend transport

### 8.3 Ownership of UI state persistence
Persistent UI preferences such as selected locale and selected preset belong to the storage adapter boundary, not the domain core.

## 9. Event, session, and local persistence contract

### 9.1 Event contract requirement
Approved event contracts must name:
- event name
- payload fields
- active locale
- first-entry path
- emit site
- storage/adapter seam

### 9.2 Required UI-facing events for this stage
The architecture must preserve the existing local-first event contract for:
- `home_viewed`
- `preset_list_viewed`
- `preset_selected`
- `result_viewed`
- `retry_same_seed_started`

Payload minimums should include at least:
- `preset_id`
- `locale`
- `viewport_class`
- `surface`
- `session_id` or equivalent local session handle

### 9.3 Local input and deletion flow
User input and identifiers should remain local-first unless a later approved backend decision says otherwise.

Flow rules:
- input from preset choice, retry, and result actions is stored in feature state first
- analytics sinks receive only approved event payloads
- no AI payload path is introduced here
- deletion/reset must be possible through the local storage boundary

## 10. Verification plan for dev-builder

### 10.1 Architecture acceptance checks
Dev-builder should be able to implement without guessing component boundaries. Verify that the implementation can answer:
- which component owns Home selected-preset summary?
- which component owns sheet entry and sheet content?
- which component owns the 44px sticky retry bar?
- which component owns the end inline CTA?
- which token layer defines button behavior?

### 10.2 QA checklist
Before any downstream development handoff, verify:
- 360×740 / 390×844 / 430×932 layout sanity
- safe-area respected on Home and Result
- no native-looking controls
- same-seed retry is first action on Result
- preset sheet exposes exactly 5 presets
- `ko` default and `en` selectable
- reduced-motion does not break readability

### 10.3 Out-of-scope verification
Do not add release/upload approval verification here.
Do not require live store or SDK verification in this architecture stage.

## 11. Risks and mitigations

### 11.1 Narrow-screen crowding
Risk: 360px width may compress the summary, hint, and CTA.
Mitigation: keep Home to a compact summary + sheet entry, and move full selection into the sheet.

### 11.2 Sticky bar collision
Risk: the 44px bar may overlap recap content or feel cramped.
Mitigation: reserve bottom padding in the result scroll region and keep the bar text short.

### 11.3 Native control leakage
Risk: browser defaults or unstyled buttons will make the app look unfinished.
Mitigation: require tokenized button classes and reject any control without shared button styling.

### 11.4 Locale length growth
Risk: English copy may expand beyond the compact layout.
Mitigation: enforce locale-aware QA on 360/390/430 widths and keep summary text to one short line plus one support line.

## 12. Knowledge candidates

- maturity: candidate
  summary: For mobile game UI remediation, separate the Home selected-preset summary from the full preset sheet so narrow screens can keep a single clear launch action without losing discoverability.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/20_ARCH_FINAL.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/projects/hiddenline/platform.md

- maturity: candidate
  summary: A slim 44px sticky retry bar paired with a matching end inline CTA preserves same-seed retry visibility during scroll while keeping the recap readable on small mobile viewports.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/20_ARCH_FINAL.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/docs/workflows/design-preflight.md

- maturity: candidate
  summary: UI remediation for mobile app stores should use a small shared button taxonomy and token layer to prevent browser-default controls from leaking into the finished product.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/20_ARCH_FINAL.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/docs/workflows/app-platform-standard.md

## 13. Handoff
- Output path: `/Users/kangsungbae/Documents/hiddenline/stages/20_ARCH_FINAL.md`
- Status: revised final candidate after UI architecture translation and B challenge response
- Preserved contracts: 5 named presets, same-seed retry first, Google Play first while preserving Apps in Toss compatibility, no public numeric difficulty promise
- Key decisions: selected-preset summary is Home-only; full 5-preset choice lives in sheet; result action uses 44px sticky bar plus end inline CTA; shared tokenized button system removes native-looking controls; icon buttons are first-class controls in the taxonomy
- Open risks: 360px crowding, sticky-bar collision, locale length expansion, and safe-area/finger occlusion still need implementation proof
- Next expected profile: `studio-ceo`
- Development remains Owner-gated; do not create or start dev-builder work
