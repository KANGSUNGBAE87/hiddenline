---
version: 0.2.0
status: final-candidate-for-ceo-review
updated: 2026-06-20
canonical: true
phase: Visual/UI Design A2
project: Hidden Line / 히든라인
task_id: t_02d24e81
basis_decisions:
  - D-20260619-003
  - D-20260619-004
  - D-20260619-005
  - D-20260619-006
source_artifacts:
  - /Users/kangsungbae/Documents/hiddenline/00_PROJECT_BRIEF.md
  - /Users/kangsungbae/Documents/hiddenline/01_DECISIONS.md
  - /Users/kangsungbae/Documents/hiddenline/stages/08_PRODUCT_PLAN.md
  - /Users/kangsungbae/Documents/hiddenline/stages/10_UX_FINAL.md
  - /Users/kangsungbae/Documents/hiddenline/src/App.tsx
  - /Users/kangsungbae/Documents/hiddenline/src/ui/HomeScreen.tsx
  - /Users/kangsungbae/Documents/hiddenline/src/ui/PlayScreen.tsx
  - /Users/kangsungbae/Documents/hiddenline/src/ui/ResultScreen.tsx
  - /Users/kangsungbae/Documents/hiddenline/src/styles/app.css
  - /Users/kangsungbae/Documents/hiddenline/stages/reviews/t_bcb2a232-ui-layout.md
  - /Users/kangsungbae/Documents/지식저장소/docs/workflows/design-preflight.md
  - /Users/kangsungbae/Documents/지식저장소/docs/workflows/app-platform-standard.md
  - /Users/kangsungbae/Documents/지식저장소/docs/tools/apps-in-toss-platform.md
  - /Users/kangsungbae/Documents/지식저장소/docs/workflows/apps-in-toss-development-gate.md
  - /Users/kangsungbae/Documents/지식저장소/projects/hiddenline/platform.md
verification:
  - A2 document-only revision completed on 2026-06-20 KST; no product code modified
  - B challenge t_bcb2a232 reviewed and all three layout conditions accepted
  - A1 evidence retained: npm run build passed on 2026-06-20 KST; local Vite render screenshots captured under /tmp/hiddenline-ui
scope_note: 이 문서는 Owner가 지적한 레이아웃·버튼·색상·타이포그래피 문제를 해결하기 위한 시각 디자인 후보안이다. 제품 범위, UX 흐름, 아키텍처, 코드 변경, 출시 승인 자체가 아니다.
---

# Hidden Line Visual/UI Design A2 — 챌린지 반영 최종 디자인 후보

## 0. B challenge response

| B challenge | decision | A2 final response |
|---|---|---|
| Result same-seed retry CTA가 recap 아래 inline만 있으면 스크롤 중 visibility를 잃는다 | ACCEPT | `다시 도전`은 44px slim sticky glass bar로 스크롤 중에도 thumb zone에 유지하고, recap 끝에서는 full inline CTA로 확장한다. 기존 A1의 “overlay 제거” 의도는 유지하되, UX A2의 first reveal 계약을 보존한다. |
| Home preset horizontal segment는 360px에서 discoverability가 낮다 | ACCEPT | horizontal preset segment를 기본안에서 제거한다. Home에는 selected preset 2줄 요약 + “5개 난이도 중 · 난이도 고르기 ›” ghost chip만 두고, full 5-preset card grid는 sheet 안에서만 제공한다. |
| Home first viewport에 below-fold hint가 없다 | ACCEPT | mini playfield를 120px로 축소하고 CTA dock 위에 subtle gradient fade 또는 weekly dot/peek indicator를 둔다. 360×740 기준 기록/주간 영역의 8~12px peek가 하단에 걸쳐 보이도록 한다. |

거부된 challenge는 없다. B의 조건은 모두 수용하며, 색상/대비/typography/Gameplay 저소음 방향처럼 B가 검증한 A1 장점은 유지한다.

## 0.1 결론 요약

현재 앱은 다크/시안 계열의 방향성은 Hidden Line의 “어둠 속에서 손끝만 선을 드러낸다”는 장르에 맞지만, 홈 화면의 버튼/카드 CSS 누락과 정보 과밀 때문에 Owner가 보기에는 “엉망”으로 느껴질 가능성이 높다. 특히 `preset-card`, `preset-grid`, `preset-shell` 스타일이 실제 CSS에 없어서 브라우저 기본 회색 버튼처럼 보이고, bottom CTA가 첫 화면에서 난이도 카드 위를 덮어 주 행동과 설정 행동의 관계가 무너진다.

A2 최종안은 다음 원칙으로 정리한다.

1. Home은 “한 판 시작”만 강하게 보이고, 난이도 선택은 selected preset 2줄 요약 + sheet 진입으로 정리한다.
2. Gameplay는 현재 장점인 넓은 dark playfield와 spotlight 감각을 유지하되, 상단 chrome과 언어 토글 노출을 줄인다.
3. Result는 same-seed retry를 가장 큰 CTA로 유지하되, recap을 가리지 않는 44px slim sticky bar와 recap 끝 full inline CTA를 함께 둔다.
4. 색상은 거의 검정에 가까운 charcoal + cyan path light + amber warning + mint success + coral fail의 5역할 체계로 축소한다.
5. 버튼은 “primary / secondary / ghost / danger / chip” 5종만 허용하고, 회색 native button처럼 보이는 요소를 제거한다.

## 1. 입력 승인 및 범위 확인

### 승인 입력

- Product: `D-20260619-003`, `stages/08_PRODUCT_PLAN.md`
- UX: `D-20260619-004`, `stages/10_UX_FINAL.md`
- Architecture/Development boundary: `D-20260619-005`, `D-20260619-006`
- 현재 개발/QA는 이미 진행되었지만, 이 Visual/UI A2는 제품 코드 변경 없이 디자인 후보만 작성한다.

### 유지해야 하는 UX 계약

- 첫 공개 난이도는 5 named presets: Intro, Easy, Standard, Hard, Expert.
- player-facing 0-100 난이도 약속과 12 public levels 노출은 금지.
- first value는 “설명 없이 바로 한 판 시작 → 실패/성공 후 같은 seed 재도전”이다.
- 결과 화면에서 same-seed retry가 first reveal이어야 한다.
- 광고/IAP/login/backend ranking/real Apps in Toss SDK는 범위 밖이다.

## 2. 현재 UI 분석

### 2.1 코드/렌더 증거

- `npm run build`: TypeScript + Vite build 통과.
- 렌더 확인:
  - `/tmp/hiddenline-ui/mobile390-home-viewport.png`
  - `/tmp/hiddenline-ui/small360-home-viewport.png`
  - `/tmp/hiddenline-ui/mobile390-play.png`
  - `/tmp/hiddenline-ui/mobile390-result-failed.png`
  - `/tmp/hiddenline-ui/mobile390-result-success.png`
- 현재 CSS에는 `preset-card`, `preset-card--selected`, `preset-grid`, `preset-shell` 정의가 없어 preset button이 native gray button처럼 렌더된다.
- `.bottom-cta`는 fixed dock으로 보이나 Home 첫 화면에서 preset 영역을 덮어 선택 버튼과 주 CTA가 시각적으로 충돌한다.

### 2.2 잘 작동하는 부분

- Play screen의 중앙 playfield는 충분히 넓고 dark mood가 장르와 맞는다.
- cyan glow path, spotlight, hidden trail은 핵심 은유와 일치한다.
- Result screen은 실패/성공 색상 분기가 명확하고, metric card는 빠르게 읽힌다.
- Safe-area padding과 390/430px 모바일 폭 중심 설계는 방향이 맞다.

### 2.3 반드시 고쳐야 할 부분

| 화면 | 문제 | 왜 중요한가 | 디자인 처방 |
|---|---|---|---|
| Home | preset 카드가 회색 native button처럼 보임 | 제품 polish가 낮아 보이고 tap target hierarchy가 깨짐 | segment/card style을 명시하고 label/description/id를 3층으로 분리 |
| Home | bottom CTA가 preset과 line family 영역 위를 덮음 | 난이도 선택 중 CTA가 방해되고 “무엇을 눌러야 하는지” 혼란 | CTA dock 높이만큼 spacer 확보 또는 Home hero 내부 CTA로 전환 |
| Home | 설명, 미리보기, preset, line family, 기록, 주간, 더 많은 선택이 첫 화면에 과밀 | first value인 “바로 시작”이 buried 됨 | 첫 viewport는 hero + selected preset + primary CTA + secondary 난이도만 노출 |
| Shell | Google Play target에서도 언어 토글이 최상단 큰 pill로 노출 | 게임보다 설정이 먼저 보임 | 언어는 top-right compact icon 또는 settings sheet 내부로 이동 |
| Result | fixed CTA가 recap 카드 위를 덮어 path preview를 가림 | 결과 회고와 재도전 CTA가 서로 경쟁 | result action dock을 카드 아래로 고정하거나 recap 최소 높이/하단 여백 확보 |
| Feedback | disabled textarea 대비가 낮고 “기기 안에만 저장”이 애매하게 보임 | 접근성/신뢰 문제 | disabled text 토큰을 AA 이상으로 올리고 local-only microcopy를 보조 텍스트로 분리 |

## 3. Reference / mood analysis

### 3.1 레퍼런스 방향

외부 palette preflight에서는 colors.io 자체의 명확한 dark mobile game palette 결과를 확인하지 못해 Coolors/일반 palette reference를 fallback으로 삼았다. 검색 결과상 gaming/dark cyan UI palette들은 “deep base + bright cyan or mint accent + warning accent”를 반복적으로 제안한다. 이는 현재 Hidden Line의 spotlight/path metaphor와 잘 맞는다.

- Coolors: palette generator / contrast checker / palette visualizer를 제공하는 fallback source.
- Dark gaming palette references: near-black or navy base + cyan/mint/high-contrast accents.
- Dark cyan palette references: charcoal/slate base + cyan/seafoam highlight가 전문적이고 차분한 UI에 적합.

### 3.2 Hidden Line mood target

- Mood: Quiet tension, precision, dark glass, fingertip light.
- 피해야 할 mood: arcade neon 과다, casino/reward 느낌, sci-fi dashboard 과밀, 토스 금융 앱처럼 밝고 친절하기만 한 UI.
- 좋은 비유: “손전등으로 벽 속 얇은 선을 찾는 야간 미로” + “정밀 측정기”.

### 3.3 Visual keywords

- dark field
- cyan trace
- soft spotlight
- quiet precision
- one clear action
- measured feedback
- no decorative clutter

## 4. Visual principles

1. Path first
   - 모든 화면에서 cyan line/spotlight가 브랜드 이미지의 중심이다.
   - 다른 장식 glow는 path glow보다 강하면 안 된다.

2. One primary action per viewport
   - Home: `오늘의 선 시작하기` 또는 `바로 시작` 하나.
   - Result: `다시 도전` 하나.
   - Preset sheet: `이 난이도로 시작` 하나.

3. Progressive disclosure
   - line family, visibility, weekly records, feedback 등은 첫 화면 아래 또는 sheet로 보낸다.
   - first value 전에 설정 UI가 과밀하게 보이면 실패다.

4. Touch-safe bottom system
   - 하단 CTA는 56px button + 12px top/bottom + safe area로 통일한다.
   - fixed dock 뒤에는 반드시 `padding-bottom: dock height + safe area + 16px`를 둔다.

5. Dark but readable
   - surface 간 차이는 hue보다 luminance로 구분한다.
   - body text는 최소 14px, 핵심 설명은 15~16px를 쓴다.

6. No native controls
   - browser default gray button/select 느낌은 금지한다.
   - 모든 버튼은 tokens 기반 background/border/radius/focus ring을 가진다.

## 5. Color tokens

### 5.1 Proposed semantic palette

| Token | Hex | Role |
|---|---:|---|
| `bg.app` | `#070B10` | 앱 전체 배경. 거의 검정에 가까운 night field |
| `bg.grid` | `#0B1118` | 미세 grid/ambient 배경 |
| `surface.base` | `#111923` | 카드 기본 면 |
| `surface.raised` | `#172432` | hero/result/playfield raised card |
| `surface.glass` | `rgba(23, 36, 50, 0.88)` | bottom dock, modal |
| `border.subtle` | `rgba(137, 189, 211, 0.16)` | 보조 경계 |
| `border.active` | `rgba(111, 228, 255, 0.48)` | 선택/포커스 경계 |
| `path.primary` | `#6FE4FF` | 주요 path, primary CTA glow |
| `path.core` | `#D7F8FF` | spotlight center, strong highlight |
| `path.hidden` | `#22313B` | 숨은 선/배경 trail |
| `warning` | `#FFCF6A` | speed/jitter/attention |
| `success` | `#7BE5C8` | completion/new record |
| `danger` | `#FF8B7D` | failure/off-path/abort |
| `text.primary` | `#F3FBFF` | 제목/주요 숫자 |
| `text.secondary` | `#B8C7D4` | 본문/설명 |
| `text.muted` | `#8797A3` | disabled/caption, AA 이상 |
| `text.inverse` | `#041016` | cyan primary button 위 글자 |

### 5.2 Contrast check

직접 계산한 contrast 기준:

| Pair | Ratio | Pass |
|---|---:|---|
| `text.primary` on `bg.app` | 18.84:1 | AAA |
| `text.secondary` on `surface.base` | 10.24:1 | AAA |
| `text.muted` on `surface.base` | 5.88:1 | AA |
| `text.inverse` on `path.primary` | 13.03:1 | AAA |
| `warning` on `bg.app` | 13.52:1 | AAA |
| `success` on `bg.app` | 13.04:1 | AAA |
| `danger` on `bg.app` | 8.68:1 | AAA |

주의: 현재 `--disabled: #5f6b75` 계열은 surface 위에서 약 3.8:1 수준으로 AA 미달 가능성이 있다. disabled/caption은 `#8797A3` 이상으로 올린다.

### 5.3 Color usage rules

- Cyan은 “경로/진행/primary action”에만 사용한다.
- Amber는 “주의/속도/흔들림/더 많은 선택”에 제한한다.
- Mint는 success/result positive에만 사용한다.
- Coral은 fail/abort/danger에만 사용한다.
- Purple/violet 계열은 현재 `line-selector`에 일부 보이나 Hidden Line의 핵심 path mood와 경쟁하므로 제거하거나 very subtle variant tint로만 둔다.

## 6. Typography

### 6.1 Font stack

- Primary: `Inter`, `Pretendard`, `ui-sans-serif`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`
- Korean fallback: Apple SD Gothic Neo / system fallback을 자연스럽게 사용.
- 숫자/metric: same font with `font-variant-numeric: tabular-nums`.

### 6.2 Type scale

| Token | Size / line-height / weight | Usage |
|---|---|---|
| `display.sm` | 30px / 1.08 / 820 | Home title on mobile |
| `title.lg` | 24px / 1.15 / 780 | Result title secondary viewport |
| `title.md` | 18px / 1.25 / 760 | Card headings |
| `body.md` | 15px / 1.55 / 520 | Guide copy |
| `body.sm` | 13px / 1.45 / 520 | Supporting copy |
| `label.md` | 12px / 1.25 / 760 | Eyebrow, chip label |
| `metric.lg` | 28px / 1.0 / 820 | Score/progress numbers |
| `button.md` | 16px / 1.2 / 800 | Primary button |

### 6.3 Typography rules

- Korean title은 `word-break: keep-all` 유지.
- 버튼 안에서는 label과 sublabel을 섞지 않는다. Primary button은 한 줄 label만 둔다.
- preset card의 `INTRO/EASY` 같은 code label은 작은 capsule로 분리하고 본문 옆에 붙이지 않는다.
- 결과 metric 숫자는 tabular-nums로 정렬해 안정감을 준다.

## 7. Imagery & iconography

### 7.1 Image style

- 실제 이미지 asset보다 procedural path preview와 spotlight가 브랜드 이미지다.
- Home preview는 현재 작은 세로 카드보다 더 넓은 “mini playfield”가 좋다. 이유: 사용자가 실제 플레이 상태를 예측할 수 있다.
- Preview에서 전체 path를 너무 많이 보여주면 hidden game의 긴장감이 줄어든다. 시작점, 첫 곡선 20~30%, destination hint만 보여준다.

### 7.2 Icon style

- Stroke 1.75~2px, rounded cap, monochrome.
- Back/close/more/language/settings만 필요.
- Trophy, fire, gift, coin 등 보상 경제를 암시하는 아이콘은 first validation에서 금지.

### 7.3 Motion / React Bits decision

- React Bits는 “결과 성공 시 짧은 text reveal” 또는 “onboarding에서 path glow reveal” 정도만 후보로 둔다.
- 현재 A2는 코드 변경이 아니므로 설치하지 않는다.
- 추후 적용한다면 React project + Vite이므로 JS-CSS 또는 TS-CSS variant를 검토하되, continuous particle/WebGL background는 Apps in Toss/mobile performance 위험 때문에 피한다.
- reduced-motion에서는 glow pulse/reveal을 0.01ms 또는 static으로 대체한다.

## 8. Components

### 8.1 Button system

| Component | Size | Style | Usage |
|---|---|---|---|
| Primary CTA | 56px min-height, radius 18 | cyan gradient, dark text, right arrow circle | Home start, Result retry, Preset start |
| Secondary block | 52px min-height, radius 16 | dark surface, subtle border, white text | Home, More actions |
| Ghost chip | 36~40px, radius 999 | transparent/dim surface, cyan border when selected | Preset segment, language compact |
| Danger | 52px, radius 16 | coral gradient or dark surface with coral border | Abort/exit destructive |
| Icon button | 44px tap target | circular dark glass | back, close, more |

### 8.2 Preset card

Current issue: label/description/id가 한 줄처럼 붙고 회색 native button으로 보인다.

Proposed structure:

```text
┌────────────────────────────────┐
│ Intro                 SELECTED │
│ 처음이라면 여기서 감을 익혀요   │
│ curve low · visibility normal  │
└────────────────────────────────┘
```

Rules:

- Card height 76~88px.
- active card만 cyan border/glow.
- `INTRO` code capsule은 오른쪽 상단, description과 붙이지 않는다.
- 5개를 모두 첫 viewport에 펼치지 않는다. Home은 selected preset summary만 보이고, full 5-preset card grid는 sheet/dedicated selection 안에서만 보여준다.

### 8.3 Path preview card

- aspect ratio: 16:9 또는 4:3. Home mini preview는 120px 기준, dedicated preview/result recap은 150px 이상을 허용한다.
- background: deepest surface with faint grid.
- start point: cyan halo 28~36px.
- hidden path: low-alpha stroke.
- destination: small crosshair at 22~28% opacity.

### 8.4 Metric card

- 2-column grid 유지.
- 핵심 metric: Progress/Score를 첫 row 좌측에 고정.
- 숫자 28px, label 12px, card min-height 80px.
- 실패 화면에서는 progress/cause를 score보다 우선한다.

## 9. Screen-by-screen visual direction and layout drafts

### 9.1 Home / Start — “one-tap start first, sheet for depth”

#### Current critique

현재 첫 viewport에 title, guide, preview, preset grid, selected board, restore/visibility buttons, line family, bottom CTA가 동시에 보인다. 360~390px 폭에서는 preset 카드가 gray native button으로 겹쳐 보이고 bottom CTA가 선택 버튼 일부를 덮는다. B challenge는 A1의 horizontal preset segment 대안도 360px에서 discoverability가 낮다고 지적했다.

#### Final layout — recommended

```text
┌────────────────────────────┐
│ compact top: Hidden Line  ⚙ │
├────────────────────────────┤
│ HERO                       │
│ 오늘의 숨은선              │
│ 보이지 않는 선을 손끝으로  │
│ [mini playfield 120px]     │
│ Intro                      │
│ 처음이라면 여기서 감을 익혀요│
│ 5개 난이도 중 · 난이도 고르기 ›│ ghost chip / sheet entry
├────────────────────────────┤
│ subtle fade + weekly dots  │ below-fold hint
│ [ 오늘의 선 시작하기   › ] │ fixed/contained bottom CTA
└────────────────────────────┘
```

Accepted B changes:

- Horizontal preset segment는 기본안에서 제거한다. 44px 가로 스크롤 chip은 5개 난이도 존재를 충분히 알리지 못하므로 사용하지 않는다.
- Home에는 selected preset의 이름 + 1문장 설명을 항상 보인다. 예: `Intro / 처음이라면 여기서 감을 익혀요`.
- sheet 진입 전 microcopy로 `5개 난이도 중`을 표시해 더 많은 preset 존재를 알린다.
- full 5-preset card grid는 Home 첫 viewport가 아니라 난이도 sheet 내부에 둔다.
- mini playfield는 150px이 아니라 120px 기준으로 축소하고, 아래 content peek 또는 dot indicator로 below fold를 암시한다.

Button placement reason:

- `오늘의 선 시작하기`는 first value이므로 하단 thumb zone에 둔다.
- `난이도 고르기`는 selected preset summary에 붙은 ghost chip으로 두어 `바로 시작`과 경쟁하지 않는다.
- `오늘의 도전`/기록/주간은 아래 fold에 두되, 360×740에서도 8~12px peek 또는 indicator로 존재를 암시한다.

#### Home visual hierarchy

1. Title: 오늘의 숨은선
2. Preview: 120px mini playfield
3. Selected preset summary: Intro + description + `5개 난이도 중`
4. Primary CTA: 오늘의 선 시작하기
5. Below-fold hint: gradient fade, weekly dots, or content peek
6. Below fold: 오늘의 도전, 기록, 주간, 더 많은 선택

### 9.2 Preset Selection — “difficulty without numeric promise”

Preset selection은 Home의 horizontal segment가 아니라 sheet 또는 dedicated selection screen으로 연다. Home에서는 selected preset summary만 보이고, sheet 안에서만 5개 난이도 전체를 카드로 보여준다.

```text
┌────────────────────────────┐
│ 난이도 고르기              │
│ 5개 난이도 중 하나를 골라요 │
│ 숫자보다 선의 느낌을 고르세요│
├────────────────────────────┤
│ Intro     처음이라면...    │
│ Easy      가볍게 리듬...   │
│ Standard  길이와 굽이...   │
│ Hard      집중과 길이...   │
│ Expert    정밀한 도전...   │
├────────────────────────────┤
│ [이 난이도로 시작하기]     │
└────────────────────────────┘
```

Button placement reason:

- 카드 탭은 “선택”만 수행한다.
- 시작은 하단 primary 한 개로 분리해 accidental start를 줄인다.
- 인접 난이도 이동은 Result에서 progressive disclosure로 유지한다.
- 360px 폭에서도 각 card min-height는 76px 이상을 유지하고, description은 2줄까지 허용한다.
- sheet 진입/닫기 icon button은 44px tap target을 유지한다.

### 9.3 Gameplay — “dark field with low UI noise”

#### Current critique

Play screen은 가장 완성도가 높다. 다만 상단의 언어 switcher가 게임보다 먼저 보이며, Google Play target에서는 `Hidden Line + language pill`가 너무 많은 chrome을 차지한다.

#### Proposed layout

```text
┌────────────────────────────┐
│ ‹  첫 선              0%    │
│ progress hairline           │
├────────────────────────────┤
│                            │
│        dark playfield       │
│   start halo + hidden curve │
│                            │
├────────────────────────────┤
│ 시작점에 손가락을 올려보세요 │
│ ① 시작  ② 따라가기  ③ 회복 │ only before start
└────────────────────────────┘
```

Rules:

- Language switcher는 gameplay 중 숨긴다. 설정/언어는 Home 또는 pause/exit sheet에만 둔다.
- Playfield는 viewport height의 58~66%를 차지한다.
- Back button은 44px circular, progress는 숫자 + 4px bar로 유지.
- Warning은 toast/banner가 아니라 helper bar tone change로 충분하다.

Button placement reason:

- Back은 좌상단으로 두되 destructive exit confirmation을 거친다.
- Gameplay 중 primary CTA는 두지 않는다. 손가락 조작과 경쟁하기 때문이다.

### 9.4 Result — “retry first, analysis second, visible during recap”

#### Current critique

Result는 metric hierarchy가 좋지만, fixed `다시 도전` CTA가 recap 카드 위에 겹친다. A1은 CTA를 recap 아래 inline으로 옮겨 overlay를 제거하려 했으나, B challenge는 recap 스크롤 중 same-seed retry visibility가 사라지는 문제를 지적했다. 실패 화면에서는 feedback textarea가 disabled gray로 낮은 대비를 보여 완성도가 떨어진다.

#### Final layout

```text
┌────────────────────────────┐
│ 여기까지 따라왔어요 / 완주 │
│ 실패 이유 or new best       │
├─────────────┬──────────────┤
│ 진행률 68%  │ 정확도 81%   │
│ 부드러움... │ 차분함...    │
├────────────────────────────┤
│ 이번 선 돌아보기            │
│ path recap                  │
│                            │
│ slim sticky retry bar       │ 44px glass, visible while recap scrolls
├────────────────────────────┤
│ [다시 도전]                 │ full inline CTA when recap ends
│ 홈으로   더 많은 선택       │
├────────────────────────────┤
│ 점수 계산 / 난도 피드백     │ below fold
└────────────────────────────┘
```

Accepted B changes:

- `다시 도전`은 same-seed retry 계약상 first action이므로 스크롤 중에도 44px slim sticky bar로 하단 thumb zone에 유지한다.
- sticky bar는 recap을 덮어 내용을 숨기는 불투명 dock이 아니라 반투명 glass + top border + safe-area padding으로 처리한다.
- 사용자가 recap 끝에 도달하면 full inline primary CTA로 자연스럽게 확장/전환한다.
- recap이 200px 이상인 360×740 viewport에서도 retry CTA가 계속 보이는 것을 구현 QA 기준으로 둔다.

Button placement reason:

- `다시 도전`은 same-seed retry 계약상 첫 action이므로 sticky visibility와 full inline CTA를 둘 다 가진다.
- `홈으로`와 `더 많은 선택`은 secondary 2-column 또는 stacked ghost로 둔다.
- `난도 피드백`은 결과 수용 뒤의 optional action이므로 primary sticky bar 위로 올라오지 않는다.

### 9.5 Daily / Weekly records — “below first value”

- Home 첫 viewport에 기록 카드/주간 카드를 크게 보이지 않는다.
- Result 이후 또는 Home 아래 fold에서 “이번 주 0/7” 정도로 축약한다.
- 공식 기록, 오늘 연선, 본선 시도 같은 용어는 사용자가 이해하기 어려우므로 UX copy와 다시 맞춘다.

## 10. Layout grid and spacing

### 10.1 Mobile grid

- App max width: 430px for mobile preview, 520px max for desktop browser shell.
- Side margin: 16px default, 14px below 390px, 12px below 370px.
- Card gap: 12px.
- Section gap: 16px below fold, 12px above fold.
- Radius: card 20px, small card 16px, button 18px, chip 999px.

### 10.2 Bottom action dock and result retry bar

- Home primary dock visual height: 80~92px including safe area.
- Page bottom padding: dock height + 16px.
- Fixed dock must not sit inside a transformed/overflow hidden parent.
- Home dock 위에는 subtle fade / dot / content peek 중 하나를 둬 below-fold content를 암시한다.
- Result retry는 full dock이 아니라 44px slim sticky glass bar를 사용하고, recap 끝에서는 full inline CTA로 전환한다.
- Full-page screenshot QA should confirm dock/bar does not cover card text, preset summary, path recap, or feedback fields.

### 10.3 Tap targets

- Primary/secondary button min-height: 52~56px.
- Icon button: 44px.
- Segment/chip: min-height 40~44px.
- Sheet preset cards: min-height 76px, 2-line description allowance, no Home horizontal preset scroll by default.

## 11. Accessibility notes

- All text/background pairs listed in Section 5 pass AA except the current disabled token, which should be replaced.
- Focus visible ring: 3px cyan alpha ring + active border.
- Reduced motion: all glow pulse/path reveal animations become static.
- Color cannot be the only status signal: warning/success/failure must include label/icon/copy.
- Korean/English i18n length: English preset descriptions may be longer; card layout should reserve 2 lines for descriptions.
- Safe area: bottom CTA and top chrome must include `env(safe-area-inset-*)`.
- Gameplay: hidden path contrast must stay low enough to preserve game premise but start point/destination must remain perceivable.

## 12. Final layout handoff requirements

A2에서 B challenge는 한 번 반영했으므로, 다음 작업자는 아래를 구현/검증 요구사항으로 취급한다. 이 목록은 추가 layout challenge 요청이 아니다.

1. Home first viewport: 360×740에서 title, 120px preview, selected preset 2줄 요약, `5개 난이도 중` microcopy, primary CTA가 겹치지 않아야 한다.
2. Preset selection: Home horizontal 5-preset segment는 쓰지 않는다. Full 5-preset grid는 sheet/dedicated selection 안에 둔다.
3. Below-fold hint: 360×740 하단에 subtle gradient fade, weekly dot, 또는 기록/주간 영역 8~12px peek가 보여야 한다.
4. CTA dock: Home dock은 preset summary, card text, below-fold peek를 덮지 않아야 한다.
5. Result retry: recap이 200px 이상이어도 44px slim sticky retry bar가 thumb zone에 계속 보이고, recap 끝에서는 full inline CTA가 보여야 한다.
6. Result secondary actions: `홈으로`, `더 많은 선택`, `난이도 느낌 남기기`는 same-seed retry보다 강하게 보이면 안 된다.
7. Language switcher: Google Play shell은 Home/settings에만 compact하게 두고 gameplay 중에는 숨긴다.
8. Long copy: Korean/English button/card overflow를 360px에서 확인한다.
9. Apps in Toss compatibility: target이 Apps in Toss일 때 top-right more/close가 Home hero title 또는 gameplay back button과 충돌하지 않아야 한다.
10. Touch area: playfield should keep at least 420px height on 390×844, but Home should not mimic gameplay card so strongly that users think it is already playable.

## 13. Implementation-facing CSS notes (not code changes in this task)

- Add explicit CSS for `.preset-shell`, `.preset-grid`, `.preset-card`, `.preset-card--selected`.
- Audit every class referenced in TSX but absent in CSS before visual QA.
- Move `bottom-cta` spacer responsibility to each screen or create `.has-bottom-cta` utility.
- Replace current disabled/caption color with AA-safe `#8797A3` or equivalent.
- Consider splitting Home into `HeroStart`, `PresetSelector`, `RecordSummary` components so visual hierarchy maps to code boundaries.
- If preserving fixed dock, test with Playwright viewport screenshots for 360×740, 390×844, 430×932.

## 14. Excluded scope

- 제품 코드 수정.
- Product/UX flow 변경.
- 12 public levels 또는 player-facing 0-100 promise 확정.
- 광고/IAP/reward/login/backend ranking 설계 또는 구현.
- 실제 Apps in Toss SDK, Google Play Billing, AdMob, Toss login 연결.
- 출시 승인, QA/Release 승인, store upload readiness 판정.

## 15. Unresolved assumptions

- Owner가 원하는 “디자인이 엉망”의 구체 원인이 홈의 native button/overlap 문제인지, 전체 브랜드 무드 불만인지 아직 직접 인용된 세부 기준은 없다.
- `/Users/kangsungbae/Documents/hiddenline/stages/13_UX_DESIGN.md`는 현재 workspace에서 찾지 못했고, 승인 UX 입력은 `stages/10_UX_FINAL.md`로 확인했다.
- 실제 기기에서 finger occlusion/viewport keyboard/safe-area inset은 스크린샷만으로 확정할 수 없다.
- B challenge 반영 후 Result retry는 44px slim sticky bar + recap 끝 full inline CTA로 고정하고, Home primary CTA는 dock/contained 중 구현 여건에 맞추되 below-fold hint와 overlap 방지를 필수 조건으로 둔다.

## 16. Acceptance mapping

| Acceptance | Coverage |
|---|---|
| 3개 이상 주요 화면 레이아웃·버튼 배치 제안 | Home, Preset Selection, Gameplay, Result, Daily/Weekly |
| 색상·타이포그래피·컴포넌트 스타일 명시 | Sections 5~8 |
| UI 개선 근거 제시 | Current screenshot/code issues, B challenge response, contrast checks, UX decision mapping |
| 장르 적합성 | Dark field, cyan path, precision mood, one primary action |
| 접근성 대비 | Section 5.2, Section 11 |
| 챌린지 대응 내역 명시 | Section 0, Sections 9.1/9.2/9.4, Section 12 |

## 17. Handoff

- Output path: `/Users/kangsungbae/Documents/hiddenline/stages/15_UI_DESIGN.md`
- A2 task: `t_02d24e81`
- Challenge source: `t_bcb2a232`, `stages/reviews/t_bcb2a232-ui-layout.md`, parent comment_id=467
- A2 verification: document-only revision; no product code modified. A1 build/render evidence remains the source for current-state screenshots.
- Challenge response: accepted all 3 B findings — Result retry sticky visibility, Home preset sheet summary, Home below-fold hint. No rejected challenge.
- Primary design decision: retain dark/cyan spotlight mood, simplify Home hierarchy, remove native-looking preset buttons, and preserve same-seed retry first reveal with a slim sticky retry bar.
- Next profile: `studio-ceo` should decide approval; this handoff is not stage approval.

## 18. knowledge_candidates

- maturity: candidate
  summary: React UI visual QA should include a class-reference audit; JSX classes without CSS definitions can silently fall back to native browser controls and make an otherwise functional screen look broken.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/src/ui/HomeScreen.tsx and /Users/kangsungbae/Documents/hiddenline/src/styles/app.css
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/docs/workflows/design-preflight.md
- maturity: candidate
  summary: Mobile games with fixed bottom CTA docks need viewport and full-page screenshot checks because the dock can cover configuration cards or result recaps even when build/tests pass.
  evidence_path: /tmp/hiddenline-ui/mobile390-home-viewport.png and /tmp/hiddenline-ui/mobile390-result-failed.png
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/docs/testing/script-first-browser-qa-template.md
