# UI Layout Challenge — Hidden Line Visual/UI Design B

- reviewer: ui-layout-designer
- reviewed: stages/15_UI_DESIGN.md (visual-designer A1 proposal)
- date: 2026-06-20
- sources: stages/10_UX_FINAL.md, stages/08_PRODUCT_PLAN.md, src/ui/*.tsx, src/styles/app.css

## Evidence collected

### CSS audit confirmations
- `.preset-card`, `.preset-grid`, `.preset-shell`: grep 결과 app.css에 정의 없음 (search_files total_count=0). A1 지적 정확.
- `.bottom-cta`: `position: fixed` + `z-index: 18` + gradient backdrop (line 1420-1437). overlay CTA dock.
- `.primary-button`, `.secondary-button`: 존재하며 스타일 완비 (line 891-1005).

### Code layout 확인
- HomeScreen.tsx: daily-hero → preset-shell(preset-grid 5개 + selected-board + selector-controls) → line-selector → daily-stat-grid → daily-missions → visibility-selector → weekly-panel. 첫 viewport에 7개 섹션.
- ResultScreen.tsx: result-hero → metric-grid → result-recap → result-analysis → result-actions (bottom-cta wrapper). bottom-cta가 fixed overlay.
- PlayScreen.tsx: play-header → progress-track → play-field (CanvasGame) → play-helper → micro-tutorial. bottom-cta 없음 — gameplay 중 CTA 없음은 UX와 일치.

### UX contract 확인
- 10_UX_FINAL.md Section 4.5: same-seed retry가 "first reveal" — 결과 화면에서 가장 먼저 노출되고 접근 가능해야 함
- CTA 우선순위: 1. 같은 seed로 다시 하기 2. 더 많은 선택 3. adjacent preset 4. 오늘의 도전 5. 난이도 느낌 남기기

### Product plan 제약
- 광고/IAP/로그인/reward: 모두 excluded scope
- Google Play-first, Apps in Toss 호환성 유지
- first validation은 core retry loop + difficulty feel 검증

## Layout findings

### Finding 1: Home preset horizontal segment UX risk
A1 Layout B는 "5 preset을 horizontal scroll segment (44px)"로 제안한다. 360px 폭에서 한 번에 1.5~2개만 노출되고, 사용자는 총 5개 존재를 알 수 없으며, 44px 높이의 tap target은 손가락 조작에 불편하다. A1 Layout A(sheet 접근)가 더 나으나, sheet 진입 전 selected preset 요약만으로 충분한 맥락을 주는지 의문.

### Finding 2: Result same-seed retry CTA scroll visibility
A1은 "sticky after recap, not overlay"를 제안하나, 이는 CTA가 recap 아래 inline 배치되어 사용자가 path recap을 스크롤해 살펴볼 때 retry CTA가 사라짐을 의미한다. UX contract상 same-seed retry는 "first reveal"이며 결과 화면에서 가장 우선 접근 가능해야 한다(10_UX_FINAL Section 4.5). recap이 길거나 복잡한 경로일수록 CTA 부재 시간이 길어진다.

### Finding 3: Home first viewport "below fold" hint 부재
360×740 viewport에서 A1 Layout A(hero + mini playfield 150px + preset + CTA dock)는 viewport의 약 83%를 점유한다. Daily Challenge, 주간 기록, practice mode가 below fold에 완전히 숨겨지고, scroll을 유도하는 visual cue가 없다. 첫 사용자는 앱 기능을 오직 한 판 시작으로만 인지할 위험.

## A1 대비 검증된 부분
- CSS `.preset-card` 등 누락 지적: 정확함
- bottom-cta overlay 문제 식별: 정확함 (fixed + z-index 18)
- PlayScreen 언어 토글 축소: UX contract와 일치
- color token contrast: 계산값 모두 AA 이상 통과
- typography scale: 모바일 적합

## Policy check
- 광고/IAP/share 버튼: A1에 기술되지 않았고 현재 scope에서 excluded. 추가 challenge 없음.
- Apps in Toss/Google Play 이중 타겟: A1이 language switcher, safe-area를 인지하고 있음. 상단 chrome 간소화 방향은 양 플랫폼 모두 적합.
