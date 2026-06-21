# [PROPOSAL] 03_PRODUCT_PLANNING.md — Hidden Line Product Planning A1

- created_at: 2026-06-20 KST
- phase: Product Planning / A1 proposal
- author: product-planner
- status: proposal
- input_brief: 00_PROJECT_BRIEF.md
- research_approval_decision_id: D-20260619-002
- approved_market_research: stages/05_MARKET_RESEARCH.md v1.1.0
- scope_note: 이 문서는 출시 전 검증 가능한 Hidden Line의 첫 제품 계획을 고정한다. Owner 승인 전 구현 착수, UX 확정, Architecture 확정, 실제 수익화 설계, 스토어 출시 확정을 승인하지 않는다.

## 1. Planning frame

### 1.1 Fixed inputs
- Owner의 최우선 요구는 `난이도에 맞게 선을 잘 그리는 것`이며, 길이·구불거림·겹침이 실제 체감 난이도와 연결되어야 한다. [owner_constraint: 00_PROJECT_BRIEF.md]
- 승인된 시장 근거의 기본 판정은 `VALIDATE_FIRST`이고, Product Planning은 `경로 A(단일축)`와 `경로 B(다축 유지)`를 병행 설계한 뒤 Owner 결정 후 수렴해야 한다. [owner_constraint: 01_DECISIONS.md D-20260619-002]
- 현재 구현은 이미 `다축 난이도 시스템`이며, Daily Pack의 12개는 단일 12단계가 아니라 4 line type × 3 line difficulty variant다. [evidence_id: SRC-02; evidence_id: SRC-03; evidence_id: SRC-04; evidence_id: SRC-05; evidence_id: SRC-06; evidence_id: SRC-08]
- 현재 핵심 리스크는 `급격한 꺾임 체감`, `겹침 정책 불일치`, `0-100 스케일 부재`, `점수 스펙 불일치`, `실기기 QA 부재`다. [evidence_id: SRC-14; evidence_id: SRC-17; evidence_id: SRC-18; evidence_id: SRC-22; evidence_id: SRC-26; evidence_id: SRC-31]
- 수익화는 지금 설계하지 않는다. 현재 계획에서 허용되는 것은 `정책 적합성 상한`을 정의하는 것뿐이며, 실제 광고/IAP/보상 설계는 P3+ 이후로 미룬다. [owner_constraint: D-20260619-002 scope_impact; evidence_id: SRC-37; evidence_id: SRC-39; evidence_id: SRC-41; evidence_id: SRC-42; evidence_id: SRC-43]

### 1.2 Explicit constraints from missing owner inputs
- 승인 입력에는 명시적 예산과 일정이 없다. 따라서 첫 검증은 `저비용`, `짧은 루프`, `실기기 체감 확인 중심`으로 설계한다. [owner_constraint: 00_PROJECT_BRIEF.md]
- Owner는 `겹침 허용 범위`, `0-100 최소 20의 의미`, `단일축 vs 다축 유지`를 아직 최종 결정하지 않았다. 따라서 이 문서는 두 경로를 모두 설계하되 어느 한쪽으로 commit하지 않는다. [owner_constraint: 00_PROJECT_BRIEF.md; owner_constraint: D-20260619-002 remaining_risks]
- 게임형 앱이므로 첫 검증은 Google Play 호환 Android 실기기 기준으로 잡고, Apps in Toss는 호환성과 정책 경계만 유지한다. [owner_constraint: AGENTS.md; evidence_id: SRC-43; evidence_id: SRC-45]

## 2. One-sentence product definition

### 2.1 Primary target
1차 타깃은 출퇴근·대기·취침 전의 1~3분 빈 시간에 `운보다 손 감각`으로 승부가 나는 짧은 정밀 추적 도전을 반복하고 싶은 모바일 퍼즐/리듬 친화 플레이어다. 대형 메타게임, 장시간 세션, 스토리 중심 유저는 첫 타깃이 아니다. [evidence_id: SRC-32; evidence_id: SRC-35; owner_constraint: 00_PROJECT_BRIEF.md]

### 2.2 Trigger moment
사용자는 `짧게 한 판 집중하고 싶다`는 순간, 설명이나 가입 없이 오늘의 공정한 선 하나를 바로 따라가 보고 싶을 때 앱을 연다. [evidence_id: SRC-32; evidence_id: SRC-37]

### 2.3 JTBD
사용자가 짧은 빈 시간에 보이지 않는 곡선을 손끝으로 따라가며, 이번 시도가 공정한 조건이었는지와 어제보다 나아졌는지를 즉시 알 수 있게 해달라. [evidence_id: SRC-29; evidence_id: SRC-30; evidence_id: SRC-32]

### 2.4 Core problem
현재 구현은 숨은 선 추적이라는 차별적 감각은 있으나, 난이도 축 설명·곡선 부드러움·겹침 정책·점수 기준이 한 문장으로 이해되지 않아 `실패가 실력 때문인지 생성 규칙 때문인지` 읽기 어렵다. [evidence_id: SRC-08; evidence_id: SRC-17; evidence_id: SRC-22; evidence_id: SRC-26; evidence_id: SRC-31]

### 2.5 One-line product definition
Hidden Line은 `많은 기능을 붙이는 게임`이 아니라 `공정한 seed와 읽을 수 있는 난이도로 손 감각 향상을 확인하는 숨은 선 정밀 추적 게임`이다. [evidence_id: SRC-32; evidence_id: SRC-45]

## 3. Value proposition and positioning

### 3.1 Value proposition
우리의 가치는 광고/보상 루프가 아니라 `숨은 곡선을 따라가는 감각`을 공정한 seed와 읽을 수 있는 난이도 체계로 반복 가능하게 만드는 데 있다. [evidence_id: SRC-32; evidence_id: SRC-35; evidence_id: SRC-45]

### 3.2 Against adjacent alternatives
- 한붓그리기 퍼즐 대비: Hidden Line은 정답 경로를 찾는 퍼즐이 아니라 `보이지 않는 선을 그대로 따라가는 손 감각`이 핵심이다. [approved_artifact: stages/05_MARKET_RESEARCH.md Section G]
- 리듬/정밀조작 게임 대비: Hidden Line은 음악 타이밍 대신 `spotlight reveal + 숨은 경로 추적`으로 차별화된다. [approved_artifact: stages/05_MARKET_RESEARCH.md Section G]
- 일반 캐주얼 실패반복 게임 대비: Hidden Line은 deterministic daily seed 덕분에 `오늘의 공정한 비교`를 만들 수 있다. [evidence_id: SRC-32]

### 3.3 Positioning sentence
`짧게 열어도 공정하고, 실패해도 왜 어려웠는지 읽히는 숨은 선 정밀 추적 게임.` [evidence_id: SRC-29; evidence_id: SRC-32]

## 4. First validation platform

### 4.1 Platform choice
첫 검증 플랫폼은 `Google Play 호환 Android 실기기 빌드(내부/폐쇄 테스트 수준)`다. 이것은 공개 출시 결정이 아니라 `touch feel, curve smoothness, overlap perception`을 실제 손가락 조건에서 검증하기 위한 첫 채널이다. [owner_constraint: AGENTS.md; owner_constraint: 00_PROJECT_BRIEF.md; evidence_id: SRC-43]

### 4.2 Why this platform first
1. Hidden Line의 가장 큰 미해결 리스크는 스토어 listing보다 `실기기에서 선이 얼마나 급격하게 느껴지는가`다. [evidence_id: SRC-15; evidence_id: SRC-17; evidence_id: SRC-18]
2. 게임형 앱의 첫 공개 순서는 Google Play 우선이 기본이며, Apps in Toss는 호환/정책 경계를 유지하면 된다. [owner_constraint: AGENTS.md; owner_constraint: /Users/kangsungbae/Documents/지식저장소/docs/workflows/app-platform-standard.md]
3. Apps in Toss를 첫 검증 채널로 잡으면 광고·포인트·사업자·배포 정책 검토가 먼저 붙어 범위가 넓어진다. 지금 필요한 것은 수익화가 아니라 touch QA다. [evidence_id: SRC-41; evidence_id: SRC-42; evidence_id: SRC-43]
4. 현재 빌드는 광고/IAP/login/backend ranking이 없어서 정책 리스크가 낮고, touch feel 검증에 집중하기 좋다. [evidence_id: SRC-37; evidence_id: SRC-45]

## 5. First value, core loop, and MVP scope

### 5.1 First value
첫 가치는 플레이어가 warmup 또는 main 선 하나를 끝내고 `이 게임은 손 감각으로 다시 해볼 만하다`는 느낌과 `왜 이 선이 쉬웠는지/어려웠는지`를 동시에 얻는 순간이다. [evidence_id: SRC-29; evidence_id: SRC-32]

### 5.2 Core loop
1. 앱을 열고 오늘의 board 또는 warmup으로 바로 진입한다. [evidence_id: SRC-32]
2. 숨은 곡선을 spotlight 안에서 따라간다. [owner_constraint: 00_PROJECT_BRIEF.md]
3. 성공/실패 후 결과 화면에서 score 또는 실패 이유와 local best를 본다. [evidence_id: SRC-29; evidence_id: SRC-30]
4. 같은 조건으로 즉시 재도전하거나, practice difficulty를 바꿔 체감 차이를 확인한다. [evidence_id: SRC-32; evidence_id: SRC-35]
5. 다음 날 deterministic seed와 local record를 이유로 다시 연다. [evidence_id: SRC-32; evidence_id: SRC-35]

### 5.3 MVP must-have

| must-have | why required now | linked hypothesis / operational need | evidence / constraint | acceptance signal |
| --- | --- | --- | --- | --- |
| warmup floor line | `최소 20`이 실제로 어떤 체감인지 보여줄 첫 진입점이 필요하다 | onboarding floor 검증 | owner_constraint: 00_PROJECT_BRIEF.md; evidence_id: SRC-28 | 첫 플레이 성공/근접 실패 데이터를 볼 수 있다 |
| official main line with deterministic seed | 오늘의 공정한 비교 기준이 필요하다 | fairness hypothesis | evidence_id: SRC-32 | 같은 날 같은 선이 재현된다 |
| practice difficulty surface | Path A/B 어느 쪽이든 난이도 체감 비교는 practice에서 시작해야 한다 | difficulty comprehension 검증 | evidence_id: SRC-08; owner_constraint: D-20260619-002 | 난이도 선택 후 성공/실패 차이를 측정 가능 |
| result screen with official/unofficial split | 점수 불일치와 실패 데이터 혼선을 줄여야 한다 | scoring clarity | evidence_id: SRC-29; evidence_id: SRC-30; evidence_id: SRC-31 | official score와 practice feedback이 분리 노출된다 |
| local best/history | push 없이도 `어제보다 나아졌는가`를 보여줄 최소 retention hook이 필요하다 | daily reopen hypothesis | evidence_id: SRC-32; evidence_id: SRC-35 | local improvement 확인 가능 |
| analytics events for feel and failure | VALIDATE_FIRST를 실제로 운영하려면 체감/실패 데이터를 남겨야 한다 | QA and stop-rule operation | owner_constraint: D-20260619-002 accepted_scope | 이벤트 누락 없이 cohort 판정 가능 |

### 5.4 Explicit non-goals in MVP
- 광고 placement, IAP 상품, 재화 경제, Toss points reward 설계는 하지 않는다. [owner_constraint: D-20260619-002 scope_impact; evidence_id: SRC-39; evidence_id: SRC-41]
- push notification, streak, comeback reward는 첫 retention surface가 아니다. [evidence_id: SRC-35]
- 서버 리더보드, 로그인, 백엔드 ranking은 첫 난이도 검증 범위가 아니다. [evidence_id: SRC-37]
- 공개 스토어 확장, Apps in Toss release execution, 정책 재심사 대응은 이번 단계 범위가 아니다. [owner_constraint: AGENTS.md]

## 6. Parallel difficulty-system design

### 6.1 Shared principles for both paths
- Owner가 말한 `길수록·구불수록·많이 겹칠수록 어렵다`는 신호는 유지하되, 실제 표시는 `읽을 수 있는 규칙`이어야 한다. [owner_constraint: 00_PROJECT_BRIEF.md]
- 내부 구현은 다축 파라미터를 유지한다. 바뀌는 것은 `사용자에게 무엇을 한 줄로 보여줄지`와 `공식 비교를 어떻게 고정할지`다. [evidence_id: SRC-08; owner_constraint: D-20260619-002]
- `최소 20`은 절대값이라기보다 onboarding floor를 뜻한다. 따라서 `20~32` 구간은 warmup/assist 전용으로 예약하고, daily main의 기본 노출 구간은 그 위에서 시작한다. [owner_constraint: 00_PROJECT_BRIEF.md; evidence_id: SRC-28]

### 6.2 Path A — 단일축 `difficultyIndex` 0-100

#### A. Product stance
- 사용자에게는 하나의 숫자만 먼저 보여준다: `difficultyIndex 20~100`. [owner_constraint: D-20260619-002]
- 내부적으로는 `complexityScore`, `visibility preset`, `generator profile`을 계속 유지하고, 숫자는 그 위에 덮이는 설명 계층으로만 쓴다. [evidence_id: SRC-08; evidence_id: SRC-26]
- 선택 이유: Owner가 상상하는 모델과 가장 가깝고, Google Play 실기기 QA에서 `지금은 몇 점쯤인가`를 빠르게 묻기 쉽다. [owner_constraint: 00_PROJECT_BRIEF.md]

#### B. Mapping function
`linear`를 기본으로 둔다. `log`는 onboarding 구간을 과도하게 압축하고, `step`은 실제 체감 차이를 숨긴다. 현재 config는 easy/normal/hard가 이미 rule delta로 나뉘어 있으므로, 먼저 선형으로 읽는 편이 해석 가능성이 높다. [evidence_id: SRC-23; evidence_id: SRC-24; evidence_id: SRC-25; evidence_id: SRC-26]

정의:

```text
geometryPressure = clamp((complexityScore - 0.20) / (0.76 - 0.20), 0, 1)

visibilityPressure = average(
  reverse_norm(pathWidthPx, 18, 38),
  reverse_norm(failDistancePx, 30, 60),
  reverse_norm(revealRadiusPx, 62, 124),
  reverse_norm(touchFocusRadiusPx, 42, 70),
  reverse_norm(forwardPreviewT, 0.006, 0.018),
  reverse_norm(idleLimitMs, 850, 1800),
  reverse_norm(minTurnRadiusPx, 68, 120),
  reverse_norm(warningRecoverRatePerSecond, 26, 42),
  norm(maxTurnAngleDeg, 55, 75),
  norm(warningIncreaseRatePerSecond, 34, 56)
)

difficultyIndex = round(clamp(20 + 80 * (0.65 * geometryPressure + 0.35 * visibilityPressure), 20, 100))
```

근거:
- `0.20`은 easy `minComplexity`, `0.76`은 hard `targetComplexity`다. [evidence_id: SRC-27; evidence_id: SRC-28]
- visibility 항목은 현재 `VISIBILITY_LEVELS`의 실제 상수로만 계산한다. [evidence_id: SRC-23; evidence_id: SRC-25]
- geometry 65 / visibility 35 가중치는 Owner의 우선순위가 `선을 잘 그리는 것`에 있고, 시야 제약은 그 다음이기 때문이다. [owner_constraint: 00_PROJECT_BRIEF.md]

#### C. Indicative matrix from current config
아래는 현재 `targetComplexity`와 visibility preset으로 계산한 기본 매핑 예시다. warmup은 이 표가 아니라 `20~32` onboarding floor를 사용한다. [evidence_id: SRC-23; evidence_id: SRC-25; evidence_id: SRC-27]

| lineDifficulty \ visibility | easy | normal | hard |
| --- | ---: | ---: | ---: |
| easy | 33 | 48 | 61 |
| normal | 50 | 65 | 78 |
| hard | 72 | 87 | 100 |

#### D. Public UX rule
- 메인 선택 UI는 `20~100 숫자 + 한 줄 설명`만 보여준다. 예: `48 보통`, `78 까다로움`. [owner_constraint: 00_PROJECT_BRIEF.md]
- 세부 정보는 접힌 설명에서만 제공한다. 예: `길이/구불은 normal, 시야는 hard`. [evidence_id: SRC-08]
- 공식 비교는 숫자만 같다고 동등하다고 말하지 않는다. 같은 `generator profile`과 같은 `official seed rule`일 때만 동일 비교로 취급한다. [evidence_id: SRC-05; evidence_id: SRC-32]

#### E. Risks
- 숫자가 단순해지는 대신, `왜 어려운지` 설명이 약해질 수 있다. [evidence_id: SRC-08]
- overlap이나 crossing의 체감이 숫자 하나에 과도하게 숨겨질 수 있다. [evidence_id: SRC-22]

### 6.3 Path B — 다축 유지 + 설명 강화

#### A. Product stance
- 현재 구현 현실에 맞춰 `선 난이도`, `시야 압박`, `생성기 프로필`을 독립 축으로 유지한다. [evidence_id: SRC-08]
- 사용자에게도 이 세 축을 숨기지 않고 보여주되, 읽기 쉬운 용어로 번역한다. [owner_constraint: D-20260619-002]
- 선택 이유: 급격한 꺾임, 겹침, reveal 차이를 하나의 숫자보다 더 정확히 설명할 수 있다. [evidence_id: SRC-17; evidence_id: SRC-22]

#### B. Public axis model
- `선 난이도` = 길이·구불거림 축. 계산은 Path A의 `geometryPressure`를 그대로 사용하되 `20~100`으로만 표시한다. [evidence_id: SRC-23; evidence_id: SRC-26; evidence_id: SRC-27]
- `시야 압박` = reveal/fail/idle/warning 축. 계산은 Path A의 `visibilityPressure`를 `20~100`으로만 표시한다. 현재 preset 기준 예시는 easy 20 / normal 64 / hard 100이다. [evidence_id: SRC-23; evidence_id: SRC-25]
- `생성기 프로필` = warmup / main / curve / precision. 이것은 숫자가 아니라 pattern badge로 유지한다. [evidence_id: SRC-05; evidence_id: SRC-06]

#### C. UX explanation rule
- 첫 줄: `선 난이도 72 / 시야 압박 64 / 패턴 curve`. [owner_constraint: D-20260619-002]
- 둘째 줄: `길고 많이 굽는 선 + 보통 시야 + 커브 제어 중심`. [evidence_id: SRC-23; evidence_id: SRC-24]
- 공식 board는 `main + published visibility + published geometry band`로 고정하고, practice만 multi-axis 자유 변경을 허용한다. [evidence_id: SRC-32]

#### D. Official difficulty standard
- `Official`은 `same seed + same lineDifficulty band + same visibility level + same generator profile`일 때만 비교한다. [evidence_id: SRC-32]
- `Practice`는 어떤 축이든 바꿀 수 있지만 공식 score와 섞지 않는다. [evidence_id: SRC-30]
- `Warmup`과 `precision`은 first-value 강화 또는 감각 훈련용으로만 쓰고, 첫 검증 MVP의 공식 leaderboard surface에 넣지 않는다. [evidence_id: SRC-05; evidence_id: SRC-06]

#### E. Risks
- 축이 늘어나면 첫 진입 이해 비용이 커질 수 있다. [owner_constraint: 00_PROJECT_BRIEF.md]
- 너무 설명적이면 빠른 한 판 진입성이 떨어질 수 있다. [evidence_id: SRC-35]

### 6.4 Owner decision checkpoint between A and B
아래 질문에 대한 Owner 답변이 최종 선택 기준이다. [owner_constraint: D-20260619-002 remaining_risks]
1. 플레이어에게 먼저 보이고 싶은 것이 `하나의 점수`인가, `왜 어려운지의 구성요소`인가?
2. `겹침`을 난이도 숫자 안에 숨겨도 되는가, 아니면 별도 축/배지로 보여야 하는가?
3. 첫 검증 목표가 `빠른 이해`인가, `정확한 진단`인가?

## 7. Shared product rules regardless of A/B choice

### 7.1 Curve smoothness planning
현재 `softenPolyline()`는 `3-point weighted averaging` 4 pass(precision은 5 pass)이며, 코너를 줄이지만 `길이 축소`, `교차부 급격함 유지`, `고주파 진동 재형상화 실패` 한계가 있다. [evidence_id: SRC-12; evidence_id: SRC-17; evidence_id: SRC-18]

| candidate | pass / stage | expected gain | expected risk | when to try |
| --- | --- | --- | --- | --- |
| current linear smoothing | 4 pass main / 5 pass precision | 가장 예측 가능, 기존 seed 재현성 유지 | 급격함 체감이 남을 수 있음 | baseline |
| increased linear smoothing | 6~8 pass | 급격한 micro-turn 감소 | 경로 길이 축소, 난이도 희석, 곡선이 무뎌질 수 있음 | QA에서 `각은 줄었지만 재미는 유지`가 필요한 경우 |
| Chaikin corner cutting | 2 pass | 코너가 더 부드럽게 보이고 spline보다 구현 리스크가 낮음 | 샘플 수 증가, path length drift, 교차 형태가 달라질 수 있음 | non-crossing line부터 비교 |
| Catmull-Rom spline | 1 interpolation stage + safety clamp | 시각적으로 가장 연속적인 곡선 후보 | overshoot, 교차 근처 제어 어려움, seed 재현/판정 재조정 필요 | 현 방식이 체감상 명확히 실패할 때만 |

권고:
- 실기기 QA 전에는 spline 전환을 확정하지 않는다. [owner_constraint: t_c4b94861 DO NOT]
- 비교 순서는 `current → increased linear → Chaikin → Catmull-Rom`으로 둔다. 즉, 먼저 기존 생성 규칙의 amplitude/turn density를 줄여서 해결 가능한지 본다. [evidence_id: SRC-16; evidence_id: SRC-17]
- 채택 기준은 `부드럽다 응답률`, `path length drift`, `fallback rate`, `crossing readability` 네 가지를 동시에 본다. [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.2; approved_artifact: stages/05_MARKET_RESEARCH.md Section I.3]

### 7.2 Overlap policy options and code-touch scope
현재 정책은 `easy/normal = self-intersection 금지`, `hard(non-warmup) = self-intersection 필수`다. 이것은 Owner 의도와 어긋난다. [evidence_id: SRC-19; evidence_id: SRC-20; evidence_id: SRC-21; evidence_id: SRC-22]

정책 옵션:
- `O0 current`: easy/normal 금지, hard 필수.
- `O1 relaxed-normal`: easy 금지, normal 0~1 clean crossing 허용, hard 1 crossing 필수.
- `O2 broad-owner-aligned`: easy 0~1 optional, normal 0~1 optional, hard 1 crossing 필수 또는 1~2 optional.

변경 영향 범위:
- `src/game/pathGenerator.ts` `shouldUseCrossingHardPath()` L32-34: 어떤 profile/difficulty에서 crossing curve를 강제할지 바뀐다.
- `createSampledCurve()` L195-196: hard 전용 crossing branch를 다른 difficulty에도 확장할지 결정해야 한다.
- `isValid()` L229-249, 특히 L238: 현재는 boolean 한 줄로 self-intersection을 reject/require 한다. overlap 허용 시 `횟수`, `교차 각도`, `시작/끝점과의 거리`, `경로 가독성` 기준으로 바뀌어야 한다.
- `generatePath()` L256-277: overlap 허용이 넓어지면 valid candidate 수와 fallback 사용률이 바뀌므로, `첫 valid 채택` 대신 `targetComplexity에 가장 가까운 valid` 우선 규칙이 필요하다.

제품 방침:
- Owner 결정 전에는 어느 옵션도 final로 고정하지 않는다. [owner_constraint: 00_PROJECT_BRIEF.md]
- 첫 실기기 QA 비교 대상은 `O0 vs O1`까지만 둔다. `O2`는 체감상 확실히 개선될 때만 확장 검토한다. [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.2]

### 7.3 Complexity gate and `difficultyIndex` conversion
현재 `targetComplexity`와 `minComplexity`는 선언만 있고 생성 검증에 쓰이지 않는다. 이를 `정보용 수치`에서 `생성 품질 게이트`로 승격한다. [evidence_id: SRC-27]

권장 규칙:
1. `validity gate`: 기존 distance / self-intersection / Y-clip / maxTurnAngle 검증을 통과해야 한다. [evidence_id: SRC-20; evidence_id: SRC-14]
2. `minimum gate`: `complexityScore >= minComplexity[lineDifficulty]`여야 한다. [evidence_id: SRC-27]
3. `target band`: 우선 채택 조건을 `targetComplexity ± tolerance`로 둔다.
   - easy: 0.34 ± 0.08
   - normal: 0.52 ± 0.10
   - hard: 0.76 ± 0.12
   [evidence_id: SRC-23; evidence_id: SRC-25; evidence_id: SRC-27]
4. `best-candidate fallback`: 32회 내 완전 일치가 없으면 `minComplexity 이상이면서 target에 가장 가까운 valid candidate`를 우선 채택하고, 그것도 없을 때만 preset fallback을 쓴다. [evidence_id: SRC-13; evidence_id: SRC-27]
5. `A-path display`: Path A에서는 위 complexityScore를 `difficultyIndex`에 연결한다. [evidence_id: SRC-26]
6. `B-path display`: Path B에서는 위 complexityScore를 `선 난이도` 축으로만 보여준다. [evidence_id: SRC-26]

### 7.4 Difficulty ramp and onboarding floor
현재 ramp는 amplitude 0.72 → 1.00 → 1.34, sampleCount 112 → 128 → 152, tertiary 0.35 → 1.00 → 1.82, revealRadius 124 → 88 → 62, idleLimit 1800 → 1350 → 850로 동시에 올라간다. 즉 geometry와 visibility가 한 번에 세진다. [evidence_id: SRC-23; evidence_id: SRC-24; evidence_id: SRC-25]

제품 해석:
- easy는 `성공 경험`이 아니라 `조작 이해`가 목적이다.
- normal은 공식 daily main의 기본값이어야 한다.
- hard는 `실패가 나와도 공정하다고 느껴지는 upper challenge`여야 한다.

`onboarding floor 20` 정의:
- warmup profile
- complexityScore 0.20~0.28
- no required crossing
- visibility easy preset 유지 (`pathWidth 38`, `failDistance 60`, `revealRadius 124`, `idleLimit 1800`) [evidence_id: SRC-23; evidence_id: SRC-27]

ramp QA 프레임:
- `easy → normal`은 성공률이 내려가되 이해도가 유지되는가?
- `normal → hard`는 실패가 늘어나도 억울함보다 도전감이 큰가?
- 체감상 가장 큰 급등 원인이 geometry인지 visibility인지 분리해서 기록하는가? [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.2]

### 7.5 Retention hook boundary
현재 retention의 실제 강점은 `Daily seed + local record`이고, 약점은 `다시 열 이유를 강하게 말해주지 못한다`는 점이다. [evidence_id: SRC-32; evidence_id: SRC-33; evidence_id: SRC-35]

제품 방침:
- 첫 retention hook은 `push`, `streak`, `comeback reward`가 아니라 `오늘 선의 공정성 + 어제 기록 대비 개선`이다. [evidence_id: SRC-32; evidence_id: SRC-35]
- weekly strip, yesterday comparison, practice recall은 `daily reopen`을 강화하는 보조 surface로만 본다. [evidence_id: SRC-33]
- push/streak/comeback reward 우선순위 판단은 Development 승인 이후로 미룬다. [owner_constraint: t_c4b94861 SCOPE]

### 7.6 Scoring consistency policy
현재 공식 코드는 `0~1000 clamp completed-only official score`를 사용하고, 과거 spec은 `baseScore 10000`을 제안한다. 두 체계는 그대로 공존하면 혼란을 만든다. [evidence_id: SRC-29; evidence_id: SRC-30; evidence_id: SRC-31]

첫 검증 제품 방침:
- `official score`: 현재 구현과 동일한 0~1000 clamp completed-only. 이유는 이미 measurement breakdown과 연결되어 있고, 지금 검증할 것은 점수 granularity가 아니라 난이도/체감 정합성이다. [evidence_id: SRC-29; evidence_id: SRC-30; evidence_id: SRC-31]
- `unofficial feedback`: 실패 시 progress, fail reason, accuracy/smoothness feedback만 보여준다. 공식 점수와 합치지 않는다. [evidence_id: SRC-30]
- `10000-scale spec`: Architecture 단계에서 `폐기` 또는 `leaderboard 전용 확장 스케일` 중 하나로 정리할 후보로 넘긴다. 이번 MVP에는 노출하지 않는다. [evidence_id: SRC-31]

### 7.7 Monetization boundary
- 지금 설계하지 않는다. [owner_constraint: D-20260619-002 scope_impact]
- 단, 상한은 기록한다: 실패 후 non-official retry rewarded, 결과 화면의 cosmetic preview rewarded, 홈/로비 banner, daily completion 경계 interstitial 정도만 정책상 검토 가능하다. [evidence_id: SRC-41; evidence_id: SRC-42; evidence_id: SRC-43]
- 점수, 랭킹, 승패, 확률형 결과와 보상을 직접 연결하지 않는다. [evidence_id: SRC-41; evidence_id: SRC-44]
- 어떤 monetization도 `core play 중간`이나 `official fairness`를 건드리면 안 된다. [evidence_id: SRC-42; evidence_id: SRC-43]

## 8. Validation experiments, events, and pivot rules

### 8.1 Experiment order
1. E0. Owner decision freeze: A/B path, overlap policy 후보, floor-20 의미 확정 [owner_constraint: D-20260619-002]
2. E1. 실기기 touch QA: sharp-turn, overlap, ramp 체감 측정 [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.2]
3. E2. smoothing candidate compare: current vs increased linear vs Chaikin vs Catmull-Rom [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.3]
4. E3. scoring clarity test: official/unofficial 분리 후 결과 이해도 확인 [evidence_id: SRC-29; evidence_id: SRC-31]
5. E4. daily reopen baseline: seed + local record만으로 다시 열리는지 확인 [evidence_id: SRC-32; evidence_id: SRC-35]

### 8.2 Minimum analytics events
- `daily_board_opened`
- `warmup_started`
- `official_main_started`
- `run_completed`
- `run_failed`
- `fail_reason_recorded`
- `difficulty_surface_viewed`
- `difficulty_variant_selected`
- `result_viewed`
- `official_score_viewed`
- `practice_feedback_viewed`
- `local_best_viewed`
- `same_day_retry_started`
- `next_day_reopen`
- `curve_candidate_tagged`
- `overlap_policy_tagged`

### 8.3 Success metrics
- first-session warmup completion or near-completion `>= 80%` on the onboarding floor [owner_constraint: 00_PROJECT_BRIEF.md]
- `easy < normal < hard` 체감 순서를 맞게 응답한 비율 `>= 70%` [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.2]
- `부드럽다` 응답 비율 `>= 80%` for adopted smoothing candidate [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.2]
- adopted smoothing candidate의 path-length drift `<= 10%` and fallback-rate increase `<= 2x baseline` [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.3; evidence_id: SRC-13]
- next-day reopen signal `> 0` before push/streak discussion [evidence_id: SRC-35]

### 8.4 Stop / narrow / pivot rules
- Path A stop: 플레이어가 같은 숫자에서 다른 체감 이유를 설명하지 못하고 `왜 어려운지 모르겠다` 피드백이 반복되면 Path B로 pivot한다. [evidence_id: SRC-08; evidence_id: SRC-22]
- Path B stop: first-session 선택 지연이나 이해 부담이 커서 main 진입률이 떨어지면 Path A로 narrow한다. [owner_constraint: 00_PROJECT_BRIEF.md]
- overlap expand stop: O1/O2에서 fallback 사용률이 급등하거나 `어색한 교차` 응답이 높으면 O0 또는 hard-only overlap으로 되돌린다. [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.2]
- spline stop: Catmull-Rom 또는 Chaikin이 smoothness는 올려도 path-length drift, crossing readability, fairness 설명력을 같이 망치면 채택하지 않는다. [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.3]
- monetization stop: daily reopen과 fairness baseline이 없으면 어떤 monetization 설계도 열지 않는다. [evidence_id: SRC-37; evidence_id: SRC-39]

## 9. Explicit non-goals

| non-goal | why cut now | evidence / constraint |
| --- | --- | --- |
| 단일축 A 또는 다축 B 중 하나 확정 | Owner 결정 전 commit 금지 | owner_constraint: D-20260619-002 |
| 광고/IAP/재화 설계 | 현재 단계에서 premature | evidence_id: SRC-37; evidence_id: SRC-39 |
| Apps in Toss-first 출시 판단 | 실기기 touch QA보다 범위를 넓힌다 | evidence_id: SRC-41; evidence_id: SRC-43 |
| 서버 leaderboard / 로그인 / 백엔드 ranking | first validation focus가 아니다 | evidence_id: SRC-37 |
| push/streak/comeback reward 우선 도입 | value proof 없이 retention을 외부 자극으로 덮는다 | evidence_id: SRC-35 |
| 10000점 스케일로 즉시 이관 | 현재 문제는 score scale보다 difficulty readability다 | evidence_id: SRC-31 |
| 실기기 QA 없이 spline/overlap 최종 전환 | 체감 검증 없는 core-fun 수정은 금지 | owner_constraint: t_c4b94861 DO NOT |

## 10. Open risks and owner checkpoints

### 10.1 Open risks
- `12단계`를 단일 서수로 이해하는지, Daily Pack variant로 이해하는지 아직 확정되지 않았다. [owner_constraint: D-20260619-002 remaining_risks]
- current smoothing 한계가 실제로 amplitude 문제인지, 알고리즘 문제인지 실기기 QA 전에는 확정할 수 없다. [evidence_id: SRC-16; evidence_id: SRC-17]
- overlap 확대가 `더 자연스럽다`로 읽힐지 `더 지저분하다`로 읽힐지 확인되지 않았다. [evidence_id: SRC-22]
- 점수 체계는 0~1000 유지가 당장 가장 안전하지만, 장기 leaderboard 설계와 완전히 합의된 것은 아니다. [evidence_id: SRC-31]

### 10.2 Owner checkpoints required before convergence
1. Path A와 Path B 중 무엇을 첫 공개 설명 체계로 택할지.
2. overlap policy를 O0/O1/O2 중 어디까지 열지.
3. `최소 20`을 onboarding floor로 볼지, 전체 grid의 최저값으로 볼지.
4. official board를 `main only`로 둘지, curve/precision 일부를 later-official로 열지.

## 11. Change log
- v0.1.0 (2026-06-20): Product Planning A1 proposal created. Path A/B 병행 설계, smoothing 비교표, overlap 정책 옵션, complexity gate, official/unofficial score 분리, monetization boundary, validation metrics를 추가했다.
