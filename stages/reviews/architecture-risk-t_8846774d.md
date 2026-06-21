# Hidden Line Architecture B Risk Challenge Review

- task_id: t_8846774d
- reviewed_at: 2026-06-19
- verdict: CHANGES_REQUIRED
- scope: read-only challenge review
- basis: `AGENTS.md`, `00_PROJECT_BRIEF.md`, `01_DECISIONS.md` D-20260619-004, `stages/20_ARCH_FINAL.md`, `stages/10_UX_FINAL.md`, `stages/08_PRODUCT_PLAN.md`, `stages/reviews/ux-growth-hiddenline-first-validation.md`, platform/gate/i18n docs
- focus: overengineering/cost, determinism, privacy/policy, UX-to-architecture gaps, testability

## [CHALLENGE]

### 1) Event contract gap — Architecture §6.1 misses 8 Product Plan minimum analytics events; overlap event naming mismatches across artifacts

- 반증 근거: Product Plan §6.3은 14개의 minimum analytics events를 명시했고, apps-in-toss-development-gate.md §7은 "Product/UX에서 승인된 검증 이벤트와 Architecture/구현 이벤트명이 다르면 명시적 매핑 테이블이 있는가? 검증 지표에 쓰이는 이벤트 누락은 개발 전 CHANGES_REQUIRED로 처리한다"고 규정한다. 그러나 Architecture §6.1은 12개의 required events를 정의했지만, Product Plan의 minimum events 14개 중 8개가 Architecture에 전혀 등장하지 않는다.

Architecture §6.1에 누락된 Product Plan §6.3 minimum events:
- `app_opened`
- `preset_selected`
- `run_started`
- `warning_shown`
- `run_failed`
- `run_completed`
- `daily_entry_opened`
- `daily_run_started`

또한 naming mismatch:
- Architecture §6.1: `overlap_warning_logged`
- Product Plan §6.3: `overlap_confusion_logged`
- UX §7: `overlap_confusion_logged`

Architecture §4.2에서 `overlap warning`이라는 용어를 사용하지만, Product Plan §4.6의 fail signal은 "어디가 길인지 읽히지 않는다" — 즉 `confusion`에 더 가깝다. `warning_logged`는 경고 횟수, `confusion_logged`는 난이도 체감 실패를 의미해 분석 목적이 다르다.

- 영향: Product Plan §6.4는 `smoothness 긍정 80%+`, `difficulty ramp 적절 70%+`, `overlap 어색함 30% 이하`라는 pass/stop rule을 정의한다. Architecture가 기본 게임 루프 이벤트(`app_opened`, `preset_selected`, `run_started`, `run_failed`, `run_completed` 등)를 event contract에 포함하지 않으면, 구현 단계에서 이벤트 스키마가 분기되고 validation gate 판단이 불가능해진다. `overlap_warning_logged`로 로깅하면 "overlap 어색함 30% 이하" 지표를 confusion 기반으로 계산하지 못한다.

- 권장 대안:
  1. Architecture §6.1에 Product Plan §6.3의 누락된 8개 minimum events를 추가한다.
  2. `overlap_warning_logged` → `overlap_confusion_logged`로 rename하여 Product Plan / UX와 일치시킨다.
  3. Architecture §6에 event-mapping table을 추가한다: Product Plan minimum event → Architecture event → UX event의 3열 매핑. convention proof: apps-in-toss-development-gate.md §7 line 80 (event mismatch → CHANGES_REQUIRED).

- 검증법: Architecture §6.1의 event set이 Product Plan §6.3의 14개 minimum events를 전부 포함하는지 grep 검증. `overlap_confusion_logged`가 `overlap_warning_logged` 대신 사용되는지 확인.

### 2) Free-text PII boundary undefined — difficulty_feedback_submitted event의 optional text 필드가 analytics 경계를 넘을 위험

- 반증 근거: UX §4.9는 Difficulty Feedback에 "5점 리커트 + optional text"와 "어려웠다면 무엇 때문에 어려웠나요?"라는 자유 텍스트 질문을 포함한다. Architecture §6.2는 feedback shape를 `overall difficulty`, `smoothness/readability`, `overlap clarity`로 정의했지만, optional text의 PII 경계를 전혀 규정하지 않는다. Architecture §6.3은 "local analytics sink records them during no-login validation"과 "platform analytics adapter forwards them later"로 파이프라인을 정의했지만, 어떤 데이터가 forwarding 전에 제외되어야 하는지 명시하지 않았다.

app-platform-standard.md line 107: "local-first 앱은 MVP에서 로컬 저장소를 개인정보 경계로 둔다. 동기화, 내보내기, 서버 저장처럼 로컬 밖으로 데이터를 이동하는 기능은 별도 승인된 결정과 privacy impact review 없이는 구현하지 않는다."

이 finding은 동일한 Architecture B challenge에서 반복 발견된 패턴이다: t_f7cbc27a (칭찬해줘)는 free-text feedback의 analytics 전송을 PII risk로 지적했고, t_40698451 (라이어게임)도 free-text feedback PII 경계 미정의를 CHANGES_REQUIRED 사유로 들었다. Hidden Line도 동일한 위험 구조를 가지고 있다.

- 영향: 사용자가 "어려웠다면 무엇 때문에 어려웠나요?"에 "제 이름은 김XX인데 손이 너무 떨려서..." 같은 텍스트를 입력하면, `difficulty_feedback_submitted` 이벤트가 PII를 포함한 채 analytics adapter를 통해 외부로 전송될 수 있다. no-login local-first MVP의 개인정보 경계가 깨진다.

- 권장 대안: Architecture §6.2에 다음을 추가한다:
  1. `difficulty_feedback_submitted` 이벤트의 free-text 필드는 analytics 전송 대상에서 제외하거나, 전송 전 domain sanitizer를 통과시킨다.
  2. Sanitizer contract: 전화번호 패턴(`\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4}`), 이메일 패턴, 8자리 이상 연속 숫자, 한글 이름 패턴(2-4자)을 제거하고 남은 텍스트만 전송한다.
  3. Architecture §5.3 privacy posture에 "local-first app의 free-text 입력은 로컬 저장소를 PII 경계로 하며, 외부 전송 시 sanitizer를 통과한다"는 원칙을 명시한다.

- 검증법: Architecture §6.2에 "free-text excluded from analytics transmission" 또는 "domain sanitizer" 언급이 있는지 확인. §5.3에 PII boundary 원칙이 추가되었는지 확인.

### 3) RNG/determinism specification incomplete — PRNG algorithm 미지정, seed→path fixture 부재로 same-seed fairness 검증 불가

- 반증 근거: Architecture §2.2는 "Path generation must be pure from seed + preset + generation version"이라 명시하지만, PRNG algorithm을 지정하지 않았다. §2.1은 "Seed generation should be deterministic from a stable input tuple"라 정의하지만, input tuple을 seed integer로 변환하는 derivation function을 명시하지 않았다. §8.1은 "same seed generates same path"를 검증해야 한다고 하지만, 구체적인 seed 값과 예상 path 출력(fixture)을 하나도 제시하지 않았다.

Architecture §9 Open risk #1: "curve generation may differ across runtime/platform math implementations if implementation relies on unstable floating-point behavior" — floating-point만 언급하고 RNG algorithm variation은 다루지 않았다.

실제 리스크: JavaScript `Math.random()`은 seedable하지 않고 엔진별로 구현이 다르다. seededrandom, xoshiro128, SplitMix64 같은 seeded PRNG는 같은 numeric seed를 넣어도 서로 다른 sequence를 생성한다. PRNG algorithm을 Architecture에 명시하지 않으면, 구현자가 임의로 선택한 PRNG가 다른 기기/다른 빌드에서 다른 path를 생성할 수 있다.

- 영향: D-20260619-004의 핵심 승인 범위인 "same-seed retry first"와 "같은 seed로 공정한 재도전"이 플랫폼/기기 간에 깨질 수 있다. same-seed retry가 다른 기기에서 다른 path를 보여주면 제품의 공정성 약속(fairness contract) 전체가 무너진다. §8.5의 migration safety도 PRNG algorithm 없이는 generation version만으로 호환성을 보장할 수 없다.

- 권장 대안:
  1. Architecture §2.2에 PRNG algorithm을 명시한다. 예: "SplitMix64를 seed를 64-bit state로 초기화하여 사용, 출력은 [0,1) double로 변환" 또는 특정 npm package name (e.g., `seedrandom` with algorithm `tychei`).
  2. Architecture §2.1에 seed derivation function을 정의한다: mode × date_bucket × preset_id → hash function → integer seed. hash function으로는 SHA-256 truncated to 64-bit 또는 djb2 등 결정론적 알고리즘을 지정.
  3. Architecture §8.1에 최소 1개의 concrete fixture를 추가한다: 특정 seed 값 + 특정 preset + 특정 generation version → 예상 start point, end point, control-point checksum. 이 fixture는 cross-platform regression test의 기준이 된다.
  4. Architecture §9 Open risk #1에 "RNG algorithm variation across platforms"를 floating-point risk와 함께 명시한다.

- 검증법: Architecture §2.2에 특정 PRNG algorithm 이름 또는 npm package name이 명시되었는지 확인. §8.1에 seed/preset/fixture 예시가 추가되었는지 확인.

## Overengineering/cost check

Architecture §7.2는 9개 adapter boundary(auth/login, ads, IAP, storage, analytics, haptics, share, backend transport, locale resolution)를 정의한다. 이 중 first validation에서 실제 필요한 것은 storage(로컬 지속성), analytics(이벤트 로깅), locale resolution(i18n) 3개뿐이며, haptics는 선택적이다. 나머지 5개(auth, ads, IAP, share, backend transport)는 D-20260619-004 excluded scope에 해당한다.

Architecture §7.2는 "For this stage, only define the boundaries; do not invent concrete SDK integration work"라고 명시해 과구현을 방지하고 있어, 이 자체로는 CHANGES_REQUIRED 수준이 아니다. 다만 9개 adapter boundary를 모두 Architecture 문서에 나열하는 것은 app-platform-standard.md line 15("승인되지 않은 capability는 범위 밖으로 두고, 필요가 확정될 때 어댑터를 추가한다")의 권장보다 넓다. 향후 Architecture A2 revision에서 out-of-scope adapter를 §7.2에서 분리해 "later-only adapter boundaries"로 명시적으로 구분하는 것이 비용/scope 통제에 도움이 된다. 현 단계에서는 PASS로 판단한다.

## UX-to-architecture gap check (supplementary)

Event contract gap(Issue 1) 외에 추가로 확인된 사항:

- Architecture §4.1 state machine은 10개 state를 정의하지만, UX §4의 화면 명세(Home/Start, Preset Selection, Onboarding, Gameplay Guidance, Result, Same-seed Retry, Adjacent Preset, Daily Challenge, Feedback Capture)를 state로 충분히 매핑하지 않았다. 특히 `onboarding`, `preset_selection`, `daily_entry` 화면이 state machine에 명시적 state로 없다. Architecture §4.1에 `onboarding`, `preset_selection`, `daily_entry` state를 추가하거나, §4.1이 UX state가 아니라 core game state만 표현한다는 경계를 문서화해야 한다.
- Architecture §4.2 warning types는 speed, jitter, overlap, idle, off-path 5종이다. UX §4.4 warning types는 speed, jitter, off-path, idle 4종이다 — Architecture에만 있는 `overlap warning`이 UX에 대응되는 UX warning이 없으므로, Architecture §4.2의 overlap warning이 UX의 어떤 표시와 연결되는지 명시해야 한다.

## Verdict rationale

`CHANGES_REQUIRED` — Architecture A1은 Google Play first + Apps in Toss compatibility 구조, no-login local persistence, 5 named preset/difficulty calibration, same-seed retry progressive disclosure, 그리고 adapter boundary 정의까지 핵심 구조를 잘 갖추었다. 그러나 3가지 major gap이 존재한다:

1. **Event contract gap**: Product Plan §6.3 minimum events 14개 중 8개가 Architecture §6.1에 누락되었고, `overlap_warning_logged`/`overlap_confusion_logged` naming mismatch가 있다. apps-in-toss-development-gate.md §7의 "이벤트 누락은 CHANGES_REQUIRED" 규칙에 직접 위배된다.

2. **Free-text PII boundary**: Architecture §6.2의 difficulty feedback event가 optional text의 PII 경계를 정의하지 않았다. 동일 패턴이 칭찬해줘(t_f7cbc27a)와 라이어게임(t_40698451) Architecture B challenge에서도 CHANGES_REQUIRED 사유였다.

3. **RNG determinism spec gap**: Architecture §2의 seed pipeline이 PRNG algorithm과 seed derivation function을 명시하지 않아, same-seed fairness — D-20260619-004의 핵심 승인 범위 — 가 구현체에 따라 깨질 수 있다.

세 가지 모두 Architecture §2, §6, §8의 event/RNG contract 보강으로 해결 가능하므로, 전면 재설계가 아니라 specification sharpening이 필요하다.

## Evidence used

- `AGENTS.md` L54-63, L77-80
- `00_PROJECT_BRIEF.md` L16-21, L31-33
- `01_DECISIONS.md` D-20260619-004
- `stages/20_ARCH_FINAL.md` §§2.1-2.2, 4.1-4.2, 5.1-5.3, 6.1-6.3, 7.2, 8.1, 9
- `stages/10_UX_FINAL.md` §§4.4, 4.9, 7
- `stages/08_PRODUCT_PLAN.md` §§6.1-6.5
- `stages/reviews/ux-growth-hiddenline-first-validation.md` §§1-3
- `/Users/kangsungbae/Documents/지식저장소/docs/workflows/app-platform-standard.md` L15, L107
- `/Users/kangsungbae/Documents/지식저장소/docs/workflows/apps-in-toss-development-gate.md` §7 line 80
- `/Users/kangsungbae/Documents/지식저장소/projects/hiddenline/platform.md`

## knowledge_candidates

- maturity: candidate
  summary: Architecture event contract는 Product Plan의 minimum analytics events를 전부 포함해야 하며, 이벤트명은 Product Plan/UX와 일치해야 한다. event mismatch는 apps-in-toss-development-gate.md §7에 따라 개발 전 CHANGES_REQUIRED로 처리한다. Architecture 문서에 Product Plan → Architecture → UX 3열 event-mapping table을 두면 implementation drift를 방지할 수 있다.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/20_ARCH_FINAL.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/docs/workflows/apps-in-toss-development-gate.md

- maturity: candidate
  summary: local-first no-login app의 feedback free-text는 analytics 전송 대상에서 제외하거나 domain sanitizer를 통과시켜야 한다. 전화번호·이메일·연속숫자·이름 패턴을 제거하는 sanitizer contract를 Architecture 단계에서 정의하지 않으면, PII가 analytics 파이프라인으로 유출될 수 있다.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/10_UX_FINAL.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/docs/workflows/app-platform-standard.md

- maturity: candidate
  summary: seed-based deterministic path generation architecture는 PRNG algorithm과 seed derivation function을 명시해야 한다. `Math.random()`은 seedable하지 않고 엔진별 차이가 있으며, seeded PRNG 간에도 algorithm이 다르면 같은 numeric seed가 다른 sequence를 생성한다. Architecture §8의 test plan에는 최소 1개의 seed→path concrete fixture가 포함되어야 cross-platform regression test가 가능하다.
  evidence_path: /Users/kangsungbae/Documents/hiddenline/stages/20_ARCH_FINAL.md
  suggested_owner_file: /Users/kangsungbae/Documents/지식저장소/projects/hiddenline/platform.md
