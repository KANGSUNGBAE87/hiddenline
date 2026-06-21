# [REVISION] 08_PRODUCT_PLAN.md — Hidden Line Product Planning A2 final candidate

- revised_at: 2026-06-19 KST
- phase: Product Planning / A2 revision
- author: product-planner
- status: final-candidate
- input_brief: `00_PROJECT_BRIEF.md`
- market_research_decision_id: `D-20260619-002`
- approved_market_research: `stages/05_MARKET_RESEARCH.md` v1.1.0
- challenge_review: `stages/reviews/product-plan-hiddenline-difficulty.md`
- scope_note: 이 문서는 CEO가 다음 UX/Architecture 입력을 고정할 수 있을 정도로 제품 검증 범위를 압축한다. 구현 착수, 광고/IAP 실행, Apps in Toss 출시 실행, 스토어 통과, 제품 승인 자체를 의미하지 않는다.

## 0. [REVISION] B challenge response

| B challenge | decision | A2 response |
|---|---|---|
| 12-level ladder 표현이 공식 난이도로 읽힐 수 있다 | ACCEPT | `공식 노출 축`, `내부 생성 축`, `설명용 band`를 분리한다. A2에서 `12`는 ordered ladder가 아니라 current variant count reference로만 취급한다. first validation의 public exposure는 5 named presets이며, `12 public levels` 여부는 Owner intent 확인 뒤로 park한다. [evidence_id: SRC-06; evidence_id: SRC-08; owner_constraint: D-20260619-002 excluded_scope] |
| 0-100 / floor 20 / smoothness·overlap·length·winding가 아직 설명 수준이다 | ACCEPT | `0-100`은 first validation에서 `public promise`가 아니라 `internal calibration scale`로 둔다. Intro floor는 internal `20+` band로 고정하되, exact mapping은 device QA와 architecture에서 검증한다. smoothness/overlap/length/winding는 제품 정의 + QA gate + fail signal까지 연결한다. [owner_constraint: 00_PROJECT_BRIEF.md L16-21; evidence_id: SRC-26; evidence_id: SRC-27; approved_artifact: stages/05_MARKET_RESEARCH.md Section I] |
| retention / monetization 경계는 맞지만 “지금은 안 한다”를 더 강하게 고정해야 한다 | ACCEPT | A2는 monetization branch를 닫는다. 광고/IAP 후보는 `later-only` 가설로만 남기고, hard boundary와 policy gate를 본문 전면에 둔다. first validation 판단 기준은 core retry loop와 difficulty feel이다. [evidence_id: SRC-39; evidence_id: SRC-41; evidence_id: SRC-42; evidence_id: SRC-43; evidence_id: PP-03; evidence_id: PP-04] |

거부된 challenge는 없다. B의 3개 challenge는 모두 수용한다.

## 1. Planning frame

### 1.1 Fixed inputs
- 승인된 입력은 `00_PROJECT_BRIEF.md`, `01_DECISIONS.md`의 `D-20260619-002`, `stages/05_MARKET_RESEARCH.md` v1.1.0, `stages/reviews/product-plan-hiddenline-difficulty.md`다. [owner_constraint: START GATE; owner_constraint: D-20260619-002]
- 승인된 시장조사는 Product Planning이 `0-100/12-level alternatives`, `smoothness/overlap/length/winding 정의`, `onboarding floor 20`, `retention/ad boundaries`를 다루는 것을 허용했지만, `12 variants를 확정된 ordered levels로 취급`하는 것은 제외했다. [owner_constraint: D-20260619-002 accepted_scope; owner_constraint: D-20260619-002 excluded_scope]
- Hidden Line의 현재 제품 방향은 `mobile precision tracing game`이며, realistic sticker peeling simulation으로 되돌리지 않는다. [owner_constraint: hiddenline/AGENTS.md Current Product Direction]
- Development는 Architecture 이후 Owner가 별도 승인하기 전까지 제외한다. `dev-builder` 착수, 제품 코드 변경, 광고/IAP/login/backend ranking 구현은 이 문서 범위가 아니다. [owner_constraint: 00_PROJECT_BRIEF.md L31-33; owner_constraint: task required scope]

### 1.2 Explicit owner constraints
- Owner 우선순위는 `난이도에 맞는 선 생성`이다. [owner_constraint: 00_PROJECT_BRIEF.md L21]
- Owner는 `선은 최대한 곡선`, `선은 겹쳐도 된다`, `많이 겹치고 길고 구불구불할수록 더 어렵다`, `0-100 난이도라면 가장 낮은 단계도 최소 20에서 시작`, `상품성과 광고수익도 고려`를 요청했다. [owner_constraint: 00_PROJECT_BRIEF.md L16-20]
- 예산/기간은 명시되지 않았다. 따라서 first validation은 `짧은 검증 루프`, `기능보다 검증 언어 고정`, `플랫폼/수익화 범위 확대 금지`를 기본 원칙으로 둔다. [owner_constraint: missing explicit budget/timeline]

### 1.3 Evidence registry used in this plan
- `SRC-*`: `stages/05_MARKET_RESEARCH.md`의 evidence table ID.
- `PP-01`: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/app-platform-standard.md`
- `PP-02`: `/Users/kangsungbae/Documents/지식저장소/projects/hiddenline/platform.md`
- `PP-03`: `/Users/kangsungbae/Documents/지식저장소/docs/tools/apps-in-toss-game-ads-points-monetization.md`
- `PP-04`: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/apps-in-toss-development-gate.md`
- `PP-05`: `/Users/kangsungbae/Documents/지식저장소/docs/tools/apps-in-toss-platform.md`

## 2. Fixed one-liners

### 2.1 Primary target
1차 타깃은 Android에서 짧은 세션으로 `손가락 정밀 조작 실력`을 시험하고, 실패해도 바로 다시 시도하는 skill-based solo player다. 퍼즐 수집가, 보상 파밍 유저, 장식형 progression 추구 유저는 first validation의 핵심 코호트가 아니다. [evidence_id: SRC-32; evidence_id: SRC-35; evidence_id: SRC-37; owner_constraint: hiddenline/AGENTS.md Current Product Direction]

### 2.2 Trigger moment
사용자는 `짧게 집중할 1~3분짜리 challenge`가 필요할 때, 설명이 길지 않고 곧바로 손기술 테스트가 시작되는 게임을 원할 때 Hidden Line을 연다. [evidence_id: SRC-32; evidence_id: SRC-35]

### 2.3 JTBD
사용자가 로그인, 광고, 복잡한 옵션 설정 없이 숨겨진 선 한 판을 바로 시작하고, 실패 후에도 `왜 실패했는지`를 납득한 뒤 같은 seed 또는 한 단계 다른 난이도로 자연스럽게 재도전하게 해달라. [evidence_id: SRC-29; evidence_id: SRC-30; evidence_id: SRC-32; owner_constraint: 00_PROJECT_BRIEF.md L21]

### 2.4 Core problem
현재 제품은 실제 생성 구조가 `다축 시스템`인데, Owner와 플레이어가 이해할 단일 제품 언어가 없고, sharp turn/overlap 정책도 직관과 어긋나서 `왜 이 난이도가 쉬운지·어려운지`를 납득시키기 어렵다. [evidence_id: SRC-08; evidence_id: SRC-22; evidence_id: SRC-26; evidence_id: SRC-27]

### 2.5 One-line product definition
Hidden Line은 `보이지 않는 선을 손끝으로 추적하는 짧고 공정한 precision challenge`이며, 첫 검증의 본질은 광고가 아니라 `난이도 감각이 자연스럽게 전달되는가`다. [evidence_id: SRC-32; evidence_id: SRC-45; owner_constraint: 00_PROJECT_BRIEF.md L21]

## 3. Positioning and alternative comparison

### 3.1 Value proposition
- one-stroke/line puzzle 대비: 정답 찾기가 아니라 `계속 이어지는 경로를 놓치지 않는 감각`이 핵심이다. [evidence_id: SRC-09; evidence_id: SRC-23]
- rhythm/tap score game 대비: 박자 반응이 아니라 `경로 유지와 흔들림 제어`가 핵심이다. [evidence_id: SRC-29; owner_constraint: hiddenline/AGENTS.md Current Product Direction]
- casual fail-repeat game 대비: 단순 재도전 루프는 유사하지만, Hidden Line은 `같은 seed에서의 공정성`과 `경로 feel 설명 가능성`이 차별점이다. [evidence_id: SRC-32; evidence_id: PP-02]

### 3.2 Positioning sentence
`짧게 시작하지만 손기술 차이는 분명하게 느껴지는 hidden-path tracing challenge.` [owner_constraint: 00_PROJECT_BRIEF.md L21; evidence_id: SRC-32]

## 4. Decision-ready scope: difficulty language, path feel, and first promise

### 4.1 Official exposure decision for first validation
A2의 first validation에서 공식적으로 노출하는 것은 `5 named presets`다. `0-100`은 first validation의 기본 public UI 약속이 아니라 `internal calibration / QA / analytics language`로 둔다. [owner_constraint: 00_PROJECT_BRIEF.md L19; evidence_id: SRC-08; evidence_id: SRC-26]

이 결정의 이유:
1. Owner는 단일 난이도 언어를 기대하지만, current implementation은 다축 구조다. [evidence_id: SRC-08]
2. 숫자를 먼저 전면 노출하면 체감 검증 전 `숫자는 쉬운데 왜 어렵지?` 문제가 생긴다. [evidence_id: SRC-26; evidence_id: SRC-27]
3. named preset은 first validation에서 UX 복잡도를 줄이면서도 ramp comprehension을 테스트할 수 있다. [owner_constraint: missing explicit budget/timeline]

### 4.2 Internal generation decision
내부 생성 구조는 `LineDifficulty × VisibilityLevel × GeneratorProfile`의 다축 tuning 유연성을 유지한다. A2는 이를 public ordered ladder로 재정의하지 않는다. [evidence_id: SRC-02; evidence_id: SRC-03; evidence_id: SRC-04; evidence_id: SRC-05; evidence_id: SRC-08]

### 4.3 12-level framing decision
`12`는 A2에서 공식 난이도 ladder가 아니다. 현재는 Daily/seed variant 문맥에서 생긴 수치일 뿐이며, `12 public levels` 채택 여부는 Owner intent 확인과 difficulty mapping validation 이후 UX 단계에서 다시 판단한다. [evidence_id: SRC-06; evidence_id: SRC-08; owner_constraint: D-20260619-002 excluded_scope]

### 4.4 Onboarding floor 20 decision
Owner 요청에 따라 first validation의 onboarding floor는 internal calibration scale상 `20 이상`에서 시작한다. 다만 `20`은 exact public number promise가 아니라 `입문이지만 실수해도 납득 가능한 floor band`라는 제품 의미를 가진다. [owner_constraint: 00_PROJECT_BRIEF.md L19; evidence_id: SRC-28]

### 4.5 Visible presets for first validation
| visible preset | internal calibration band | player promise | why it exists now |
|---|---|---|---|
| Intro | 20-29 | 숨은 선을 놓치지 않고 끝까지 가는 감각을 익힌다 | onboarding floor 검증 [owner_constraint: 00_PROJECT_BRIEF.md L19] |
| Easy | 30-44 | 길이는 조금 늘지만 surprise turn이 앞서지 않는다 | first success 유지 [evidence_id: SRC-14] |
| Standard | 45-59 | 길이와 구불거림 증가가 분명히 느껴진다 | baseline middle band [evidence_id: SRC-23; evidence_id: SRC-25] |
| Hard | 60-74 | warning pressure와 path reading 부담이 의미 있게 올라간다 | retry motivation 검증 [evidence_id: SRC-24; evidence_id: SRC-35] |
| Expert | 75-100 | 숙련자용 high-skill challenge를 제공한다 | ceiling 확인 [evidence_id: SRC-21; evidence_id: SRC-25] |

정확한 매핑 함수와 preset 간 간격은 Architecture 입력이다. Product Planning A2는 `5 preset public exposure + 20 floor band + 12 ladder 비확정`까지만 고정한다. [evidence_id: SRC-27; owner_constraint: task required scope]

### 4.6 Product definitions for smoothness, overlap, length, winding
| concept | product meaning | first-validation boundary | fail signal | evidence |
|---|---|---|---|---|
| Smooth curve | 난이도는 `곡선 추적`에서 와야지 `갑작스러운 각짐`에서 오면 안 된다 | Intro/Easy에서 curve-following 감각이 먼저 와야 한다 | 테스터가 `길이 갑자기 꺾였다`고 반복 진술 | [owner_constraint: 00_PROJECT_BRIEF.md L16-18; evidence_id: SRC-14; evidence_id: SRC-17] |
| Overlap | 겹침은 난이도 상승 장치일 수 있지만 onboarding 기본 문법은 아니다 | Intro/Easy는 overlap required 금지, Standard는 제한적 후보, Hard/Expert는 readable overlap만 허용 | `어디가 길인지 읽히지 않는다`가 반복되면 실패 | [owner_constraint: 00_PROJECT_BRIEF.md L17-18; evidence_id: SRC-20; evidence_id: SRC-21; evidence_id: SRC-22] |
| Length | 길이는 난이도 상승의 핵심 수단이지만 짧은 모바일 세션을 깨면 안 된다 | Intro는 한 번의 집중으로 끝까지 갈 수 있어야 한다 | 길이 증가 때문에 tracing 감각보다 피로가 먼저 언급되면 실패 | [owner_constraint: 00_PROJECT_BRIEF.md L18; evidence_id: SRC-25; evidence_id: SRC-32] |
| Winding | 구불거림은 실력 차이를 만드는 주된 장치다 | higher preset에서 winding 증가는 분명해야 한다 | `그냥 랜덤하게 흔들린다`는 피드백이 많으면 실패 | [owner_constraint: 00_PROJECT_BRIEF.md L18; evidence_id: SRC-23; evidence_id: SRC-24] |

### 4.7 Explicitly parked items
- `0-100`을 항상 보이는 공식 사용자 점수로 확정하지 않는다. [evidence_id: SRC-26; owner_constraint: D-20260619-002 open_risk]
- `12 public levels`를 이번 단계에서 열지 않는다. [evidence_id: SRC-08; owner_constraint: D-20260619-002 excluded_scope]
- easy/normal 전 구간 overlap 일반 허용도 이번 단계에서 확정하지 않는다. 이는 device QA와 Architecture decision이 필요하다. [evidence_id: SRC-22]

## 5. First value, core loop, MVP must-have, non-goals

### 5.1 First value
첫 가치는 사용자가 Intro floor에서 숨은 선 한 판을 바로 시작하고, 끝나거나 실패한 뒤 `왜 어려웠는지`를 납득하는 순간이다. [owner_constraint: 00_PROJECT_BRIEF.md L19-21; evidence_id: SRC-29; evidence_id: SRC-30]

### 5.2 Core loop
1. 앱을 연다.
2. Intro 또는 직전 preset으로 바로 시작한다.
3. 숨은 경로를 따라간다.
4. 결과 화면에서 `완주/실패`, 주요 실패 이유, 현재 preset 의미를 본다.
5. 같은 seed로 다시 하거나, 한 단계 높은/낮은 preset으로 재도전한다. [evidence_id: SRC-29; evidence_id: SRC-30; evidence_id: SRC-32]

### 5.3 Retention loop for first validation
- same-session retention: 결과 직후 `다시 하기` 또는 `인접 preset 이동`이 자연스럽게 이어진다. [evidence_id: SRC-30; evidence_id: SRC-35]
- next-session retention: Daily seed 또는 직전 실패의 재도전 이유가 남는다. [evidence_id: SRC-32; evidence_id: SRC-33]
- first validation에서 streak, push, reward economy, social sharing loop는 핵심 retention 장치가 아니다. [evidence_id: SRC-35; evidence_id: SRC-37]

### 5.4 MVP must-have for the first validation build
| must-have | why required now | linked hypothesis / operational need | evidence / constraint |
|---|---|---|---|
| Intro floor band (`20+`) | onboarding floor를 실제로 검증해야 함 | `가장 쉬운 단계도 최소 20부터 시작` 가설 검증 | [owner_constraint: 00_PROJECT_BRIEF.md L19] |
| 5 named presets with plain-language promise | current multi-axis를 player language로 번역해야 함 | difficulty comprehension 검증 | [evidence_id: SRC-08; evidence_id: SRC-26] |
| Result screen with fail reason + retry CTA | 첫 실패가 재도전으로 이어져야 함 | same-session retry loop | [evidence_id: SRC-29; evidence_id: SRC-30] |
| Same-seed retry and adjacent-preset CTA | fairness와 ramp를 같이 검증해야 함 | seed fairness + ramp validation | [evidence_id: SRC-32; evidence_id: PP-02] |
| Daily challenge entry as bounded revisit hook | next-session return 이유가 필요함 | revisit hypothesis | [evidence_id: SRC-32; evidence_id: SRC-33] |
| Difficulty feedback capture after runs | 설명이 아니라 체감 데이터가 필요함 | smoothness/overlap/ramp validation | [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.2] |
| Analytics event map for difficulty feel | VALIDATE_FIRST 운영에 필요 | pass / stop rule 판단 | [owner_constraint: D-20260619-002 accepted_scope] |

### 5.5 Explicit non-goals
| non-goal | why cut now | evidence / constraint |
|---|---|---|
| 12 public levels 노출 | Ordered ladder로 오해될 위험이 큼 | [evidence_id: SRC-08; owner_constraint: D-20260619-002 excluded_scope] |
| player-facing multi-axis editor | first validation에서 선택지가 과도하게 많아짐 | [evidence_id: SRC-08; owner_constraint: missing explicit budget/timeline] |
| 로그인/account requirement | core loop 전에 마찰만 늘림 | [evidence_id: SRC-37; owner_constraint: 00_PROJECT_BRIEF.md L21] |
| cloud save / backend ranking | first validation의 필수 운영 조건이 아님 | [evidence_id: SRC-37; owner_constraint: 00_PROJECT_BRIEF.md L31-33] |
| ads/IAP implementation | monetization branch는 아직 닫힘 | [evidence_id: SRC-39; owner_constraint: D-20260619-002 excluded_scope] |
| score/reward advantage 연결 | 공정성/정책 모두 깨짐 | [evidence_id: SRC-41; evidence_id: SRC-42; evidence_id: SRC-44] |
| Apps in Toss first release execution | touch feel 검증보다 사업/정책 scope를 먼저 넓힘 | [evidence_id: PP-01; evidence_id: PP-04; evidence_id: PP-05] |
| realistic sticker peeling pivot | 현재 제품 정의와 무관함 | [owner_constraint: hiddenline/AGENTS.md Current Product Direction] |

## 6. Validation plan, analytics events, success metrics, and stop rules

### 6.1 Validation order
1. Owner/CEO가 `official exposure language`를 확인한다: named preset 유지, 12 public levels 미확정, 0-100 internal calibration 사용. [owner_constraint: D-20260619-002 open_risk]
2. Device touch QA를 3개 viewport 이상에서 실행한다. [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.2]
3. Difficulty comprehension을 검증한다: 테스터가 preset 순서를 이해하고 인접 단계 이동 이유를 설명할 수 있는지 본다. [evidence_id: SRC-26]
4. Same-session retry / next-session revisit 신호를 확인한다. [evidence_id: SRC-30; evidence_id: SRC-32]
5. Monetization/policy branch는 위 검증이 닫히기 전 열지 않는다. [evidence_id: SRC-39; evidence_id: PP-03; evidence_id: PP-04]

### 6.2 Device QA plan
- Viewport minimum: 390×740, 390×844, 430×932. [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.2]
- Minimum run count: preset별 핵심 검증을 포함해 총 45회 이상. [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.2]
- QA questions:
  - sharp turn이 `억울한 설계`로 느껴지는가?
  - overlap이 `읽을 수 있는 난이도`인가 `혼란`인가?
  - preset 간 difficulty ramp가 자연스러운가?
  - warning이 useful한가 annoying한가?
- Softening comparison은 Product Planning의 deliverable이 아니라 Architecture 입력용 validation gate다. [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.3]

### 6.3 Minimum analytics events
- `app_opened`
- `preset_selected`
- `run_started`
- `warning_shown`
- `run_failed`
- `run_completed`
- `result_viewed`
- `retry_same_seed_started`
- `adjacent_preset_selected`
- `daily_entry_opened`
- `daily_run_started`
- `difficulty_feedback_submitted`
- `sharp_turn_complaint_logged`
- `overlap_confusion_logged`

Later-only events, not enabled in first validation:
- `rewarded_offer_viewed`
- `rewarded_offer_accepted`
- `interstitial_shown`
- `banner_rendered`

### 6.4 Success metrics for this stage
- Device QA에서 `smoothness 긍정 80%+`, `difficulty ramp 적절 70%+`, `overlap 어색함 30% 이하`를 만족한다. [approved_artifact: stages/05_MARKET_RESEARCH.md Section I.2]
- 테스터 다수가 5 preset의 쉬움/어려움 순서를 설명할 수 있다. [evidence_id: SRC-26]
- `result_viewed` 이후 same-seed retry 또는 adjacent preset 이동이 반복적으로 관찰된다. [evidence_id: SRC-30]
- Intro floor가 `처음이라도 시도해볼 수 있는 수준`으로 받아들여진다. [owner_constraint: 00_PROJECT_BRIEF.md L19-21]

### 6.5 Kill / narrow / pivot rules
- Kill for current feel direction: Intro/Easy에서 sharp-turn complaint가 반복되고, softening comparison에서도 개선 경로가 보이지 않으면 `현재 path feel 방향`을 재검토한다. [evidence_id: SRC-15; evidence_id: SRC-17; approved_artifact: stages/05_MARKET_RESEARCH.md Section I.3]
- Narrow: 5 preset comprehension이 약하면 public exposure를 3 preset까지 더 줄이고 numeric calibration을 더 깊게 숨긴다. [evidence_id: SRC-08; owner_constraint: missing explicit budget/timeline]
- Pivot within exposure: Owner가 named preset보다 다축 통제를 더 원하면 public UI는 simple preset을 유지하되, advanced/custom branch는 후순위로 분리한다. [evidence_id: SRC-08]
- Stop monetization branch: core retry loop가 약하거나 policy recheck가 모호하면 rewarded/interstitial/banner 검토를 중단한다. [evidence_id: SRC-41; evidence_id: SRC-42; evidence_id: SRC-43; evidence_id: PP-03]
- Stop platform expansion: Google Play touch validation이 닫히기 전에는 Apps in Toss execution branch를 열지 않는다. [evidence_id: PP-01; evidence_id: PP-04]

## 7. Retention and monetization boundaries

### 7.1 Retention boundary for first validation
first validation의 retention은 `retry`와 `daily return reason`까지만 본다. streak economy, push, invite reward, social loop, currency loop는 first-value 검증 전 범위 밖이다. [evidence_id: SRC-33; evidence_id: SRC-35; evidence_id: SRC-37]

### 7.2 Monetization decision for this stage
A2는 monetization surface를 설계하지 않는다. 이 단계의 역할은 `나중에 어디까지 허용 가능한가`의 hard boundary를 고정하는 것이다. [evidence_id: SRC-39; evidence_id: SRC-41; evidence_id: SRC-42; evidence_id: SRC-43]

### 7.3 Hard boundaries
- 플레이 중 광고 금지. [evidence_id: SRC-42; evidence_id: SRC-43; evidence_id: PP-03]
- 광고 시청으로 점수, 랭킹, 승패 우위를 주는 구조 금지. [evidence_id: SRC-41; evidence_id: SRC-44; evidence_id: PP-03]
- Toss points 또는 현금성 보상을 결과/확률/랭킹과 직접 연결하지 않는다. [evidence_id: SRC-41; evidence_id: PP-03]
- first run, tutorial, 짧은 세션 초입의 interstitial 기본 금지. [evidence_id: PP-03]
- actual ads/IAP/reward implementation은 Architecture 이후 별도 gate와 Owner 승인 전 금지다. [owner_constraint: 00_PROJECT_BRIEF.md L31-33; evidence_id: PP-04]

### 7.4 Later-only monetization hypothesis
코어 difficulty loop가 살아 있다는 전제하에만, 이후 단계에서 `실패 후 선택형 extra retry`, `결과 뒤 cosmetic/extra-attempt offer`, `비플레이 화면의 low-friction ad`를 검토할 수 있다. 이들은 모두 post-core hypothesis이며 A2 판단 기준이 아니다. [evidence_id: SRC-39; evidence_id: PP-03]

## 8. First validation platform and policy gates

### 8.1 First validation platform
첫 검증 플랫폼은 `Google Play 기준 Android app build`다. 이는 public launch success claim이 아니라 `device touch feel과 retry loop를 가장 먼저 검증할 채널`이라는 의미다. [evidence_id: PP-01; evidence_id: PP-02]

### 8.2 Why not web/PWA or Apps in Toss first
- 핵심 리스크가 distribution이 아니라 `실기기 touch feel`이므로, installable Android context가 더 적합하다. [evidence_id: SRC-15; evidence_id: PP-02]
- Apps in Toss를 first channel로 당기면 광고/포인트/사업자/심사 scope가 함께 커져 core validation이 흐려진다. [evidence_id: SRC-41; evidence_id: SRC-42; evidence_id: PP-03; evidence_id: PP-04; evidence_id: PP-05]
- Web/PWA는 링크 접근성은 좋지만 first validation의 핵심 질문인 mobile feel, viewport variance, retry loop 검증에 비해 우선순위가 낮다. [owner_constraint: 00_PROJECT_BRIEF.md L21; evidence_id: SRC-15]

### 8.3 Policy gates to preserve
- 제품 로직은 플랫폼 SDK와 분리한다. auth, ads, IAP, storage, analytics, haptics, share, backend transport는 platform boundary 뒤에 둔다. [evidence_id: PP-01; evidence_id: PP-02; evidence_id: PP-05]
- 한국어 기본, 영어 선택 가능 원칙은 유지한다. [evidence_id: PP-01; evidence_id: PP-02; evidence_id: PP-04]
- monetization/ads/login/payment/privacy scope가 열리면 Apps in Toss 공식 문서와 development gate를 다시 확인한다. [evidence_id: PP-04; evidence_id: PP-05]

## 9. Proposed next-stage inputs and open risks

### 9.1 UX should receive these inputs next
- 5 named preset의 label과 promise copy
- Intro floor에서 `왜 이 단계가 입문인지` 설명하는 onboarding 문구
- 결과 화면의 실패 이유 hierarchy와 retry CTA priority
- same-seed retry vs adjacent-preset CTA를 어떻게 충돌 없이 보여줄지에 대한 flow
- Daily challenge를 practice/custom과 혼동하지 않게 하는 entry framing
- feedback capture 질문 세트: smoothness, overlap readability, ramp clarity

### 9.2 Architecture should receive these inputs next
- internal calibration scale과 preset band를 실제 generator parameter에 매핑하는 방식
- smoothness/overlap/length/winding를 validation gate로 반영하는 품질 계약
- overlap 허용 범위를 preset별로 다르게 둘 수 있는 parameter ownership
- same-seed fairness contract와 result/telemetry schema
- mobile viewport QA matrix와 event naming contract
- platform boundary/i18n boundary 유지 조건

### 9.3 Open risks
| item | severity | why it matters | follow-up |
|---|---|---|---|
| Owner difficulty intent unresolved | HIGH | named preset 유지가 맞는지, 12 public levels를 나중에 원하는지 아직 확인이 필요하다 | CEO/Owner가 public exposure 원칙을 기록 |
| Device touch QA not yet run | HIGH | 코드 분석만으로 sharp-turn/overlap 체감을 확정할 수 없다 | 3 viewport 이상 QA 수행 |
| Overlap policy outside hard paths remains unresolved | HIGH | Intro/Easy exclusion은 계획상 타당하지만 실제 체감 검증이 필요하다 | preset별 overlap boundary 검증 |
| 0-100 mapping not validated | MEDIUM | internal calibration이 체감과 어긋나면 숫자 체계가 무의미해진다 | Architecture에서 mapping rule과 QA 검증 |
| Policy drift before monetization | MEDIUM | Apps in Toss / Google Play 정책은 구현 시점에 달라질 수 있다 | 구현 직전 공식 문서 재확인 |
| Budget/timeline missing | MEDIUM | scope가 다시 넓어질 수 있다 | short-loop 검증 원칙 유지 여부 확인 |

## 10. Development remains excluded
- 이 문서는 `무엇을 먼저 검증할지`를 고정한다. [owner_constraint: 00_PROJECT_BRIEF.md L31-33]
- 제품 코드 수정, 광고 SDK 연결, login/backend ranking/IAP 구현, Apps in Toss release execution, dev-builder task 생성은 Architecture 승인과 Owner의 개발 승인 전까지 시작하지 않는다. [owner_constraint: 00_PROJECT_BRIEF.md L31-33; owner_constraint: task required scope]
- 다음 gate에서 필요한 것은 implementation plan이 아니라 `UX/Architecture가 따라야 할 검증 언어와 경계`다. [owner_constraint: D-20260619-002 accepted_scope]

## 11. knowledge_candidates
없음. 이번 A2 revision은 Hidden Line 고유 결정의 정제와 boundary 강화가 중심이며, 즉시 승격할 만큼 일반화된 신규 지식은 추가로 확인되지 않았다.
