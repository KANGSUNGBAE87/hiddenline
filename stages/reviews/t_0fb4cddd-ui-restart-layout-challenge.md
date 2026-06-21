# [CHALLENGE] Hidden Line Visual/UI Restart B — Layout/Component Review

- reviewer: ui-layout-designer
- task_id: t_0fb4cddd
- parent_task: t_43c1e3f6 (Visual restart A1)
- reviewed_artifact: stages/16_VISUAL_RESTART_PLAN.md
- verdict: PASS_WITH_CHANGES

## 근거 요약

A1은 "박스만 잔뜩" 회귀를 9개 계보 항목으로 분류하고, visual 방향을 design-plan.md 토대로 복원하려는 올바른 진단을 했다. dark-cyan palette 보존(L6), 4패널 line family 복원(L2), textarea→chip rating 재설계(L7), native control 금지(L5)는 정확하다. 그러나 아래 3개 배치 결정은 원본 디자인 의도와 모바일 공간 제약에서 충돌한다.

---

## CHALLENGE 1 — Difficulty/Sight selector가 Home에서 사라진 결정

### 문제

A1 §2.1 교정 규칙 2: "Line difficulty / sight range 선택기는 Home 첫 viewport에서 **보이지 않는다**. Preset sheet 안에서만 접근한다."

### 사용자 영향

- canonical `design-plan.md` v0.4 L67-69은 difficulty와 sight range를 Home에서 직접 조작 가능한 **compact dropdown-style control**로 명시했다.
- L77: "The selected board summary should update immediately when either dropdown changes." — 즉시성은 selector가 같은 화면에 있을 때만 실현된다.
- Preset sheet 안으로 숨기면 사용자는 difficulty/sight 조합을 바꾸기 위해 항상 **2-depth** (sheet 열기 → selector 조작 → sheet 닫기)를 거쳐야 한다.
- design-plan.md L22-26: Home은 첫 viewport에서 "What is today's action?", "How do I play?", "How is my score measured?"를 답해야 한다. "How do I play?"의 일부로 difficulty/sight 설정이 한눈에 보여야 한다.
- D-20260620-011의 "원본 디자인 방향으로 돌아가라"는 취지와 충돌한다.

### 권장 대안

Home 첫 viewport 아래 fold(CTA dock 바로 위, weekly dots 영역 직전)에 두 개의 compact popover selector를 한 줄로 배치한다. 360px 폭에서 각 selector를 약 160px 너비로 구성하면 가로 배치가 가능하다. Preset sheet 안에서도 동일 selector를 중복 제공하여 두 진입점 모두 허용한다.

### 수정 기준

- difficulty/sight selector가 Home에서 최소한 folded/closed 상태로 보여야 한다 (원본 design-plan.md L67-77 준수).
- selector 조작 시 line family 패널과 selected board summary가 즉시 업데이트되어야 한다 (L77).

---

## CHALLENGE 2 — Preset summary 영역 52px 공간 부족

### 문제

A1 §2.1의 Home 첫 viewport 계산: preset summary(52px) 영역에 preset name + 1줄 description + ghost chip이 배치된다. 52px는 모바일에서 이 3개 요소를 담기에 충분하지 않다.

### 사용자 영향

- "Intro" (preset name, 14px bold) + "처음이라면 여기서 감을 익혀요" (description, 13px body) + "5개 난이도 중 · 난이도 고르기 ›" (ghost chip, 40px tap target)을 52px 안에 넣으려면 line-height를 16px 이하로 압축해야 한다.
- description "처음이라면 여기서 감을 익혀요" (16자, 한글)는 360px 폭에서 13px 폰트 기준 약 200px 너비를 사용하므로 1줄로는 들어가지만, 영어 "Start here to get a feel for the tracing" (42자)는 3줄 이상이 필요하다.
- ghost chip은 최소 40px tap target을 요구하므로 상하 패딩 포함 약 44~48px을 소비한다.
- **실측 추정**: preset name(20px) + description(20px, 1줄) + ghost chip(48px) + 간격(8px) = 최소 96px. 52px 대비 44px 부족.
- 이 초과분이 누적되면 weekly dot peek(8~12px)가 360×740 viewport에서 완전히 밀려나거나, CTA dock이 preset summary 위로 올라와 겹친다.

### 권장 대안

preset summary 영역 높이를 88~96px로 확장하고, title(36→28px)과 mini playfield(120→104px)를 compress하여 총합을 보정한다. 또는 ghost chip을 preset name 오른쪽에 inline 배치해 수직 공간을 1행 절약한다.

### 수정 기준

- 360×740 viewport에서 title + mini playfield + preset summary + CTA dock + weekly dot peek(8px 이상)이 모두 노출되어야 한다.
- 한글/영어 모두 description이 2줄 이내로 wrapping되어야 한다.

---

## CHALLENGE 3 — Result sticky bar와 inline CTA의 중복 노출

### 문제

A1 §2.4: "44px slim sticky glass bar"가 recap scroll 중 "다시 도전 →"을 유지하고, recap 끝에서는 "full inline CTA"로 확장된다. 이 구조는 recap이 짧을 때 두 CTA가 동시에 보이는 중복과, sticky bar의 glass 재질 가독성 문제를 일으킨다.

### 사용자 영향

- recap 경로가 단순한 직선인 경우(예: Intro preset), recap 높이가 150px에 불과해 sticky bar와 inline CTA가 동시에 한 화면에 노출된다.
- UX_FINAL §4.5: same-seed retry를 "first reveal"로 우선 노출하라고 명시했다. sticky bar가 항상 보이면 사용자는 recap을 보기도 전에 retry 버튼을 먼저 인지하게 되어 first reveal 의도가 흐려진다.
- 44px glass bar는 반투명 재질 특성상 아래 콘텐츠(점수, path recap)가 비쳐서 가독성이 저하될 수 있다.
- iOS Safari의 overscroll bounce 발생 시 sticky positioning이 흔들리며, bottom safe-area(34px, iPhone X+)와 겹치면 실질 tap 영역이 44px보다 좁아진다.

### 권장 대안

sticky bar를 제거하고, recap 하단에만 single inline CTA를 배치한다. recap이 짧을 때는 CTA가 자연스럽게 viewport 안에 들어오고, 길 때는 스크롤 후 도달한다. "홈으로" secondary action은 CTA 아래에 작은 text link로 둔다. UX_FINAL의 "retry first reveal" 의도에 더 부합한다.

### 수정 기준

- "다시 도전" CTA가 화면에 단 1회만 등장해야 한다 (중복 금지).
- recap이 150px 이하로 짧은 경우에도 CTA가 viewport 안에서 보여야 한다.
- bottom safe-area를 포함한 실제 tap target이 56px 이상 확보되어야 한다.

---

## 기타 확인 사항 (blocker 아님)

| 항목 | 상태 |
|---|---|
| Home 360×740 weekly dot peek 시인성 (288px 상단 + 452px 여유 → 충분) | OK |
| Line family 4패널 세로 배치 (88×4+간격≈400px, 740px 내 수용 가능) | OK |
| 390px/430px 확장 시 safe-area·card 비율 | OK (360px 기준이 가장 빡빡) |
| 언어 토글 pill → compact icon 변경 | OK (A1 §1.2 L8) |
| 한글 버튼 라벨 "오늘의 선 시작하기" 9자 → 6자 초과이나 CTA로서 수용 가능 | OK |

## knowledge_candidates

- **maturity**: candidate
  **summary**: "compact control을 sheet 안으로 숨기는 결정"은 progressive disclosure처럼 보이지만, 원본 디자인 의도가 "즉시 업데이트되는 dropdown-style control"이었을 경우, D-20260620-011의 "원본 디자인으로 돌아가라"는 복원 지시와 충돌할 수 있다. Visual restart 시에는 canonical design-plan.md의 selector 배치 규칙을 sheet 배치보다 우선한다.
  **evidence_path**: stages/16_VISUAL_RESTART_PLAN.md §2.1, ai/plans/design-plan.md L67-77
  **suggested_owner_file**: /Users/kangsungbae/Documents/지식저장소/docs/workflows/design-preflight.md
