# Hidden Line Market Research B — challenge review

- verdict: VALIDATE_FIRST
- reviewed_at: 2026-06-19
- task: t_40288c65
- scope: read-only review of A1 evidence, current code state, and revenue/policy implications

## [CHALLENGE]

### 1) 난이도는 "12단계"가 아니라 다축 시스템이다
- 반증/누락 근거: `src/game/types.ts`, `src/game/config.ts`, `src/game/dailyPack.ts`, `src/game/pathGenerator.ts`를 보면 난이도는 `DifficultyId(4) × LineDifficultyId(3) × VisibilityLevelId(3) × GeneratorProfileId(4)`의 축 조합으로 구현돼 있다. `dailyPack.ts`의 12는 daily seed variant 수일 뿐, 단일 난이도 서수가 아니다.
- 영향: A2가 "0~100 단일 난이도"를 전제로 설계하면 현재 구현과 어긋난다. Owner가 원하는 것은 단일 슬라이더인지, 다축 유지인지 먼저 확정해야 한다.
- 최소 수정/검증: A2에 "현재는 다축 시스템"을 명시하고, `0-100`은 UI/설명용 추상화인지 실제 생성 게이트인지 분리해 적는다.
- CEO 결정 항목: 단일축 UX로 통합할지, 다축을 유지하고 설명만 보강할지.

### 2) 꺾임/겹침 평가는 맞지만, 체감 문제는 실기기 QA로 다시 확인해야 한다
- 반증/누락 근거: `pathGenerator.ts`는 `maxTurnAngle >= 1.05 rad`를 reject하고, hard path만 self-intersection을 허용한다. 다만 hard 모드의 tertiary multiplier(1.82)와 3-point smoothing은 여전히 손가락 체감에서 급작스럽게 느껴질 수 있다. 지금 문서의 판단은 코드 근거는 충분하지만, "얼마나" 급작스러운지는 아직 실기기 검증이 없다.
- 영향: 곡선 전환, spline 교체, overlap 정책 변경 같은 코어 재미 변경을 바로 확정하면 과도하거나 반대로 과소수정될 수 있다.
- 최소 수정/검증: A2에 실기기 touch QA와 before/after 비교 지표를 넣고, sharp-turn/overlap은 코드 증거 + 체감 검증을 분리한다.
- CEO 결정 항목: hard에서만 overlap 허용하는 현재 정책을 유지할지, easy/normal까지 확대할지.

### 3) 광고수익 최대화는 현재 단계에서 과도하며 정책 리스크 설계가 먼저다
- 반증/누락 근거: 현재 코드에는 광고/IAP/login/backend surface가 없고, 마스터 플랜도 monetization을 P3 이후로 미룬다. Apps in Toss 가이드는 게임에서 점수/랭킹/확률형 결과와 토스포인트를 직접 연결하지 말라고 하고, 광고는 플레이를 방해하지 않는 세션 경계에 두라고 한다. Google Play 쪽도 핵심 플레이를 막는 광고/오해 유도 CTA를 금지한다.
- 영향: "광고수익 최대화"를 지금부터 우선순위로 두면 핵심 재미 검증을 왜곡하거나 정책 위반 UX로 흐를 수 있다.
- 최소 수정/검증: A2에서 수익화는 "추후 검증 대상"으로 내리고, 현재는 core loop + retention 기준선 + 정책 허용 범위만 정의한다.
- CEO 결정 항목: 초기 수익화는 실패 후 재도전/결과 화면 같은 선택형 보상만 둘지, 아니면 아예 비수익화로 코어 검증을 먼저 할지.

## 판단 메모
- A1의 핵심 기술 근거 자체는 대체로 타당하다. 다만 "12단계"와 "0~100 난이도"는 현재 구현 설명과 다르므로 A2에서 용어를 정리해야 한다.
- 수익화는 현재 상태에선 설계보다 보류가 맞다. 정책/UX 리스크를 먼저 닫지 않으면 광고 최대화 논의가 선행될 이유가 약하다.

## [HANDOFF]

### knowledge_candidates
- maturity: confirmed
  summary: Hidden Line의 난이도는 단일 12단계가 아니라 Difficulty/LineDifficulty/Visibility/GeneratorProfile의 다축 조합으로 구현돼 있다.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/src/game/types.ts
  suggested_owner_file: /Users/kangsungbae/Documents/hiddenline/stages/05_MARKET_RESEARCH.md
- maturity: confirmed
  summary: Hidden Line의 path generator는 hard에서만 self-intersection을 허용하고, turn-angle cap과 linear smoothing으로 곡선을 제한한다.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/src/game/pathGenerator.ts
  suggested_owner_file: /Users/kangsungbae/Documents/hiddenline/stages/05_MARKET_RESEARCH.md
- maturity: confirmed
  summary: 초기 수익화 설계는 현재 단계에서 premature이며, Apps in Toss/Google Play 정책상 core play를 막는 광고와 점수·랭킹 연계 보상은 피해야 한다.
  evidence_path: /Users/kangsungbae/Documents/지식저장소/docs/tools/apps-in-toss-game-ads-points-monetization.md
  suggested_owner_file: /Users/kangsungbae/Documents/hiddenline/stages/05_MARKET_RESEARCH.md
