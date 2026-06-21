---
version: 0.2.0
status: final-candidate
updated: 2026-06-20
canonical: true
phase: Visual/UI Restart A2
project: Hidden Line / 히든라인
task_id: t_a66e3d2d
parent_task: t_43c1e3f6
challenge_task: t_0fb4cddd
basis_decision: D-20260620-011
model_route:
  primary: visual-designer (gpt-5.5)
  challenge: ui-layout-designer (deepseek-v4-pro)
---

# Hidden Line Visual/UI Restart A2 — B challenge 반영 최종 교정 디자인

## 0. B challenge response (t_0fb4cddd)

ui-layout-designer의 B challenge에서 제기된 3개 배치 이슈에 대한 판정:

| # | challenge | decision | rationale | 변경된 section |
|---|---|---|---|---|
| **C1** | Difficulty/Sight selector가 Home에서 사라진 결정 | **ACCEPT** | canonical `design-plan.md` L67-77은 difficulty/sight selector를 Home-level compact dropdown으로 명시. D-20260620-011 "원본 디자인으로 돌아가라"와 충돌. selector를 preset sheet 안으로 숨기면 2-depth friction 발생 + L77 "즉시 업데이트" 의도 훼손 | §2.1, §2.2, §3.1, §3.2 |
| **C2** | Preset summary 영역 52px 공간 부족 | **ACCEPT** | 실측: preset name(20px) + description(20px, 1줄) + ghost chip(48px) + 간격(8px) = 최소 96px. 52px 대비 44px 부족. 360×740에서 weekly dot peek 밀림 또는 CTA overlap 유발 | §2.1, §2.7 |
| **C3** | Result sticky bar + inline CTA 중복 노출 | **ACCEPT** | UX_FINAL §4.5: same-seed retry를 "first reveal"로 우선 노출. sticky bar가 항상 보이면 recap 보기 전 retry를 먼저 인지 → first reveal 의도 흐려짐. recap이 150px 이하로 짧을 때 sticky bar + inline CTA 동시 노출 → 중복 | §2.4, §3.6 |

B challenge가 확인한 6개 OK 항목은 변경하지 않고 유지한다 (weekly dot peek 시인성, line family 4패널 세로 배치, 390/430px 확장 비율, 언어 토글 compact icon, 한글 버튼 라벨 길이, popover/CTA 간 배치).

## 0a. 결정 맥락

- D-20260620-011: Owner가 현재 Visual/UI 상태를 기각. 원본 게임·디자인·미래 기획 문서 + 현재 스크린샷을 기준으로 A→B→A 디자인을 다시 시작.
- 이 문서는 코드 변경 없이 디자인 방향 재설정만 수행한다. 제품 범위, UX 흐름, 아키텍처, 출시 승인 자체를 바꾸지 않는다.

### 필수 입력 문서 인벤토리

| # | 파일 경로 | 상태 | 핵심 내용 |
|---|---|---|---|
| 1 | `AGENTS.md` | 읽음 | Dark Calm Theme, precision tracing game, mobile-first |
| 2 | `AI_CONTEXT.md` | 읽음 | 공유 지식 브리지, design-preflight 규칙 |
| 3 | `design-preflight.md` | 읽음 | A→B→A gate, visual refresh pattern, 색상/React Bits 규칙 |
| 4 | `app-platform-standard.md` | 읽음 | Apps in Toss + Google Play 호환, i18n, 어댑터 |
| 5 | `00_PROJECT_BRIEF.md` | 읽음 | 최우선: 난이도에 맞게 선을 잘 그리는 것 |
| 6 | `01_DECISIONS.md` (D-006~D-011) | 읽음 | D-006: UI A2 조건부 승인. D-011: 기각 후 재시작 |
| 7 | `ai/design/2026-06-08-hidden-line-design-plan.md` | 읽음 | 원본 디자인 방향: Dark Calm Theme, color tokens |
| 8 | `ai/plans/design-plan.md` (canonical, v0.4) | 읽음 | 고정된 Home 계층구조 + difficulty/sight selector 방향 (L63-91) |
| 9 | `ai/plans/2026-06-07-hidden-line-product-spec.md` | 읽음 | 제품 스펙: 5 named presets, seed 기반, spotlight 게임 |
| 10 | `ai/plans/2026-06-13-hidden-line-product-depth-v2-execution-plan.md` | 읽음 | Home/Result v2 깊이 추가 |
| 11 | `stages/10_UX_FINAL.md` (canonical, v0.2.0) | 읽음 | UX A2: §4.5 Result CTA 순서, retry first reveal |
| 12 | `stages/15_UI_DESIGN.md` (v0.2.0, 기각됨) | 읽음 | 기각 전 마지막 UI 문서 |
| 13 | `stages/reviews/t_0fb4cddd-ui-restart-layout-challenge.md` | 읽음 | B challenge: 3개 배치 이슈 + 6개 OK |

---

## 1. 디자인 계보 (Lineage Table)

### 1.1 원본 디자인 의도 → 이후 계획 변경 → 현재 스크린샷 회귀 → 교정 방향

| # | 원본 디자인 의도 (2026-06-10/16) | 이후 계획 변경 (2026-06-13/16) | 현재 스크린샷 회귀 (CEO triage) | 교정 방향 (A2 최종) | 판정 |
|---|---|---|---|---|---|
| **L1** | **Line difficulty**: easy/normal/hard, **dropdown-style** custom dark popover (`design-plan.md` L63-77) | visibility-difficulty plan에서 3×3=9 selector 조합 공식화. selector 방향 자체는 변경 없음 | difficulty 선택이 messy text-box/chip fragments로 노출. "난이도 피드백"이 disabled textarea로 보임 | **원본 복원 (C1 수용)**: 두 개의 compact custom dark popover selector를 Home 아래 fold에 배치. Line difficulty 따로, Sight range 따로. Preset sheet 안에도 중복 진입 허용 | ⚠️ VISUAL_DEFECT → RESTORED |
| **L2** | **Line family**: 4개 패널만 보이게 (`design-plan.md` L69) | line-visibility plan: warmup/main/curve/precision 4종 유지 + 각각 difficulty/visibility 조합 | line family 카드가 다른 카드들과 섞여 과밀. 4개 vs 12개 구분 불가 | **원본 복원**: 4개 line-family panel을 깔끔하게 보이고, 선택된 difficulty/sight 조합 결과를 각 패널이 반영 | ⚠️ VISUAL_DEFECT |
| **L3** | **Home first viewport**: "오늘의 선 시작하기"가 유일한 primary CTA | product-depth v2에서 Daily artifact, compact week strip 추가 | game method card, preview, preset list, line family card, record cards, weekly card가 첫 viewport에서 경쟁 | **원본 복원 + C1/C2 반영**: 첫 viewport = title + mini playfield + preset summary(96px) + primary CTA. difficulty/sight selectors는 CTA 아래 fold에. 나머지는 progressive disclosure | ⚠️ VISUAL_DEFECT → RESTORED |
| **L4** | **Preset 선택**: 12개 card 금지 (`design-plan.md` L76) | 변경 없음 | preset copy가 stacked gray text chips로 렌더되어 시각적으로 깨짐 | **완전 제거 후 재설계**: preset은 Home에서 selected summary + ghost chip만. Full grid는 sheet 안에서만 | ⚠️ VISUAL_DEFECT |
| **L5** | **Native control 금지**: custom dark popover만 허용 | 변경 없음. `15_UI_DESIGN.md`도 명시 | 회색 native button처럼 보이는 preset 카드, disabled textarea | **원본 복원**: 모든 버튼/선택 컨트롤은 token 기반 custom. Browser default 완전 금지 | ⚠️ VISUAL_DEFECT |
| **L6** | **Dark Calm Theme**: `#0E1318` 배경, cyan path, amber warning, mint success, coral fail | 변경 없음 | 색상 자체는 큰 문제 없으나 과밀한 card가 mood를 깸 | **보존**: dark-cyan palette 유지. 과밀한 card/box 구조만 교정 | ✅ PRESERVE |
| **L7** | **난이도 피드백**: 결과 이후 optional action (D-20260619-004) | architecture에서 "optional action"으로 position | disabled/ugly textarea-like 컨트롤이 dark calm mood와 충돌 | **재설계**: 결과 화면 아래 fold의 optional compact chip rating (3개 선택지, 1-tap). 절대 textarea 아님 | ⚠️ VISUAL_DEFECT |
| **L8** | **언어 전환**: Google Play target에서도 설정 내부로 | 변경 없음 | 언어 토글이 최상단 큰 pill로 노출 | **원본 복원**: 언어는 top-right compact icon. Gameplay 중 절대 노출 금지 | ⚠️ VISUAL_DEFECT |
| **L9** | **기록/주간**: Home 아래 fold, Daily보다 조용히 | product-depth v2에서 compact week strip 추가 | 기록/주간이 Home 상단에서 Daily와 경쟁 | **원본 복원**: 기록/주간은 Home 아래 fold. 첫 viewport에는 8~12px dot indicator만 암시 | ⚠️ VISUAL_DEFECT |

### 1.2 복원 가능한 것 vs 복원 불가능한 것

#### 복원 가능 (원본 디자인 방향으로 되돌림)
- Line difficulty / sight range → 두 개의 compact custom dark popover selector (Home 아래 fold + sheet 중복 진입)
- Line family → 4개 패널만
- Home first viewport → title + mini playfield + preset summary(96px) + primary CTA
- Preset 선택 → sheet 방식, Home에는 summary만
- Custom control → 모든 native-looking control 제거
- 언어 전환 → compact icon, gameplay 중 숨김
- 기록/주간 → 아래 fold, dot indicator만

#### 복원 불가능 (이후 승인된 제품/UX 변경)
- **4 line families × 3 difficulties × 3 visibility = 36 조합**: 이미 승인된 product 방향. 4개 패널 구조는 유지하되, 각 패널이 현재 difficulty/sight 선택을 반영하는 방식으로 확장
- **Daily artifact / compact week strip**: product-depth v2에서 구현된 요소. 첫 viewport가 아닌 아래 fold에서 compact하게 유지
- **5 named presets (Intro/Easy/Standard/Hard/Expert)**: D-20260619-003 승인. preset 이름·설명은 그대로, 노출 방식만 sheet로 교정
- **Same-seed retry first reveal**: D-20260619-004 UX 계약. Result에서 "다시 도전"이 first action

---

## 2. 화면별 재설계 (A2 최종)

### 2.1 Home — "첫 시선은 오늘의 선, 설정은 점진적으로" (C1, C2 반영)

**현재 문제 분류**: ⚠️ VISUAL_DEFECT (box/card 과밀, native-looking controls, hierarchy 붕괴)

**교정된 Home 첫 viewport (360×740 기준)**:

```
┌──────────────────────────────────┐
│ ← Hidden Line              [⚙️] │  top bar: 뒤로가기 + 설정 아이콘 (언어 토글은 설정 내부)
├──────────────────────────────────┤
│                                  │
│        오늘의 숨은선              │  title (display.sm, 30px → C2 compress)
│    보이지 않는 선을 손끝으로       │  subtitle (body.sm, 13px)
│                                  │
│   ┌──────────────────────────┐   │
│   │     mini playfield       │   │  104px 높이 (C2 compress: 120→104)
│   │         ✦                │   │  start halo만, destination hint 저opacity
│   │                          │   │
│   └──────────────────────────┘   │
│                                  │
│  Intro                           │  selected preset name (14px bold, 20px)
│  처음이라면 여기서 감을 익혀요     │  1줄 description (13px body, 20px)     } 96px block
│  5개 난이도 중 · 난이도 고르기›  │  ghost chip (40px tap, 48px h)         } (C2: 52→96px)
│                                  │
│  ┌────────────────────────────┐  │
│  │   오늘의 선 시작하기   →   │  │  primary CTA (56px, cyan, full-width)
│  └────────────────────────────┘  │
│                                  │
│  ─── subtle gradient fade ───    │  below-fold hint
│  Normal ▾      Normal ▾          │  difficulty + sight selectors (closed, compact, 160px each)  ← C1 추가
│  · · ·                           │  weekly dots (8px peek)
└──────────────────────────────────┘
```

**A2 교정 규칙** (A1 대비 변경사항):
1. 첫 viewport에는 title, 104px mini playfield, **96px** preset summary, primary CTA만 노출.
2. **C1 수용**: Line difficulty / sight range selector를 Home 첫 viewport **아래 fold**에 배치 (CTA dock 바로 아래, weekly dots 직전). 각 selector는 folded/closed 상태로 약 160px 너비, 한 줄 가로 배치. Preset sheet 안에서도 동일 selector 중복 제공 (두 진입점 모두 허용).
3. **C2 수용**: Preset summary 영역을 52px → 96px로 확장. Title 36→30px, mini playfield 120→104px로 compress하여 보정.
4. Line family 패널, 기록 카드, weekly 카드, "더 많은 선택"은 모두 더 아래 fold로.
5. 360×740 기준: title(34px) + mini playfield(104px) + preset summary(96px) + CTA dock(56px) + selector row closed(48px) + weekly dot peek(8px) ≈ 346px. Weekly dots가 740px viewport 안에 충분히 노출됨.
6. 모든 버튼/칩은 token 기반 custom control. Native-looking 요소 일절 금지.

### 2.2 Difficulty & Sight Selector — "두 개의 compact dark popover, Home에서도 접근" (C1 반영)

**현재 문제 분류**: ⚠️ VISUAL_DEFECT (messy text-box/chip fragments)

**A2 교정 설계** (canonical `design-plan.md` L63-91 직접 인용 + C1 수용):

```
Home 아래 fold (CTA dock 바로 아래):
┌─ Line Difficulty ──────┐ ┌─ Sight Range ────────────┐
│  Normal           ▾    │ │  Normal            ▾     │   ← closed: 각 160px 너비
└────────────────────────┘ └───────────────────────────┘

Popover open (각각):
┌─ Line Difficulty ──────┐
│  ○ Easy                │   ← surface material과 동일, soft cyan border
│  ● Normal              │   ← selected: subtle cyan glow
│  ○ Hard                │
└────────────────────────┘

Difficulty/Sight Selector Sheet 안 (중복 진입, 동일 디자인):
┌─ Line Difficulty ──────┐ ┌─ Sight Range ────────────┐
│  Normal           ▾    │ │  Normal            ▾     │
└────────────────────────┘ └───────────────────────────┘

┌─ 선택된 조합 ───────────────────────────────────────┐
│  Main Line · Normal · Normal                         │
│  길이와 굽이가 균형 잡힌 오늘의 메인 라인입니다        │
│  [mini path preview — selected combination silhouette]│
│  curve low · visibility normal · bends medium         │
└───────────────────────────────────────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Warmup   │ │ Main     │ │ Curve    │ │Precision │   4 line-family panels
│ gentle   │ │ balanced │ │ bending  │ │ center   │   (선택된 difficulty/sight 반영)
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**A2 교정 규칙**:
1. **Line difficulty**: `easy` / `normal` / `hard` — custom dark popover selector (절대 native `<select>`나 text-box fragments 아님)
2. **Sight range**: `easy` / `normal` / `hard` — 별도 custom dark popover selector
3. 두 selector는 **절대 합치지 않는다**. Line difficulty = "선 자체의 형상 난이도", Sight range = "같은 선을 얼마나 좁게 보는가"
4. **C1 수용**: selector를 Home 아래 fold(CTA 아래, weekly dots 위)와 Preset sheet 안에 **중복 배치**. 두 진입점 모두 같은 selector 컴포넌트를 재사용
5. **즉시성 보장 (L77)**: selector 조작 시 line family 패널과 selected board summary가 같은 화면에서 즉시 업데이트
6. **Popover 열림 상태**: 주변 카드와 같은 surface material, soft cyan border, dark option rows, selected option에 subtle cyan glow
7. **Line family 4패널**: 선택된 difficulty/sight 조합에 따라 각 패널 내용 즉시 업데이트. 선택된 패널은 cyan border/glow로 강조
8. **접근성**: trigger는 `button` role, menu는 `listbox`/`option` role

### 2.3 Line Family — "4개 패널, 선택 조합 반영"

**현재 문제 분류**: ⚠️ VISUAL_DEFECT (다른 카드와 섞여 구분 불가)

**A2 교정 규칙**:
- 4개 패널만: Warmup, Main, Curve, Precision
- 각 패널은 선택된 difficulty + sight 조합을 label로 표시 (예: `Main · Normal · Normal`)
- 패널 높이: 88~96px. 충분한 tap target + 1줄 description
- 선택된 패널은 cyan border/glow, 비선택 패널은 subtle border
- **C1 반영**: Home 아래 fold의 difficulty/sight selector 변경 시 4패널이 같은 viewport에서 즉시 업데이트
- 4개 패널을 절대 12개 카드로 늘어놓지 않는다. 36개 조합은 difficulty/sight popover로 처리
- Home 아래 fold에서 세로 stack: 4 × (88px + 8px gap) = 384px. 740px viewport에서 충분함

### 2.4 Result & Feedback — "retry first, feedback optional" (C3 반영)

**현재 문제 분류**: ⚠️ VISUAL_DEFECT (disabled textarea, CTA 중복)

**A2 교정 설계** (C3 수용: sticky bar 제거, single inline CTA):

```
┌──────────────────────────────────┐
│         오늘의 선을 완주했어요     │
│          어제보다 +38             │
├─────────────┬────────────────────┤
│ 진행률 100% │ 정확도 92%         │
│ 부드러움 88 │ 차분함 90%         │
│             │ 완주도 100%        │
├──────────────────────────────────┤
│ 이번 선 돌아보기                  │
│ [path recap — 150~300px]        │  ← recap 높이 가변 (Intro 150px, Expert 300px)
│                                  │
│                                  │
│ ┌────────────────────────────┐   │
│ │      다시 도전  →          │   │  ← single inline CTA (56px, cyan)
│ │  같은 조건으로 다시 도전해요  │   │     recap 끝에 자연스럽게 위치
│ └────────────────────────────┘   │     (C3: sticky bar 제거)
│                                  │
│  홈으로     더 많은 선택          │  ← secondary text links
├──────────────────────────────────┤
│ 점수 계산 방식                    │  ← 아래 fold (progressive disclosure)
│                                  │
│ 이 난이도의 느낌은 어땠나요?      │  ← optional compact chip rating
│ ○ 너무 쉬웠다  ○ 적당했다  ○ 어려웠다 │  NOT a textarea. 3개 chip, 1-tap
└──────────────────────────────────┘
```

**A2 교정 규칙** (C3 수용):
1. **C3 수용**: sticky bar 제거. "다시 도전" CTA는 recap 하단에만 단일 배치. 화면에 1회만 등장 (중복 금지).
2. Recap이 150px 이하로 짧은 경우(Intro preset)에도 CTA가 viewport 안에서 자연스럽게 보임. 긴 경우(300px) 스크롤 후 도달. UX_FINAL §4.5 "retry first reveal" 의도에 부합.
3. Bottom safe-area를 포함한 실제 tap target: 56px 이상 확보.
4. "홈으로", "더 많은 선택" secondary action은 CTA 아래에 작은 text link로 배치.
5. 난이도 피드백은 **절대 textarea가 아니다**. 3개 chip 중 하나를 고르는 compact selector (선택형, 1-tap).
6. 피드백 chip은 결과 화면 아래 fold, 점수 계산 설명 아래.
7. 피드백은 optional. 건너뛰어도 다음 플레이에 영향 없음.
8. 피드백 문구는 dark calm mood에 맞는 muted tone ("이 난이도의 느낌은 어땠나요?").

### 2.5 Weekly / Records — "아래 fold의 compact strip"

**교정 규칙**:
- Home 첫 viewport에는 weekly dots (8~12px)만
- 스크롤 시 compact 7-day strip 노출
- "오늘의 도전", "공식 기록", "오늘 연선", "본선 시도" 등 어려운 용어는 UX copy에 맞춰 단순화

### 2.6 Preset Sheet — "5개 난이도를 sheet에서 고른다"

**A2 교정 규칙**:
- Home의 ghost chip "5개 난이도 중 · 난이도 고르기 ›" tap → bottom sheet open
- Sheet 안에 5개 preset 카드 (Intro, Easy, Standard, Hard, Expert). 각 카드: name + 1줄 description + difficulty/sight label
- Sheet 상단에 difficulty/sight popover selector 중복 배치 (C1: Home과 동일 컴포넌트 재사용)
- Preset 선택 시 sheet 닫힘 + Home summary 즉시 업데이트

### 2.7 Pixel Budget (360×740, C2 반영)

| 요소 | 높이 | 비고 |
|---|---|---|
| Top bar | 44px | 뒤로가기 + 설정 아이콘 |
| Title | 30px | display.sm, C2 compress (36→30) |
| Subtitle | 18px | body.sm, 13px + 5px margin |
| Mini playfield | 104px | C2 compress (120→104) |
| Preset summary | 96px | C2 확장 (52→96): name 20px + desc 20px + ghost chip 48px + gap 8px |
| Primary CTA | 56px | full-width cyan |
| Selector row (closed) | 48px | C1 추가: difficulty + sight popovers, 각 160px |
| Fade hint | 12px | gradient + spacing |
| Weekly dots | 8px | below-fold peek |
| **상단 합계** | **~416px** | 740px 내 충분한 여유 (324px 남음) |

---

## 3. 컴포넌트 규칙 (Component Rules)

### 3.1 Primary CTA

- **레이블**: "오늘의 선 시작하기" (한글 9자, 16px semi-bold)
- **크기**: 56px 높이, full-width (좌우 16px margin), border-radius 12px
- **색상**: 배경 `#00C8E0` (cyan-primary), 텍스트 `#0E1318` (dark-bg)
- **상태**: default (cyan fill), pressed (cyan 80% scale 0.98), disabled (muted gray `#3A444C`, 텍스트 `#6B7680`), loading (cyan + subtle pulse, label "준비 중…")
- **배치**: Home 첫 viewport 하단. preset summary 바로 아래. `env(safe-area-inset-bottom)` 적용
- **접근성**: `button` role, focus ring 3px cyan, contrast ratio AA 이상 (cyan `#00C8E0` on dark `#0E1318` = ~7.2:1)

### 3.2 Custom Difficulty Popover

- **Trigger (closed)**: 48px 높이, 160px 너비 (C1: 가로 한 줄 배치용). 레이블 + selected value + chevron `▾`. 배경 `#1A2128`, border `#2A333D`, 텍스트 `#B0C4D8`
- **Menu (open)**: same surface `#1A2128`, soft cyan border `#00C8E0` 1px, 각 option 44px 높이, padding 12px 16px
- **Option states**: default (dark), hover/focus (cyan subtle glow `rgba(0,200,224,0.08)`), selected (cyan glow + checkmark `#00C8E0`)
- **Options**: `Easy`, `Normal`, `Hard` (한글: 쉬움, 보통, 어려움)
- **Behavior**: tap option → menu close + line family/summary 즉시 업데이트 (C1: L77 준수)
- **배치**: Home: CTA 아래, weekly dots 위. Preset sheet: 상단. 두 위치 모두 동일 컴포넌트 재사용
- **접근성**: trigger `button` role, menu `listbox` role, option `option` role. `aria-expanded`, `aria-selected` 적용

### 3.3 Custom Sight Popover

- Difficulty popover와 동일한 구조·크기·재질 규칙 적용
- **Options**: `Easy`, `Normal`, `Hard` (한글: 넓게, 보통, 좁게)
- **레이블**: "Sight" (한글: "시야")
- Difficulty popover 오른쪽에 나란히 배치 (160px + 8px gap + 160px = 328px, 360px 폭에서 수용 가능)

### 3.4 Four Line-Family Panels

- **카드 구조**: 4개 vertical stack, 각 88px 높이, 8px gap. 총 376px
- **카드 구성**: 왼쪽 mini path icon (40×40), 중앙 name + difficulty/sight label + 1줄 description, 오른쪽 chevron 또는 선택 표시
- **선택 상태**: cyan border 2px + cyan glow bg `rgba(0,200,224,0.06)`
- **비선택 상태**: subtle border `#2A333D` 1px
- **패널 종류**: Warmup (gentle), Main (balanced), Curve (bending), Precision (center)
- **업데이트**: difficulty/sight popover 변경 시 4패널 label 즉시 리렌더 (C1)
- **배치**: Home 아래 fold. Difficulty/sight selector row 바로 아래

### 3.5 Preset Ghost Chip & Sheet

- **Ghost chip (Home)**: `5개 난이도 중 · 난이도 고르기 ›` — 40px 높이, transparent bg, border `#3A444C` 1px dashed, 텍스트 `#6B7680`. Preset summary block 안에 배치 (C2: 96px block)
- **Sheet trigger**: ghost chip tap → bottom sheet (80vh 높이, rounded top 16px, `#0E1318` bg)
- **Sheet 내용**: 상단 difficulty/sight popover row (C1 재사용) + 5개 preset 카드 (각 72px 높이, 현재 선택된 preset cyan 강조)
- **Preset 카드**: name (14px semi-bold) + description (13px body) + difficulty/sight hint (12px muted)
- **선택 동작**: preset tap → sheet 닫힘 + Home preset summary 즉시 업데이트 + line family 패널 업데이트

### 3.6 Result: Next-Attempt Guidance (C3 반영)

- **Recap 영역**: score stats (2열 grid: 진행률, 정확도, 부드러움, 차분함, 완주도) + path recap visualization
- **Primary CTA**: `다시 도전 →` (single, 56px cyan, full-width). Recap 하단에만 배치 (C3: sticky bar 제거)
- **Subtitle**: "같은 조건으로 다시 도전해 보세요" (13px body, CTA 바로 위 1줄)
- **Secondary actions**: `홈으로` + `더 많은 선택` → CTA 아래 작은 text links, 44px 높이, 14px, `#6B7680`
- **CTA 중복 방지 (C3)**: "다시 도전"이 화면에 단 1회만 등장. Recap이 짧을 때(150px)도 단일 CTA가 viewport 안에 자연스럽게 노출
- **Bottom safe-area**: CTA에 `env(safe-area-inset-bottom)` 포함. 실질 tap target 56px 이상

### 3.7 Feedback Form Replacement

- **기존 문제**: disabled textarea-like 컨트롤 → **완전 제거**
- **대체**: 3개 compact chip rating (너무 쉬웠다 / 적당했다 / 어려웠다)
- **배치**: Result 화면 가장 아래 fold, 점수 계산 설명 아래
- **Chip 디자인**: 48px 높이, rounded 24px, border `#2A333D` 1px, 텍스트 14px `#B0C4D8`. 선택 시 cyan border + subtle fill
- **동작**: 1-tap 선택. 선택 즉시 subtle checkmark + "피드백 감사합니다" 2초 toast 후 chip 그룹 disabled
- **Optional**: 건너뛰기 가능. 피드백 미제출 시 다음 플레이에 영향 없음
- **접근성**: `radiogroup` role, 각 chip `radio` role

### 3.8 Record/Weekly Collapse & Placement

- **Weekly dots (Home 첫 viewport)**: 8px 원형 dot × 7개, 가로 배치. 오늘 dot은 cyan `#00C8E0`, 과거 dot은 `#2A333D`, 미래 dot은 표시 안 함
- **Weekly strip (scroll)**: compact 7-day cell. 각 cell: 요일(12px), dot indicator, 요약 점수 또는 아이콘
- **배치**: Home 가장 아래 fold. CTA → selector row → line family → weekly strip 순서

---

## 4. 모바일 기준 & 접근성

| 항목 | 기준 |
|---|---|
| **최소 폭** | 360px (CSS 기준). 390px, 430px에서도 레이아웃 붕괴 없어야 함 |
| **한글 복사 길이** | 버튼 라벨 9자 이내 (CTA "오늘의 선 시작하기"는 예외 허용), 설명 25자 이내. 영어는 더 길 수 있으므로 card description 2줄까지 허용 |
| **Safe area** | bottom CTA, popover, sheet에 `env(safe-area-inset-*)` 적용 |
| **Tap target** | primary 56px, secondary 52px, icon 44px, chip 40px, preset card 72px, popover option 44px |
| **Color contrast** | 모든 text/background pair AA 이상 (dark bg `#0E1318` / text `#B0C4D8` ≈ 8.5:1, cyan CTA ≈ 7.2:1) |
| **Reduced motion** | `prefers-reduced-motion` 시 glow pulse, reveal animation, CTA pulse → static 대체 |
| **Focus visible** | 3px cyan ring (`#00C8E0`) + active border |
| **Status 신호** | color + icon + label 병행 (color alone 금지). 예: 실패 = coral border + ✕ icon + "이탈" label |
| **Popover 접근성** | trigger: `button` role, menu: `listbox`/`option` role, `aria-expanded`, `aria-selected` |
| **iOS safe-area** | 34px (iPhone X+) bottom inset 고려. CTA tap target이 safe-area 위에 확보되어야 함 |
| **Overscroll** | C3 반영: sticky positioning 미사용으로 iOS Safari overscroll bounce 시 CTA 흔들림 방지 |

---

## 5. 구현 handoff 경계 (design requirements only)

아래는 디자인 요구사항이며, 코드 구현 지시가 아니다. 구현자는 이 요구사항을 해석해 구현한다.

| # | 디자인 요구 | handoff 근거 |
|---|---|---|
| H1 | Popover 컴포넌트는 browser native `<select>`를 대체하는 custom 구현이어야 함 | `design-plan.md` L81-91, A2 §3.2/3.3 |
| H2 | Difficulty/Sight popover는 Home과 Preset Sheet에서 동일 컴포넌트를 공유 | C1, A2 §2.2 |
| H3 | Popover option 선택 시 line family 4패널과 preset summary가 같은 viewport에서 즉시 리렌더 | `design-plan.md` L77, C1 |
| H4 | Result 화면 CTA는 sticky positioning을 사용하지 않고 inline으로만 배치 | C3, A2 §3.6 |
| H5 | 난이도 피드백은 `<textarea>`를 사용하지 않고 chip `radiogroup`으로 구현 | `design-plan.md` L84-91, A2 §3.7 |
| H6 | 모든 color 값은 token 기반. CSS에서 직접 hex 사용 금지 | `design-plan.md` §1 color system |
| H7 | 언어 전환 컨트롤은 Settings sheet 내부에만 배치. Home/Play/Result 화면에서 직접 노출 금지 | A2 §1.1 L8 |
| H8 | Weekly dot peek(8px)은 360×740 viewport 바닥에서 최소 4px 이상 보여야 함 | C2 pixel budget, A2 §2.7 |
| H9 | Safe-area inset은 `env(safe-area-inset-bottom)`과 fallback `24px` 모두 적용 | A2 §4 |
| H10 | Preset sheet는 80vh 최대 높이, 그 이상 스크롤. Sheet 외부 tap 시 dismiss | A2 §3.5 |

---

## 6. Screenshot QA Checklist

미래 dev/QA가 스크린샷으로 검증할 항목:

### 6.1 Viewport/해상도

| # | 체크 항목 | 기준 |
|---|---|---|
| Q1 | 360×740 (Galaxy S8급)에서 Home 첫 viewport에 title + mini playfield + preset summary + CTA + selector row + weekly dots가 모두 보이는가 | weekly dots 최소 4px 이상 노출 |
| Q2 | 390×844 (iPhone 14급)에서 모든 요소가 추가 여백으로 자연스럽게 확장되는가 | 좌우 margin 16px → 20px 확장, 카드 비율 유지 |
| Q3 | 430×932 (iPhone 15 Pro Max급)에서 요소가 과도하게 늘어나지 않고 max-width 제한이 적용되는가 | primary CTA max-width 480px, 중앙 정렬 |

### 6.2 언어 오버플로우

| # | 체크 항목 | 기준 |
|---|---|---|
| Q4 | 한글: CTA "오늘의 선 시작하기"가 360px에서 잘리지 않고 1줄로 보이는가 | 16px semi-bold, 360px − 32px margin = 328px 내 수용 |
| Q5 | 한글: Preset description "처음이라면 여기서 감을 익혀요" (16자)가 1줄로 wrapping 없이 보이는가 | 13px body, 약 200px width로 1줄 가능 |
| Q6 | 영어: Preset description "Start here to get a feel for the tracing" (42자)가 2줄 이내로 wrapping되는가 | 13px body, 2줄까지 허용. 3줄 이상이면 줄바꿈 또는 text truncation |
| Q7 | 영어: CTA "Start Today's Line" (18자)가 360px에서 1줄로 보이는가 | 16px semi-bold |
| Q8 | 한글/영어 전환 시 모든 UI copy가 i18n locale을 통해 교체되는가 (하드코딩 금지) | AGENTS.md i18n rule |

### 6.3 Safe area / Native control

| # | 체크 항목 | 기준 |
|---|---|---|
| Q9 | iPhone X+에서 bottom CTA가 safe-area(34px) 아래로 침범하지 않는가 | CTA가 `env(safe-area-inset-bottom)` 위에 온전히 노출 |
| Q10 | Home/Play/Result 모든 화면에서 native browser `<select>`, `<input>`, `<textarea>`가 단 한 개도 보이지 않는가 | 모든 control이 token 기반 custom |
| Q11 | Difficulty/Sight popover가 OS 기본 스타일(흰색 배경, 파란 highlight)을 전혀 보이지 않는가 | dark surface `#1A2128` + cyan accent만 |

### 6.4 카드 과밀

| # | 체크 항목 | 기준 |
|---|---|---|
| Q12 | Home 첫 viewport(스크롤 없이)에 보이는 card/box가 5개 이하인가 | title, mini playfield, preset summary, CTA, selector row (각각 1개 블록) |
| Q13 | Line family 패널은 정확히 4개만 보이는가 (12개 card 아님) | Warmup, Main, Curve, Precision |
| Q14 | "더 많은 선택", "오늘의 도전", "공식 기록" 등의 secondary card가 첫 viewport에서 보이지 않는가 | 모두 아래 fold |

### 6.5 Result 화면

| # | 체크 항목 | 기준 |
|---|---|---|
| Q15 | "다시 도전" CTA가 Result 화면에서 1회만 등장하는가 (sticky bar 없음) | C3: single inline CTA |
| Q16 | Recap이 150px로 짧을 때 CTA가 스크롤 없이 viewport 안에 보이는가 | Intro preset 기준 |
| Q17 | 난이도 피드백이 textarea가 아닌 3개 chip (radiogroup)으로 표시되는가 | "너무 쉬웠다 / 적당했다 / 어려웠다" |
| Q18 | 난이도 피드백이 Result 화면 가장 아래에 위치하고, 첫 viewport에서는 보이지 않는가 | 아래 fold, optional |

---

## 7. 제외 범위

- 제품 코드 수정
- Product/UX flow 변경
- 12 public levels 또는 player-facing 0-100 promise 확정
- 광고/IAP/reward/login/backend ranking 설계 또는 구현
- 실제 Apps in Toss SDK, Google Play Billing, AdMob, Toss login 연결
- 출시 승인, QA/Release 승인, store upload readiness 판정

---

## 8. 미해결 가정

- Owner 스크린샷을 직접 분석하지 못했으나, CEO triage 코멘트와 `D-20260620-011`의 기술된 문제를 기반으로 회귀 분류 수행
- 실제 기기에서의 finger occlusion, viewport, safe-area inset은 구현 후 실기기 QA로만 확정 가능
- Popover selector가 160px 너비로 360px 폭에서 가로 배치 가능한지는 실제 구현 시 폰트 렌더링에 따라 ±8px 편차 가능 (C1 권장안 160px → 필요 시 152px로 compress)
- Weekly dot peek(8px)이 실제 기기에서 시각적으로 보이는지 여부는 notch/punch-hole 영역 + safe-area 조합에 따라 달라질 수 있음

---

## 9. knowledge_candidates

- **maturity**: candidate
  **summary**: "box/card 과밀" 회귀는 시각 디자인 단계에서 화면당 primary action을 하나로 제한하고 나머지를 progressive disclosure로 보내면 예방할 수 있다. Home에 CTA, preset, line family, 기록, weekly, more choices가 동시에 보이면 first value가 buried 된다.
  **evidence_path**: `ai/plans/design-plan.md` L29-38, `stages/15_UI_DESIGN.md` §2.3
  **suggested_owner_file**: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/design-preflight.md`

- **maturity**: candidate
  **summary**: Custom dark popover selector 규칙이 canonical design plan에 명시되어 있어도, 구현 단계에서 CSS 누락이나 컴포넌트 부재로 인해 native-looking controls로 회귀할 수 있다. Visual QA 시 JSX class-reference audit + CSS definition audit을 필수로 포함해야 한다.
  **evidence_path**: `ai/plans/design-plan.md` L81-91, `stages/15_UI_DESIGN.md` §2.1
  **suggested_owner_file**: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/design-preflight.md`

- **maturity**: candidate
  **summary**: 난이도 피드백은 결과 수용 뒤의 optional action이다. 첫 흐름에서 textarea로 노출하면 dark calm mood를 깨고, 사용자에게 "필수 입력"이라는 압박을 준다. compact chip rating (3~5개 선택지, 1-tap)이 더 적합하다.
  **evidence_path**: `01_DECISIONS.md` D-20260619-004, Owner 두 번째 스크린샷 triage
  **suggested_owner_file**: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/design-preflight.md`

- **maturity**: candidate
  **summary**: "compact control을 sheet 안으로 숨기는 결정"은 progressive disclosure처럼 보이지만, canonical design-plan.md가 해당 control을 Home-level 즉시 업데이트 요소로 명시한 경우, D-20260620-011의 "원본 디자인으로 돌아가라"는 복원 지시와 충돌할 수 있다. Visual restart 시 canonical design-plan.md의 selector 배치 규칙을 sheet 배치보다 우선한다.
  **evidence_path**: `stages/16_VISUAL_RESTART_PLAN.md` §2.1 (A1→A2 교정), `ai/plans/design-plan.md` L67-77, `stages/reviews/t_0fb4cddd-ui-restart-layout-challenge.md` C1
  **suggested_owner_file**: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/design-preflight.md`

- **maturity**: candidate
  **summary**: 모바일 Result 화면에서 sticky CTA bar는 "first reveal" UX 의도를 흐릴 수 있다. 사용자가 recap을 보기도 전에 retry 버튼을 먼저 인지하면, 결과 수용 → 재도전이라는 자연스러운 흐름이 깨진다. recap 끝 inline CTA 단일 배치가 더 적합하다. 특히 recap이 짧을 때 sticky bar + inline CTA 중복은 치명적이다.
  **evidence_path**: `stages/10_UX_FINAL.md` §4.5, `stages/reviews/t_0fb4cddd-ui-restart-layout-challenge.md` C3
  **suggested_owner_file**: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/design-preflight.md`
