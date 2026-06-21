# Hidden Line Product Planning B Challenge Review

- task_id: t_2071cd6e
- reviewed_at: 2026-06-19
- verdict: VALIDATE_FIRST
- scope: read-only challenge review
- basis: `00_PROJECT_BRIEF.md`, `01_DECISIONS.md` D-20260619-002, `stages/05_MARKET_RESEARCH.md` v1.1.0, `stages/08_PRODUCT_PLAN.md`

## [CHALLENGE]

### 1) 12-level ladder를 사실상 확정 난이도로 읽히게 만드는 표현이 아직 과하다
- 반증/누락 근거: 승인된 시장조사와 제품계획 모두 현재 구현을 다축 시스템으로 설명하면서도, 동시에 외부 노출을 5개 preset과 0-100 단일축처럼 서술해 혼선을 남긴다. `12-level abstraction`이 설명용 band라고 적혀 있어도, Owner의 `12단계` 이해와 `12개 seed variant`를 같은 문맥에서 다루면 단일 서수 체계로 오해될 여지가 있다.
- 영향: UI/기획/검증 단계에서 `무엇이 공식 난이도인가`가 흔들리면, 다음 단계에서 난이도 노출 방식과 테스트 기준이 자꾸 바뀐다.
- 최소 수정/검증: "공식 노출 축", "내부 생성 축", "설명용 band"를 문장 단위로 분리하고, 12는 단지 variant 수라는 점을 재강조해야 한다. 5 preset이 아니라 12 band를 쓸지 여부는 Owner intent 확인 후 결정하는 편이 안전하다.
- CEO 결정 항목: 단일축 0-100 노출을 최종 UX로 확정할지, 다축 유지 + 설명 강화로 갈지.

### 2) 0-100 difficulty / floor 20 / smoothness·overlap·length·winding 정의는 아직 제품 테스트 가능한 수준까지 닫히지 않았다
- 반증/누락 근거: 계획은 각 개념의 product rule을 잘 정리했지만, 현재는 대부분이 설명 문구 수준이다. `complexityScore`를 0-100으로 변환하는 함수, `minComplexity`를 생성 게이트로 쓰는 검증, 그리고 실기기 touch QA로 체감 수치를 받아들이는 절차가 아직 선결 조건으로 남아 있다. 즉, 숫자와 체감이 실제로 연결되는지 아직 증명되지 않았다.
- 영향: 기획 단계에서 좋아 보이는 숫자라도, 실제 플레이에서는 “쉬움/어려움” 체감이 다르게 나올 수 있다. 특히 intro floor 20은 의미는 분명하지만 아직 측정 기준이 없다.
- 최소 수정/검증: 3개 viewport 이상에서 sharp turn, overlap, difficulty ramp를 정량/정성 혼합으로 측정하고, `difficultyIndex` 매핑을 먼저 검증해야 한다. smoothness 기준은 평균 각도보다도 사용자 불만 비율로 함께 봐야 한다.
- CEO 결정 항목: 0-100이 사용자-facing 공식 점수인지, 아니면 내부 매핑/설명용인지.

### 3) retention / monetization 경계는 방향은 맞지만, 아직 "어디까지 안 한다"가 더 강하게 고정돼야 한다
- 반증/누락 근거: 문서는 reward/interstitial/banner의 후보 위치를 제시하지만, 현재 단계에선 monetization branch를 열지 않겠다는 점이 더 중요하다. Apps in Toss/Google Play 문서 기준으로도 게임에서 점수·랭킹·승패 우위와 보상을 묶는 구조는 위험하고, 플레이 중 광고는 UX와 정책 모두에서 민감하다. 지금 계획은 대체로 안전하지만, “실행 후보” 표현이 너무 빨리 보이면 다시 범위가 넓어진다.
- 영향: 코어 재미 검증 전에 수익화 surface를 넓히면, 재미가 아니라 광고/보상 반응을 측정하게 되어 판단이 흐려진다. 정책적으로도 ranking/reward advantage 금지선이 흐려질 수 있다.
- 최소 수정/검증: 이번 단계에서는 수익화 후보를 본문보다 부록으로 밀고, hard boundary를 더 전면에 두어야 한다. 구현 전에는 정책 재확인과 core loop 검증이 모두 끝나기 전까지 monetization branch를 닫아 두는 것이 맞다.
- CEO 결정 항목: 이번 분기 내에 수익화 실험을 열지, 아니면 core feel 검증 완료 후로 완전히 미룰지.

## Verdict rationale
- `VALIDATE_FIRST`가 적절하다. A1은 방향 자체는 대체로 타당하지만, 난이도 표기 체계와 0-100 매핑, 그리고 수익화 경계는 아직 검증보다 설명이 앞서 있다.
- 따라서 다음 단계는 구현이 아니라, Owner intent 확인 + 실기기 touch QA + difficulty mapping 검증이다.

## Evidence used
- `00_PROJECT_BRIEF.md` L15-21
- `01_DECISIONS.md` D-20260619-002
- `stages/05_MARKET_RESEARCH.md` §F, §I, §K
- `stages/08_PRODUCT_PLAN.md` §§4, 5, 10, 11, 12, 13, 14, 15
- Apps in Toss game monetization guidance and app platform standard documents

## knowledge_candidates
- maturity: candidate
  summary: 게임/정밀 조작 앱은 내부 다축 난이도와 외부 단일 난이도 노출을 분리하면 튜닝 유연성과 사용자 이해를 동시에 확보할 수 있다.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/08_PRODUCT_PLAN.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/docs/workflows/app-market-validation.md
- maturity: candidate
  summary: 수익화 후보는 먼저 나열하기보다, core fun 검증 전에는 hard boundary를 전면에 두고 정책 경계와 UX 리스크를 닫는 편이 안전하다.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/05_MARKET_RESEARCH.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/docs/tools/apps-in-toss-ad-monetization-common.md
