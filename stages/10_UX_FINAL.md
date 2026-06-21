---
version: 0.2.0
status: final-candidate
updated: 2026-06-19
canonical: true
phase: UX A2 revision
project: Hidden Line / 히든라인
basis_date: 2026-06-19
source_artifacts:
  - /Users/kangsungbae/Documents/hiddenline/00_PROJECT_BRIEF.md
  - /Users/kangsungbae/Documents/hiddenline/01_DECISIONS.md
  - /Users/kangsungbae/Documents/hiddenline/stages/08_PRODUCT_PLAN.md
  - /Users/kangsungbae/Documents/hiddenline/stages/reviews/product-plan-hiddenline-difficulty.md
  - /Users/kangsungbae/Documents/hiddenline/stages/reviews/ux-growth-hiddenline-first-validation.md
  - /Users/kangsungbae/Documents/지식저장소/AI_CONTEXT.md
  - /Users/kangsungbae/Documents/지식저장소/agent/index.md
  - /Users/kangsungbae/Documents/지식저장소/agent/profile.md
  - /Users/kangsungbae/Documents/지식저장소/agent/operating-rules.md
  - /Users/kangsungbae/Documents/지식저장소/docs/workflows/app-platform-standard.md
  - /Users/kangsungbae/Documents/지식저장소/docs/tools/apps-in-toss-platform.md
  - /Users/kangsungbae/Documents/지식저장소/docs/workflows/apps-in-toss-development-gate.md
  - /Users/kangsungbae/Documents/지식저장소/docs/tools/apps-in-toss-game-ads-points-monetization.md
  - /Users/kangsungbae/Documents/지식저장소/projects/hiddenline/platform.md
scope_status: final-candidate-for-ceo-review
---

# [REVISION] Hidden Line UX A2 — first validation flow

이 문서는 CEO 승인 전 UX 최종 후보안이다. 최종 확정본이 아니며, 12 public levels / player-facing 0-100 promise / monetization implementation은 포함하지 않는다.

## 0. B challenge response

| challenge | decision | changed sections |
| --- | --- | --- |
| next-session return 측정 부재 | ACCEPT | 4.8, 5, 7, 9, 11 |
| 결과 화면 CTA 동시 노출로 retry 의도 잠식 | ACCEPT | 4.5, 4.7, 5, 11 |
| 3점 척도 + sharp_turn_complaint_logged 누락 | ACCEPT | 4.9, 7, 11 |
| 12 public levels / player-facing 0-100 / monetization scope | REJECT as challenge scope expansion | no change; preserved approved exclusions |

### B response notes
- return_next_day는 앱 재진입 시점에 판정하고 source를 분리한다.
- result 화면은 same-seed retry를 first reveal로 우선 노출하고, 나머지는 progressive disclosure로 둔다.
- difficulty feedback은 5점 척도로 올리고 sharp-turn complaint를 자동 수집한다.

## 1. 핵심 사용자 / trigger / first value

- 핵심 사용자: 짧은 세션에서 손가락 정밀 조작 실력을 시험하고 싶어 하는 모바일 플레이어
- trigger moment: “지금 1~3분만 집중해서 바로 한 판 해보고 싶다”는 순간
- first value: 사용자가 설명을 길게 읽지 않고 첫 판을 시작한 뒤, 실패하더라도 왜 어려웠는지 납득하고 같은 seed 또는 인접 preset으로 즉시 다시 시도하는 순간

## 2. 핵심 루프

1. 앱 진입
2. preset 선택 또는 바로 시작
3. 숨은 선 추적
4. 실패/완주 결과 확인
5. 같은 seed 재시도 또는 인접 preset 이동
6. Daily Challenge 또는 practice 재진입
7. 난이도 체감 피드백 제출

## 3. 첫 검증용 정보 구조

첫 공개 노출은 5 named presets만 둔다.

- Intro
- Easy
- Standard
- Hard
- Expert

내부적으로는 0-100 calibration이 존재할 수 있으나, UX는 이를 숫자로 약속하지 않는다. Intro는 onboarding floor band(20+)를 대표하는 입문 구간으로 설명한다.

## 4. 화면 명세

### 4.1 Home / Start

목적
- 사용자가 바로 시작할 수 있게 한다
- 앱의 정체성을 한 문장으로 이해시킨다
- Daily Challenge와 practice 진입을 분리한다

주요 요소
- 타이틀: Hidden Line
- 짧은 설명: “보이지 않는 선을 손끝으로 따라가세요.”
- primary CTA: `바로 시작`
- secondary CTA: `난이도 고르기`
- tertiary entry: `오늘의 도전`
- optional help entry: `어떻게 하는 게임인가요?`

데이터
- last played preset
- daily challenge availability
- first-run onboarding seen 여부

상태
- loading: last session / daily seed 확인 중
- empty: 첫 실행 시 추천 preset만 표시
- error: daily seed 조회 실패 시 practice로 우회
- success: last played preset으로 기본 포커스 이동
- disabled: daily challenge 미오픈 시 비활성화 및 이유 표시

권장 행동
- 첫 실행은 Intro를 기본값으로 보여주고, `바로 시작`은 Intro로 진입
- 재방문 시 마지막 preset 또는 마지막 실패 preset을 우선 추천

### 4.2 Preset Selection

목적
- 사용자가 난이도 이름만 보고 공정한 범위를 고른다
- 숫자 약속 없이 체감 차이를 이해하게 한다

카드 카피
- Intro: “처음이라면 여기서 감을 익혀요.”
- Easy: “조금 더 길지만 부담은 낮아요.”
- Standard: “길이와 구불거림이 분명해져요.”
- Hard: “읽고 버티는 힘이 필요해요.”
- Expert: “숙련자용 고난도예요.”

CTA
- primary: `이 난이도로 시작`
- secondary: `이전/다음 난이도`

상태
- loading: preset list hydrate 중
- empty: preset 정보 미수신 시 기본 5개만 표시
- error: preset metadata 실패 시 텍스트만 표시
- success: 선택 preset 강조
- disabled: Expert 등 상위 preset 잠금이 필요하다면 이유 표기

### 4.3 Onboarding / Floor 20 설명

목적
- 첫 판 전에 왜 Intro가 존재하는지 설명한다
- `가장 낮은 단계도 20부터 시작`이라는 내부 기준을 숫자 약속처럼 보이지 않게 전달한다

핵심 문구
- “첫 공개 구간은 입문용으로 설계되어 있어요.”
- “공식 점수보다, 선의 느낌과 손의 안정감을 먼저 익히는 구간이에요.”
- “실패해도 괜찮아요. 같은 seed로 다시 시도할 수 있어요.”

CTA
- primary: `시작하기`
- secondary: `난이도 보기`

상태
- loading: intro helper 준비 중
- empty: text-only onboarding
- error: onboarding 이미지/도식 실패 시 문구만 유지
- success: 시작 버튼 활성화
- disabled: 첫 실행 중이 아니면 skip 가능

### 4.4 Gameplay Guidance / Warnings

목적
- 플레이 도중 과도한 설명 없이 주의 신호만 준다
- 조작 실패를 사용자 실수/설계 문제로 혼동하지 않게 한다

노출 규칙
- 시작 직전 1회만 짧게 안내
- 플레이 중에는 과한 팝업을 띄우지 않음
- warning은 결과에 영향을 줄 수 있는 경우에만 표시

예시 안내
- “손가락이 너무 빨라지면 경로를 놓칠 수 있어요.”
- “갑자기 꺾이는 느낌이 들면 속도를 줄여보세요.”
- “겹치는 구간은 천천히 읽는 것이 좋아요.”

warning 유형
- speed warning
- jitter warning
- off-path warning
- idle warning

상태
- loading: warning text fetch / locale hydrate
- empty: warning 없음
- error: warning service 실패 시 조용히 무시
- success: 필요 시에만 비침입적으로 표시
- disabled: 튜토리얼 완료 후에는 반복 표시 최소화

### 4.5 Failure / Completion Result

목적
- 결과를 한눈에 이해시키고 즉시 재도전으로 연결한다
- 실패 이유를 납득 가능하게 보여준다
- same-seed retry를 first reveal로 우선 보이게 해 retry 의도를 보존한다

표시 항목
- run result: 완주 / 실패
- 주요 이유: 속도 과다, 흔들림, 이탈, 시간 초과 등
- current preset summary
- same-seed retry CTA
- more actions: adjacent preset, daily challenge, difficulty feedback

CTA 우선순위
1. `같은 seed로 다시 하기`
2. `더 많은 선택`
3. `한 단계 낮게 해보기` / `한 단계 높게 해보기`
4. `오늘의 도전`
5. `난이도 느낌 남기기`

상태
- loading: result 계산 중
- empty: 정보 부족 시 최소 결과만 표시
- error: 판정 실패 시 완주/실패와 retry만 유지
- success: 상세 요약 표시
- disabled: daily CTA는 오픈일이 아닐 때 비활성화

### 4.6 Same-seed Retry

목적
- 공정성을 보여준다
- 실패 원인이 난이도인지 조작인지 분리해본다

규칙
- 같은 seed와 같은 preset을 유지한다
- 결과 후 바로 접근 가능해야 한다
- `왜 같은 판을 다시 하나요?`에 대한 한 줄 설명을 제공한다

문구
- “같은 조건으로 다시 도전해 보세요.”
- “경로는 같고, 이번엔 손의 감각만 바뀝니다.”

### 4.7 Adjacent-preset CTA

목적
- 너무 어려웠을 때는 한 단계 낮게, 너무 쉬웠을 때는 한 단계 높게 연결한다
- preset ramp를 자연스럽게 검증한다

규칙
- result 최초 노출에서는 adjacent preset을 숨기고, `더 많은 선택`을 눌러야 보이게 한다
- 현재 preset 기준 인접 1단계만 제안
- 여러 선택지로 흐름을 복잡하게 만들지 않음
- Intro는 더 쉬운 방향만 우선 노출 가능

문구
- `한 단계 낮게 해보기`
- `한 단계 높게 해보기`

### 4.8 Daily Challenge Entry

목적
- 다음 날 다시 올 이유를 만든다
- practice와 official-style challenge를 혼동하지 않게 한다
- 앱 재진입 시 return_next_day 판정을 위한 진입점이 된다

노출 규칙
- Home에서 진입 가능
- Result에서도 진입 가능
- practice와 분리된 entry로 보이게 한다

문구
- “오늘의 같은 도전”
- “모두가 같은 조건으로 플레이해요.”

상태
- loading: daily seed 확인 중
- empty: 오늘의 도전 없음
- error: practice fallback 노출
- success: daily challenge 시작 가능
- disabled: 시간 전/후에는 시작 불가 안내

### 4.9 Difficulty Feedback Capture

목적
- 숫자 추정이 아니라 체감 데이터를 수집한다
- smoothness / overlap readability / ramp clarity를 검증한다
- 5점 척도로 정량 기준과 연결한다

질문 예시
- “선이 자연스럽게 이어졌나요?”
- “겹치는 구간이 읽을 만했나요?”
- “이 난이도는 적절했나요?”
- “어려웠다면 무엇 때문에 어려웠나요?”

응답 방식
- 5점 리커트 + optional text
- run 후 1회만 요청
- skip 가능

상태
- loading: survey hydrate 중
- empty: skip 가능
- error: 제출 실패 시 다음 판 진행을 막지 않음
- success: 제출 완료 후 감사 문구
- disabled: 이미 제출했으면 재요청하지 않음

## 5. 상태표

| Screen | loading | empty | error | success | disabled |
| --- | --- | --- | --- | --- | --- |
| Home/Start | last session, daily seed hydrate | first-run default preset | daily fallback to practice | resume last preset | daily closed |
| Preset Selection | preset list fetch | default 5 presets | text-only fallback | selected preset highlighted | locked preset hidden or explained |
| Onboarding | intro helper hydrate | short text only | no image, text only | start enabled | skip shown when non-first-run |
| Gameplay Guidance | warning text hydrate | no warning | silent fail-open | contextual warning only | repeat warning suppressed |
| Result | score/summary compute | minimal result | fallback result only | full summary + CTAs | daily CTA disabled if unavailable |
| Same-seed Retry | seed preserve | none | if seed missing, regenerate and explain | restart same conditions | unavailable only if seed lost |
| Adjacent Preset | neighbor resolve | one-step suggestion | fallback to preset list | one-step CTA ready | no suggestion if edge preset |
| Daily Challenge | seed hydrate | unavailable message | practice fallback | official-style start | time-gated closed |
| Feedback Capture | question hydrate | skipable | ignore failure | submit complete | already submitted |

## 6. 문구 원칙

- 숫자보다 체감어를 먼저 쓴다
- `쉽다/어렵다`보다 `길다/구불거린다/겹친다/읽기 어렵다`처럼 이유가 보이는 표현을 쓴다
- 한국어 기본, 영어 선택 가능 구조를 유지한다
- CTA는 다음 행동을 명확히 드러내야 한다
- 광고나 보상처럼 오해될 표현은 사용하지 않는다

예시 카피
- `바로 시작`
- `난이도 고르기`
- `같은 seed로 다시 하기`
- `한 단계 낮게 해보기`
- `오늘의 도전`
- `난이도 느낌 남기기`

## 7. 이벤트

- `app_opened`
- `home_viewed`
- `preset_list_viewed`
- `preset_selected`
- `onboarding_viewed`
- `run_started`
- `warning_shown`
- `run_failed`
- `run_completed`
- `result_viewed`
- `retry_same_seed_started`
- `adjacent_preset_selected`
- `daily_entry_opened`
- `daily_run_started`
- `return_next_day`
- `last_session_state_saved`
- `last_session_state_loaded`
- `difficulty_feedback_prompted`
- `difficulty_feedback_submitted`
- `sharp_turn_complaint_logged`
- `speed_warning_logged`
- `jitter_warning_logged`
- `overlap_confusion_logged`

## 8. 제외 범위

- 12 public levels 확정 노출
- player-facing 0-100 promise
- login gate before first value
- ads / IAP / reward UX implementation
- ranked economy tied to rewards
- platform SDK direct calls in domain logic
- gameplay-blocking modal ads
- fake scarcity or confusing CTA hierarchy
- Apps in Toss execution work
- development start

## 9. 미확정 가정

- Intro floor band의 정확한 생성 매핑은 Architecture에서 확정해야 한다
- `5 named presets`의 실제 파라미터 간격은 아직 가설이다
- Daily Challenge가 practice와 동일한 화면 shell을 공유할지 여부는 이후 refinement가 필요하다
- feedback 질문 수는 3문항으로 충분할지 추가 검증이 필요하다
- 로그인 없이 first validation을 유지할지, 추후 세이브/동기화가 생길 때만 계정이 필요한지 확인이 필요하다

## 10. Open risks

1. Owner difficulty intent와 player-facing preset 언어가 어긋날 수 있음
2. device touch QA에서 좁은 화면의 손가락 가림과 bottom CTA 충돌 가능성
3. overlap policy가 너무 보수적이면 난이도 상승이 약해질 수 있음
4. Daily Challenge entry가 practice와 혼동될 가능성
5. difficulty feedback이 주관적 잡음으로 끝날 가능성
6. Google Play first validation과 Apps in Toss compatibility를 동시에 만족하는 shell copy 정리가 필요함

## 11. Validation questions

- 사용자는 Intro를 “너무 쉬운 연습”이 아니라 “입문용 검증 구간”으로 이해하는가?
- 5 preset만으로도 난이도 순서가 자연스럽게 읽히는가?
- 결과 화면에서 same-seed retry가 가장 먼저 눌릴 만큼 설득력 있는가?
- adjacent preset CTA가 retry 의지를 방해하지 않는가?
- Daily Challenge가 별도 목적지로 충분히 구분되는가?
- feedback prompt가 귀찮지 않으면서도 유의미한 응답을 받는가?

## 12. knowledge_candidates

- maturity: candidate
  summary: 게임형 정밀 조작 앱은 내부 난이도 축을 유지하되 첫 공개 UI는 named preset으로 줄이면 학습 부담을 낮추면서 ramp 검증을 할 수 있다.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/08_PRODUCT_PLAN.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/docs/workflows/app-market-validation.md
- maturity: candidate
  summary: first-value 전에 로그인과 수익화 surface를 열지 않으면 핵심 조작 루프와 난이도 체감을 더 직접적으로 검증할 수 있다.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/08_PRODUCT_PLAN.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/docs/workflows/apps-in-toss-development-gate.md
- maturity: candidate
  summary: 결과 화면의 same-seed retry와 adjacent-preset CTA를 함께 두면 공정성 검증과 난이도 ramp 검증을 동시에 수집할 수 있다.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/08_PRODUCT_PLAN.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/projects/hiddenline/platform.md

## 13. Handoff

- Output path: `/Users/kangsungbae/Documents/hiddenline/stages/10_UX_FINAL.md`
- Evidence docs read: `00_PROJECT_BRIEF.md`, `01_DECISIONS.md`, `stages/08_PRODUCT_PLAN.md`, `stages/reviews/product-plan-hiddenline-difficulty.md`, `AI_CONTEXT.md`, `agent/index.md`, `agent/profile.md`, `agent/operating-rules.md`, `app-platform-standard.md`, `apps-in-toss-platform.md`, `apps-in-toss-development-gate.md`, `apps-in-toss-game-ads-points-monetization.md`, `projects/hiddenline/platform.md`
- Scope changes: none; preserved approved scope of 5 named presets, internal 0-100 calibration only, monetization closed, no dev start
- Next expected profile: `ux-growth`
- Notes: proposal only, awaiting CEO gate / growth review
