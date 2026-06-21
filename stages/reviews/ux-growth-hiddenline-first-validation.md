# Hidden Line UX B Growth Challenge Review

- task_id: t_0abb694f
- reviewed_at: 2026-06-19
- verdict: CHANGES_REQUIRED
- scope: read-only challenge review
- basis: `00_PROJECT_BRIEF.md`, `01_DECISIONS.md` D-20260619-002, D-20260619-003, `stages/08_PRODUCT_PLAN.md`, `stages/10_UX_FINAL.md`, `stages/reviews/product-plan-hiddenline-difficulty.md`, platform/gate/monetization docs
- focus: first-value-after 재방문·측정·광고/정책 경계 검증

## [CHALLENGE]

### 1) next-session return loop를 측정할 이벤트와 장치가 없다 — D1 검증 가설이 무력화된다

- 반증 근거: 제품계획 5.3은 first validation retention의 한 축을 `next-session retention: Daily seed 또는 직전 실패의 재도전 이유가 남는다`로 명시했고, must-have에 Daily Challenge entry를 `next-session return 이유`로 포함했다. 그러나 UX §4.8 Daily Challenge Entry는 in-app 진입점만 정의할 뿐, 사용자가 앱을 닫은 뒤 다시 열게 만드는 장치가 없다. push notification, system reminder, widget, 또는 최소한 `localStorage` 기반 last-session-state 복원조차 이벤트로 추적되지 않는다. `daily_entry_opened` / `daily_run_started`는 이미 앱을 연 시점의 행동만 기록할 뿐, `return_next_day` 같은 cross-session 이벤트는 정의조차 안 됐다.
- 영향: 제품계획의 `next-session revisit 신호를 확인한다`(6.1-4)가 불가능해진다. Daily Challenge가 실제로 다음 날 재방문을 유도하는지, 아니면 같은 세션 안에서 소비되는지만 알게 된다. first validation의 핵심 검증 대상 중 하나가 증명 없이 남는다.
- 권장 대안: `return_next_day` 이벤트를 추가하고, source 파라미터(`notification`, `manual`, `daily_reminder`, `retry_failure`)로 구분한다. notification은 first validation에서 구현하지 않더라도, `manual` return과 `daily` return을 분리해 local time-window 기반으로 계측할 최소 구조를 둔다. Home의 "last played preset / last session state"를 localStorage에 쓰고, app_opened 시점에 읽어 `return_next_day` 판정을 내린다. 24h±6h window 안쪽의 `app_opened`를 return으로 본다.
- 필수 이벤트: `return_next_day` (source: `manual` | `daily_reminder`), `last_session_state_saved`, `last_session_state_loaded`
- 성공 기준: 테스트 기간 중 `return_next_day` 발생률이 20% 이상일 것. 중단 기준: 5일간 `return_next_day` 이벤트가 daily-entry-opened를 압도적으로 하회하면(CHANGES_REQUIRED), Daily Challenge 화면만으로는 D1을 만들 수 없다고 판단한다.

### 2) 결과 화면 CTA 4종이 동시 노출되어 same-seed retry 의도가 인접-preset 이동에 잠식된다

- 반증 근거: 제품계획 5.1은 첫 가치를 `실패한 뒤 왜 어려웠는지 납득하고 같은 seed로 즉시 다시 시도`로 정의했다. UX §4.5는 CTA 우선순위를 1. same-seed retry, 2. adjacent preset으로 정렬했지만, 동일 화면에 4개 CTA(retry, adjacent↑↓, daily, feedback)를 동시 노출한다. 한 판 실패 직후 `한 단계 낮게 해보기`가 눈에 띄면, 사용자는 회피 경로(더 쉬운 preset)를 선택해 `왜 실패했는지`를 납득하지 않고 넘어갈 수 있다. 특히 adjacent CTA가 `낮게`와 `높게` 양방향인 점이 선택 피로를 높인다.
- 영향: same-seed retry율이 떨어지면 `공정성 검증`과 `seed fairness` 가설이 모두 증명되지 않는다. 제품계획이 가장 중요하게 보는 retry loop가 UX 자체 배열 때문에 약화된다.
- 권장 대안: 결과 화면 최초 노출 시 same-seed retry CTA만 단독으로 1~2초 노출하고(progressive disclosure), 그 아래 "더 많은 선택" 탭으로 adjacent preset / daily challenge / feedback을 접근하게 한다. 또는 adjacent CTA를 실패 시에는 `한 단계 낮게`만, 완주 시에는 `한 단계 높게`만 단일 방향으로 제한해 선택지 수를 줄인다.
- 필수 이벤트: `retry_same_seed_started`, `adjacent_preset_selected` (기존 유지 + 시간차 측정을 위해 `result_viewed` 타임스탬프 포함)
- 성공 기준: `result_viewed` → `retry_same_seed_started` 전환율이 `adjacent_preset_selected` 전환율의 2배 이상일 것. 중단 기준: 실패 직후 adjacent 선택이 retry 선택보다 많으면(CONDITIONAL_REQUIRED), result 화면 CTA 구조 재설계.

### 3) 난이도 피드백이 3점 척도로 수렴해 제품계획의 정량 검증 기준을 만족시키지 못한다

- 반증 근거: 제품계획 6.4는 `smoothness 긍정 80%+`, `difficulty ramp 적절 70%+`, `overlap 어색함 30% 이하`를 성공 지표로 둔다. 그러나 UX §4.9의 difficulty feedback은 3점 척도(agree/neutral/disagree) + optional text다. 3점 척도는 80%/70%/30% 같은 임계치에 통계적으로 무의미하다. 또한 UX §7 이벤트 목록에 `sharp_turn_complaint_logged`가 누락됐다 — 제품계획 6.3은 이 이벤트를 minimum analytics events에 포함했고, smoothness 검증의 핵심 신호다.
- 영향: 제품계획이 요구하는 정량적 VALIDATE_FIRST 판단(통과/중단)이 불가능하다. 피드백 데이터를 모아도 "좋았다/보통/나빴다"만 남고, 80% smoothness 긍정 같은 결정적 임계치를 넘는지 판단할 수 없다. sharp_turn 이벤트 누락은 smoothness 검증을 완전히 맹목으로 만든다.
- 권장 대안: 피드백 척도를 5점 리커트로 올리고, "선이 자연스럽게 이어졌나요?"를 smoothness 단일 문항으로 분리하며, sharp-turn complaint는 warning_logged 시점에 자동 수집한다. `sharp_turn_complaint_logged` 이벤트를 UX §7에 복원한다. 질문은 최대 3문항으로 유지하되, 각각이 제품계획 6.4의 정량 기준에 매핑되게 매긴다.
- 필수 이벤트: `sharp_turn_complaint_logged` (복원), `difficulty_feedback_submitted`에 응답 척도 차원 포함, `difficulty_feedback_skipped`
- 성공 기준: 전체 run 대비 feedback_submitted 비율이 30%+이고, smoothness 긍정(4-5점) 80%+ 도달. 중단 기준: 5점 척도로도 smoothness 긍정이 60% 미만이면 현재 path feel 방향 kill 검토.

## Scope exposure check

- 12 public levels 노출 없음: UX는 5 named presets만 정의하며 12는 어디에도 언급되지 않는다. 통과.
- player-facing 0-100 노출 없음: UX는 named preset과 체감어로만 설명하며, 0-100은 internal calibration 박스에 갇혀 있다. 통과.
- monetization/reward surface 노출 없음: UX §8 제외 범위에 ads/IAP/reward UX implementation을 명시했고, 결과 화면에도 광고/보상 CTA가 없다. 통과.
- 로그인 gate 없음: Home에서 바로 시작 가능하며 login 요구가 플로우에 없다. 통과.

## Verdict rationale

`CHANGES_REQUIRED` — UX A1의 scope discipline(12 public levels 미노출, 0-100 비노출, monetization closed)은 훌륭하지만, 제품계획이 first validation의 핵심으로 삼은 `next-session return 측정`, `same-seed retry loop 우선성`, `difficulty feel 정량 검증` 세 축에 측정·구조적 공백이 있다. D1 return 이벤트 부재는 가설 자체를 검증 불가능하게 하고, CTA 동시 노출은 retry 의도를 잠식하며, 3점 척도 + `sharp_turn_complaint_logged` 누락은 정량적 pass/stop 판단을 막는다. 세 가지 모두 측정 이벤트 추가와 최소한의 노출 구조 조정으로 해결 가능하므로, 전면 재설계가 아니라 측정 계층 보강이 필요하다.

## Evidence used

- `00_PROJECT_BRIEF.md` L19-21
- `01_DECISIONS.md` D-20260619-002, D-20260619-003
- `stages/08_PRODUCT_PLAN.md` §§5.1, 5.3, 6.1-6.5
- `stages/10_UX_FINAL.md` §§4.5-4.9, 7, 11
- `stages/reviews/product-plan-hiddenline-difficulty.md` §§1-3
- `/Users/kangsungbae/Documents/지식저장소/projects/hiddenline/platform.md`
- `/Users/kangsungbae/Documents/지식저장소/docs/tools/apps-in-toss-game-ads-points-monetization.md` §게임 보상 경계, §빈도 제한
- `/Users/kangsungbae/Documents/지식저장소/docs/workflows/apps-in-toss-development-gate.md` §4 디자인/UX

## knowledge_candidates

- maturity: candidate
  summary: first validation 단계에서 next-session return을 검증하려면 `return_next_day` 이벤트와 source 파라미터를 분리하고, notification 없이도 local time-window 기반 계측 구조를 먼저 둬야 한다.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/10_UX_FINAL.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/docs/workflows/app-market-validation.md

- maturity: candidate
  summary: core retry loop가 first value인 앱은 결과 화면에서 same-seed retry를 단독 최우선 CTA로 노출하고, adjacent-preset 이동은 progressive disclosure 뒤로 밀어 retry 의도 보존과 ramp 검증을 분리해야 한다.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/10_UX_FINAL.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/projects/hiddenline/platform.md

- maturity: candidate
  summary: difficulty feel의 정량 검증이 필요한 퍼즐/조작 앱은 피드백 척도를 5점 이상으로 두고, 제품계획의 구체적 임계치(m×80%+ 등)에 매핑되는 문항 설계가 선행돼야 3점 척도의 통계적 무의미를 피할 수 있다.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/08_PRODUCT_PLAN.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/docs/workflows/app-market-validation.md
