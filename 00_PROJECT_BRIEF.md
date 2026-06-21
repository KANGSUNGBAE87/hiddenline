# 00_PROJECT_BRIEF

status: draft
owner: 강느님
project_slug: hiddenline
project_name: Hidden Line / 히든라인
workspace_path: /Users/kangsungbae/Documents/hiddenline
platforms: [google-play, apps-in-toss]
default_language: ko
optional_languages: [en]

## Owner raw input — 2026-06-19

- 기존 `hiddenline` 폴더에 있는 프로젝트를 분석하고 진행한다.
- 현재 선 생성 난이도가 12개로 되어 있다고 Owner는 이해하고 있다.
- 선의 꺾임이 급작스럽게 꺾이는 경우가 있다.
- 최종기획문에 이미 있었을 수 있지만, 선은 겹쳐도 되며 최대한 곡선으로 만들어야 한다.
- 많이 겹쳐지고, 길어지고, 구불구불할수록 어려운 것으로 간주한다.
- 난이도 점수가 0~100이면 가장 낮은 단계도 최소 20에서 시작해야 한다.
- 상품성, 게임성, 광고수익 최대화까지 고려한다.
- 최우선은 난이도에 맞게 선을 잘 그리는 것이다.

## Existing project context to verify, not assume

- Existing local folder: `/Users/kangsungbae/Documents/hiddenline`.
- Existing project docs and code are inputs for analysis, not automatically accepted CEO stage decisions.
- Existing plans mention Hidden Line as a mobile precision tracing game with hidden/spotlight path tracing.

## Current operating constraints

- This is an existing game/game-like app; Google Play first is likely, while preserving Apps in Toss compatibility. Workers must verify before making release assumptions.
- Do not start `dev-builder` until Market/Product/UX/Architecture approvals exist and Owner explicitly approves implementation.
- Market/Product/UX/Architecture/Visual workers may inspect current app/docs/code and produce recommendations; only `dev-builder` may later modify product code after the relevant gate is approved.
- Development starts only after explicit Owner approval.

## Owner raw input — 2026-06-20 visual screenshot feedback

- Current Hidden Line screen looks visually wrong: “boxes only everywhere,” especially difficulty selection and textbox-like elements are not organized.
- Owner believes the hidden-line/path logic itself is likely good, but the UI around difficulty choice, sight/line selection, and feedback controls drifted from the intended design.
- Re-check all game planning, design planning, and future planning documents.
- Return to the design direction from the first time Owner assigned this project/design work, then redo the visual work and run design review.
- Attached evidence paths:
  - `/Users/kangsungbae/.hermes/profiles/studio-ceo/image_cache/img_3e1a6ff1e0b3.png`
  - `/Users/kangsungbae/.hermes/profiles/studio-ceo/image_cache/img_dfd318fd804e.png`

## Acceptance criteria

- Market research done when: current-state evidence, market/gameplay/ad-policy references, A→B→A handoff, and CEO decision ID exist.
- Product planning done when: approved market decision is translated into difficulty-system goals, retention/ad strategy boundaries, and CEO decision ID.
- UX done when: onboarding/retry/reward/ad surfaces preserve core line-tracing priority and have CEO decision ID.
- Architecture done when: deterministic path-generation/difficulty model, migration/test plan, and CEO decision ID exist.
- Development starts only after explicit Owner approval.
