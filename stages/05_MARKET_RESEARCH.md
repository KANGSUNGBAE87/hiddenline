# 05_MARKET_RESEARCH — Hidden Line Difficulty/Path Generation & Revenue Evidence

version: 1.1.0
stage: Market Research A2 (revision — B challenge 반영)
project: hiddenline
basis_date: 2026-06-19
researcher: market-researcher
next: Product Planning (pending CEO decision)

## A. Recommendation

```
VALIDATE_FIRST
```

### 근거 요약

1. **Owner의 "12단계 난이도" 이해는 실제 구현과 다르다.** 코드에는 `DifficultyId` 4종(easy/normal/hard/expert), `LineDifficultyId` 3종, `VisibilityLevelId` 3종, `GeneratorProfileId` 4종이 존재하며, Daily Pack은 4개 line family × 3개 line difficulty = 12개 seed variant를 만든다. 그러나 이것은 "12단계 난이도"가 아니라 **다축 난이도 시스템**이다(§F.1 다이어그램 참조). 단일 서수 체계가 아니므로, "0-100 난이도"로 단일축 통합할지 다축을 유지할지는 CEO 결정이 필요하다.

2. **급격한 꺾임과 겹침 정책이 Owner 의도와 불일치한다.** 코드는 non-hard 모드에서 선 겹침(self-intersection)을 **금지**한다(`isValid()` L238). Owner는 "선은 겹쳐도 된다"고 기대하지만, 실제로는 hard 모드에서만 허용된다. 회전각 제한은 1.05 rad(≈60°)로 상한이 있지만, 모바일 손가락 체감으로는 여전히 급격할 수 있다.

3. **0-100 난이도 점수 체계가 구현되어 있지 않다.** `complexityScore`는 비율(totalLength / minViewport)이며, EASY의 `minComplexity` 0.2가 "20"에 매핑될 수 있지만 명시적 스케일 변환이 없다. 수익화 후크도 P0-P2에서 제외되어 있다.

**선 생성 코드를 변경하기 전에 확보해야 할 최소 증거:**
- Owner의 실제 난이도 의도(단일축 vs 다축, 겹침 허용 범위, 0-100 스케일 정의)
- 실기기 touch QA에서 현재 easy와 hard의 체감 차이
- curve/polyline softening 횟수 증가 또는 spline 전환이 turn angle에 미치는 효과 측정

---

## B. 조사 범위와 한계

| 축 | 범위 | 한계 |
|---|---|---|
| 난이도 시스템 | `src/game/config.ts`, `pathGenerator.ts`, `types.ts`, `dailyPack.ts` 분석 | 실기기 체감 QA 없음 |
| 선 생성 | `pathGenerator.ts` 전문 분석 (309 lines) | fallback path가 실제 얼마나 자주 발생하는지 통계 없음 |
| 수익화 | `ai/plans/2026-06-13-hidden-line-product-game-revenue-master-plan.md`, 앱인토스 게임 광고/포인트 문서 | 광고 SDK 미연결, eCPM·DAU·retention 측정 불가 |
| 경쟁/시장 | Google Play 스토어 검색 | "precision tracing" 장르가 협소하여 직접 경쟁자 파악이 제한적임 |
| 플랫폼 정책 | 앱인토스 게임 수익화 구조, Google Play 정책 베이스라인 (`platform.md` L87-101) | 심사 결과 없이 문서 기준으로만 판단 |

---

## C. 증거 테이블

### C.1 난이도 레벨 수

| source_id | claim | evidence_type | file/url | checked_at | confidence |
|---|---|---|---|---|---|
| SRC-01 | Owner understands there are "12 difficulty levels" | CLAIM | `00_PROJECT_BRIEF.md` L15 | 2026-06-19 | HIGH (Owner stated) |
| SRC-02 | `DifficultyId` has exactly 4 values: easy, normal, hard, expert | FACT | `src/game/types.ts` L1-3 | 2026-06-19 | HIGH (code) |
| SRC-03 | `LineDifficultyId` has 3 values: easy, normal, hard | FACT | `src/game/types.ts` L1 | 2026-06-19 | HIGH (code) |
| SRC-04 | `VisibilityLevelId` has 3 values: easy, normal, hard | FACT | `src/game/types.ts` L2 | 2026-06-19 | HIGH (code) |
| SRC-05 | `GeneratorProfileId` has 4 values | FACT | `src/game/types.ts` L6 | 2026-06-19 | HIGH (code) |
| SRC-06 | Daily Pack creates 4 line types × 3 line difficulties = 12 seed variants | FACT | `src/game/dailyPack.ts` L58-87 | 2026-06-19 | HIGH (code) |
| SRC-07 | Execution plan targets "36 Daily board combinations" (4 line families × 3 line difficulties × 3 visibility levels) | FACT | `ai/plans/2026-06-16-hidden-line-line-visibility-difficulty-execution-plan.md` L17 | 2026-06-19 | HIGH (plan) |
| SRC-08 | "12 difficulty levels" does not appear in any code or plan — the system is multi-axis (line type, line difficulty, visibility, profile) | INFERENCE | deduced from SRC-02~07 | 2026-06-19 | HIGH |

### C.2 선 생성(Path Generator)

| source_id | claim | evidence_type | file/url | checked_at | confidence |
|---|---|---|---|---|---|
| SRC-09 | Non-hard paths use sine-wave superposition with 4 harmonics | FACT | `src/game/pathGenerator.ts` L209-227 | 2026-06-19 | HIGH (code) |
| SRC-10 | Hard paths use a self-crossing figure-8 curve via `createHardCrossingCurve()` | FACT | `src/game/pathGenerator.ts` L117-168 | 2026-06-19 | HIGH (code) |
| SRC-11 | `shouldUseCrossingHardPath()` triggers hard crossing for hard difficulty, except warmup | FACT | `src/game/pathGenerator.ts` L32-34 | 2026-06-19 | HIGH (code) |
| SRC-12 | Path softening runs 4 passes (5 for precision) using 3-point weighted averaging | FACT | `src/game/pathGenerator.ts` L36-54, L167 | 2026-06-19 | HIGH (code) |
| SRC-13 | Max path attempts is 32 before fallback | FACT | `src/game/config.ts` L25 | 2026-06-19 | HIGH (code) |

### C.3 급격한 꺾임 (Sharp Turns)

| source_id | claim | evidence_type | file/url | checked_at | confidence |
|---|---|---|---|---|---|
| SRC-14 | Turn angle is validated — paths with maxTurnAngle ≥ 1.05 rad (≈60°) are rejected | FACT | `src/game/pathGenerator.ts` L84-104, L240 | 2026-06-19 | HIGH (code) |
| SRC-15 | Owner reports "선의 꺾임이 급작스럽게 꺾이는 경우가 있다" | CLAIM | `00_PROJECT_BRIEF.md` L16 | 2026-06-19 | HIGH (Owner report) |
| SRC-16 | Sharp-turn perception may come from high tertiary/quaternary harmonic amplitudes at hard difficulty | INFERENCE | `src/game/config.ts` L66-67 (tertiaryMultiplier: 1.82, quaternaryMultiplier: 0.68 for hard) | 2026-06-19 | MEDIUM |
| SRC-17 | `softenPolyline()` is a linear 3-point average, not spline-based — may not produce visually smooth curves at high amplitudes | INFERENCE | `src/game/pathGenerator.ts` L36-54 | 2026-06-19 | MEDIUM |
| SRC-18 | Hard-crossing paths (`createHardCrossingCurve`) are then softened, but the crossing point itself is inherently an abrupt direction change | INFERENCE | `src/game/pathGenerator.ts` L117, L167 | 2026-06-19 | MEDIUM |

### C.4 겹침(Overlap) 처리

| source_id | claim | evidence_type | file/url | checked_at | confidence |
|---|---|---|---|---|---|
| SRC-19 | Owner says "선은 겹쳐도 된다" | CLAIM | `00_PROJECT_BRIEF.md` L17 | 2026-06-19 | HIGH (Owner stated) |
| SRC-20 | Code: non-hard mode rejects self-intersection — `hasSelfIntersection(points)` causes `isValid()` to fail | FACT | `src/game/pathGenerator.ts` L234, L238 | 2026-06-19 | HIGH (code) |
| SRC-21 | Code: hard mode (non-warmup) REQUIRES self-intersection — `shouldUseCrossingHardPath` enables crossing-only path generation | FACT | `src/game/pathGenerator.ts` L32-34, L195-197, L238 | 2026-06-19 | HIGH (code) |
| SRC-22 | Owner expectation (overlap always allowed) does NOT match implementation (overlap only in hard mode) | INFERENCE | deduced from SRC-19~21 | 2026-06-19 | HIGH |

### C.5 길이/구불거림(Length/Winding) 제어

| source_id | claim | evidence_type | file/url | checked_at | confidence |
|---|---|---|---|---|---|
| SRC-23 | `LINE_DIFFICULTIES` defines amplitude multipliers that control winding: easy 0.72, normal 1.0, hard 1.34 | FACT | `src/game/config.ts` L42-44, L53-55, L64-66 | 2026-06-19 | HIGH (code) |
| SRC-24 | Secondary/tertiary/quaternary multipliers increase winding for hard: tertiary is 1.82× (vs 0.35 for easy) | FACT | `src/game/config.ts` L46, L57, L67 | 2026-06-19 | HIGH (code) |
| SRC-25 | `sampleCount` increases with difficulty: 112 (easy) → 128 (normal) → 152 (hard), creating longer paths | FACT | `src/game/config.ts` L48, L59, L69 | 2026-06-19 | HIGH (code) |
| SRC-26 | `complexityScore` = totalLength / min(viewportW, viewportH) — a ratio, not 0-100 | FACT | `src/game/pathGenerator.ts` L281 | 2026-06-19 | HIGH (code) |
| SRC-27 | `targetComplexity` and `minComplexity` are defined but not used as path-generation validation gates | FACT | `src/game/config.ts` L39, L50-51, L61-62, L70-71 | 2026-06-19 | HIGH (code) |
| SRC-28 | Easy `minComplexity` = 0.2, which could map to "20 on a 0-100 scale if multiplied by 100" — but no explicit scale exists | INFERENCE | `src/game/config.ts` L50 | 2026-06-19 | MEDIUM |

### C.6 점수 체계(Scoring)

| source_id | claim | evidence_type | file/url | checked_at | confidence |
|---|---|---|---|---|---|
| SRC-29 | Current scoring uses 5-axis measurement breakdown (accuracy, smoothness, calmness, completion, pace) with clamp to 0-1000 | FACT | `src/game/scoring.ts` L20-35, `src/game/measurement.ts` (via import) | 2026-06-19 | HIGH (code) |
| SRC-30 | `calculateOfficialScore()` returns null for incomplete runs — official scoring requires completion | FACT | `src/game/scoring.ts` L37-40 | 2026-06-19 | HIGH (code) |
| SRC-31 | Product spec defines `baseScore = 10000` with difficulty multipliers, but current code uses 0-1000 clamp — spec and code differ | FACT | `ai/plans/2026-06-07-hidden-line-product-spec.md` L84-98 vs `src/game/config.ts` L26 | 2026-06-19 | HIGH |

### C.7 유지/재방문(Retention) 후크

| source_id | claim | evidence_type | file/url | checked_at | confidence |
|---|---|---|---|---|---|
| SRC-32 | Daily Challenge with deterministic seed exists — same seed produces same path every day | FACT | `src/game/daily.ts` L12-22 | 2026-06-19 | HIGH (code) |
| SRC-33 | Weekly strip and yesterday comparison are in UI but not yet fully functional | FACT | `ai/reviews/review.md` L284-287, actual Home screen | 2026-06-19 | MEDIUM (review claim) |
| SRC-34 | Daily missions (3 proposals) exist in master plan but NOT implemented | FACT | `ai/plans/2026-06-13-hidden-line-product-game-revenue-master-plan.md` L144-149, code absence | 2026-06-19 | HIGH |
| SRC-35 | No push notification, no streak counter, no comeback reward — retention hooks are structural (seed + record) only | FACT | code grep | 2026-06-19 | HIGH (code) |
| SRC-36 | `DIFFICULTIES` constant is declared but not yet wired to actual gameplay (per master plan P0) | FACT | `ai/plans/2026-06-13-hidden-line-product-game-revenue-master-plan.md` L57-63 | 2026-06-19 | HIGH (plan) |

### C.8 광고/수익화 후크

| source_id | claim | evidence_type | file/url | checked_at | confidence |
|---|---|---|---|---|---|
| SRC-37 | No ads, no IAP, no login, no backend ranking in current build | FACT | `ai/reviews/review.md` L244-252, code grep | 2026-06-19 | HIGH |
| SRC-38 | Auth/ads/payment adapters are stubs only — interfaces exist but no SDK wired | FACT | `src/platform/*` | 2026-06-19 | HIGH (code) |
| SRC-39 | Master plan: P0-P2 no monetization; P3+ supporter/ad-free, cosmetic themes, optional practice packs | FACT | `ai/plans/2026-06-13-hidden-line-product-game-revenue-master-plan.md` L204-211 | 2026-06-19 | HIGH (plan) |
| SRC-40 | Owner asks to "consider ad revenue maximization" but code has zero revenue surface | CLAIM vs FACT | `00_PROJECT_BRIEF.md` L20 vs code state | 2026-06-19 | HIGH |

### C.9 플랫폼 정책 제약 (Ads/Rewards)

| source_id | claim | evidence_type | file/url | checked_at | confidence |
|---|---|---|---|---|---|
| SRC-41 | Apps in Toss prohibits Toss points linked to scores, wins, rankings, or chance-based results | FACT | `/Users/kangsungbae/Documents/지식저장소/docs/tools/apps-in-toss-game-ads-points-monetization.md` L35-41 | 2026-06-19 | HIGH |
| SRC-42 | Games: rewarded ads are allowed post-failure, results screen, lobby — not during play or linked to ranking advantage | FACT | same document L49-50 | 2026-06-19 | HIGH |
| SRC-43 | Google Play: no disruptive ads during core play, no misleading CTA, no fake scarcity | FACT | `/Users/kangsungbae/Documents/지식저장소/projects/hiddenline/platform.md` L96-97 | 2026-06-19 | HIGH |
| SRC-44 | Competition features must not imply official prizes, cash value, gambling, or real-money rewards | FACT | same document L98-99 | 2026-06-19 | HIGH |
| SRC-45 | Hidden Line's current state (no ads/IAP/login) keeps policy risk near zero | INFERENCE | code state + SRC-41~44 | 2026-06-19 | HIGH |

---

## D. 발견사항: Owner 이해와 구현 간 불일치

### D.1 "12단계 난이도" → 다축 시스템

| Owner expectation | Actual implementation | Impact |
|---|---|---|
| 12 difficulty levels | 4 DifficultyId × 3 LineDifficultyId × 3 VisibilityLevelId × 4 GeneratorProfileId = independent axes. Daily Pack: 12 seed variants. UI: line difficulty dropdown (3) × visibility dropdown (3) × 4 line panels. | "12단계"라는 단일 서수 체계가 아니라 축별 조합이다. Owner가 의도한 것이 단일 난이도 슬라이더(0-100)인지, 현재 다축 시스템을 유지할지 결정이 필요하다. |

### D.2 "선은 겹쳐도 된다" → hard에서만 겹침

| Owner expectation | Actual implementation | Impact |
|---|---|---|
| Overlap allowed generally | Easy/Normal: self-intersection = invalid. Hard (non-warmup): self-intersection REQUIRED. | Easy/Normal에서 겹침이 발생하면 path 생성이 실패하고 fallback에 의존한다. Owner의 의도가 easy/normal에서도 겹침 허용인지, hard에서만 겹침인지 확인 필요. |

### D.3 "최대한 곡선으로" → 하드컷 검증

| Owner expectation | Actual implementation | Impact |
|---|---|---|
| Lines should be as curved/smooth as possible | Turn angle capped at 1.05 rad (≈60°). Softening is 3-point linear average, not spline. Tertiary harmonics at 1.82× for hard create high-frequency micro-turns. | 60° cap은 거부(reject) 임계값일 뿐, 그 이하의 각도도 모바일에서 급격하게 느껴질 수 있다. Spline 기반 smoothing이나 Catmull-Rom 보간이 더 부드러운 결과를 낼 수 있다. |

### D.4 "0-100 스케일 최소 20" → 스케일 미존재

| Owner expectation | Actual implementation | Impact |
|---|---|---|
| 0-100 difficulty score, min ≥ 20 | `complexityScore` = totalLength/minViewport (ratio). Easy `minComplexity` = 0.2 매핑 가능하나 명시적 스케일 없음. | 명시적 0-100 변환 함수와 검증 게이트가 필요하다. 현재는 complexityScore가 정보용일 뿐 생성 로직을 제약하지 않는다. |

---

## E. 수익화 판단

### E.1 현재 상태

현재 빌드는 광고/IAP/로그인/백엔드 랭킹이 전혀 없다. 이 상태에서는 수익화 논의가 **추측**에 불과하다. 다음은 관찰 가능한 사실에만 기반한 판단이다.

### E.2 수익화 가능 지점 (코드/계획 기준)

| 시점 | 광고 형식 | 정책 적합성 | 전제 조건 |
|---|---|---|---|
| 실패 후 retry | Rewarded video | ✅ (Apps in Toss 허용, Google Play 허용) | 공식 기록과 분리 필수. retry 점수는 non-official로만 기록 |
| Daily Pack 완료 후 | Interstitial | ⚠️ (제한적 허용, 세션 경계만) | 플레이 중단 금지. N판마다 1회 패턴 |
| 결과 화면 | Rewarded (double coin/cosmetic preview) | ✅ | 게임성/공정성 침해 없이 cosmetic/재화 보상만 |
| 홈/로비 | Banner | ✅ | 비플레이 화면. Toss UI와 충돌 가능성 |
| App open | App open ad | ❌ (게임에서는 기본 제외 권장) | — |

### E.3 수익화까지 필요한 선결 조건 (정책 리스크 → 코어 검증 순서)

**정책 리스크를 먼저 닫고, core fun을 증명한 후 수익화를 설계해야 한다.** 현재 상태에서 "광고수익 최대화"를 우선순위로 두면 다음과 같은 위험이 있다:

- **(a) 정책 위반 위험**: Apps in Toss는 게임에서 점수·랭킹·확률형 결과와 Toss points를 직접 연결하는 것을 금지한다(SRC-41). Google Play도 dark-pattern monetization을 금지한다(SRC-43). 광고 설계를 먼저 하면 정책 경계를 넘을 가능성이 높다.
- **(b) core fun 검증 왜곡**: 수익화 후크(광고 시청, 재화 소모, IAP)를 초기에 도입하면, "돈을 쓰게 만드는 루프"인지 "재미있어서 반복하는 루프"인지 구분할 수 없다.
- **(c) 수익화할 표면 부재**: 현재 빌드는 광고/IAP/로그인/백엔드 랭킹이 전혀 없다(SRC-37~38). 수익화 논의는 추측에 불과하다.

**권장 순서:**

1. **정책 경계 확정** (P0): §E.2의 광고 형식별 정책 적합성을 최신 원문으로 재확인. 특히 Apps in Toss의 `grantPromotionRewardForGame` API 사용 조건과 Google Play의 가족·아동 대상 추가 정책 확인.
2. **Core loop 검증** (P0): 실기기 touch QA 완료. sharp-turn 체감, overlap 체감, difficulty ramp 체감 기록.
3. **DAU/retention 기준선** (P1): 최소 30일 retention 데이터 없이 광고 단가 추정은 무의미. eCPM은 DAU·세션 길이·retention에 크게 의존한다.
4. **앱 내 재화 설계** (P3): coin/heart/stamina 형태의 중간 재화 도입 (현 master plan 기준).
5. **광고 adapter 구현**: AdMob(Google Play) + Apps in Toss Ads 연결.
6. **백엔드 검증**: rewarded ad callback 검증 없이 보상 지급 불가.

**주장**: 수익화 설계를 지금 하는 것은 premature다. Owner가 "광고수익 최대화까지 고려"를 요청했지만, 정책 리스크를 먼저 닫지 않으면 광고 최대화 논의가 선행될 이유가 약하다. P3까지 defer하는 현 master plan의 입장이 합리적이며, 현재 단계에서는 §E.2의 정책 적합성 매트릭스를 수익화 가능 지점의 **상한**으로만 정의한다.

---

## F. 난이도 체계: 현재 vs 제안

### F.1 현재 다축 시스템 (실제 구현)

```
LineDifficulty (선 난이도)  ×  VisibilityLevel (시야 난이도)  ×  GeneratorProfile (생성기)
     easy/normal/hard              easy/normal/hard              4개 프로필
         ↓                               ↓                           ↓
  path geometry 복잡도          reveal/fail/idle 규칙        waveform archetype
  (진폭·고조파·점 개수)         (반경·허용폭·시간)           (warmup/main/curve/precision)
```

### F.2 Owner가 생각하는 단일축 (추정)

```
0 ───────────────────────────────────── 100
   20 (최소 난이도)
   ↑                               ↑
   쉬움                           어려움
   (짧고, 덜 구불, 적은 겹침)      (길고, 많이 구불, 많은 겹침)
```

### F.3 권고

현재 다축 시스템은 설계상 타당하다. 문제는:
- 각 축이 독립적으로 제어되지만 Owner는 단일 슬라이더를 상상하고 있다.
- `complexityScore`가 0-100으로 변환되지 않아 "난이도 점수" 개념이 없다.

**제안 경로 A — 단일축 통합 (Owner 의도 근접)**
- LineDifficulty × VisibilityLevel을 하나의 `difficultyIndex` 0-100으로 매핑
- 내부적으로는 지금의 다축 파라미터를 유지하되, 사용자에게는 단일 숫자로 노출
- `easy` = 20-40, `normal` = 41-70, `hard` = 71-90, `expert` = 91-100

**제안 경로 B — 다축 유지 + 설명 강화 (현재 방향 확장)**
- 선 난이도 + 시야 범위를 독립 축으로 유지
- 각 조합에 대한 체감 설명을 UI에 추가
- "공식 난이도"는 main + normal + normal로 고정

CEO 결정이 필요한 지점이다.

---

## G. Google Play / Apps in Toss 경쟁 환경 (스냅샷)

2026-06-19 기준 Google Play "precision tracing" / "line tracing" 검색:

- 직접적 경쟁자(같은 숨은선 정밀 트레이싱 장르)는 발견되지 않음 **(UNKNOWN — niche 장르)**
- 유사 장르:
  - **Draw Climber** 계열: 선을 그려서 이동 경로를 만드는 방식 (반대 방향)
  - **line drawing puzzle** 계열: 한붓그리기 퍼즐. 경쟁보다 퍼즐 완성이 목표
  - **Rhythm games** (Cytus, osu!): 손가락 정밀 조작 + 점수 경쟁이라는 유사성
  - **Don't Touch The Spikes** / **Flappy Bird** 계열: 단순 조작 + 실패 반복 루프

**Hidden Line의 차별점**: "보이지 않는 선을 손끝으로 추적"이라는 코어 메커닉은 위 장르들과 본질적으로 다르다. Daily-first + seed 기반 공정성 모델은 osu!의 beatmap 시스템과 개념적으로 유사하나, 구현은 훨씬 단순하다.

---

## H. 결정 질문에 대한 응답

| 질문 | 응답 | 근거 |
|---|---|---|
| 실제 난이도 레벨 수 | 4 (DifficultyId), 또는 3×3×4 축 조합. 12는 Daily Pack의 seed variant 수 | SRC-02~08 |
| Path generator / data source | `src/game/pathGenerator.ts`: sine-wave superposition (non-hard) + figure-8 crossing curve (hard) | SRC-09~13 |
| Sharp-turn 원인 | 1.05 rad cap은 존재하나, high-frequency harmonic (tertiary 1.82×) + linear 3-point softening이 원인일 가능성 | SRC-14~18 |
| Overlap 처리 | Non-hard: 금지. Hard: 필수. Owner 의도(항상 허용)와 불일치 | SRC-19~22 |
| Length/winding 제어 | LINE_DIFFICULTIES의 amplitude multiplier + sampleCount로 제어. `complexityScore`는 비율이지 0-100이 아님 | SRC-23~28 |
| 기존 scoring/retention/ad hook | Scoring: 5-axis 0-1000 clamp. Retention: Daily seed + local records only. Ad: none | SRC-29~40 |
| Apps in Toss/Google Play policy constraints | 게임: Toss points ↔ 점수/랭킹 연결 금지. Rewarded ad는 실패 후/로비에서 허용. Google Play: dark pattern 금지, 공식 상금 주장 금지 | SRC-41~45 |

---

## I. 최소 필요 증거 (선 생성 코드 변경 전)

아래 증거는 **코드 근거**(SRC-09~28)와 **체감 검증**(실제 손가락 플레이)을 분리한다. 코드 분석만으로는 "얼마나 급작스러운지"를 판단할 수 없으므로, 실기기 QA가 필수적이다.

### I.1 Owner 의도 확인 (코드 변경 전 최우선)

1. **난이도 축 결정**: 단일축(0-100) vs 다축(선 난이도×시야 범위) 유지. §F.3의 경로 A/B 중 선택.
2. **겹침 정책**: easy/normal에서도 겹침을 허용할지, hard에서만 허용할지.
3. **"최소 20"의 구체적 의미**: 0-100 스케일에서 최소 난이도 20의 체감 기준.

### I.2 실기기 touch QA (체감 검증)

**측정 항목:**
| 항목 | 측정 방법 | 현재 코드 근거 | 체감 판단 기준 |
|---|---|---|---|
| Sharp-turn 체감 | easy/normal/hard 각 5회 플레이 후 "급격함" 5점 척도 | maxTurnAngle ≤ 1.05 rad cap (SRC-14) | "부드럽다" 응답 비율 ≥ 80% |
| Overlap 체감 | hard 모드 플레이 후 "자연스러운 교차" 5점 척도 | hard에서만 self-intersection 허용 (SRC-20~21) | "어색한 교차" 응답 비율 ≤ 30% |
| Difficulty ramp 체감 | easy→normal→hard 순차 플레이 후 "난이도 상승이 자연스러운가" | amplitude multiplier ramp (SRC-23~25) | "적절하다" 응답 비율 ≥ 70% |
| Warning ramp 체감 | speed/jitter/idle warning 발생 빈도와 체감 강도 | `src/game/warning.ts` 로직 | warning이 "짜증난다" 비율 ≤ 30% |

**테스트 환경:** 3개 viewport(390×740, 390×844, 430×932) 각각에서 실행. 총 45회 이상 측정.

### I.3 Softening 방식 비교 (정량 비교)

현재 linear 3-point average(`softenPolyline`, 4~5 pass) vs Catmull-Rom spline vs Chaikin smoothing. hard path 10개 생성 후 turn angle 분포 측정:
- **평균 turn angle** (rad)
- **90번째 백분위 turn angle**
- **최대 turn angle**
- **경로 길이 변화율** (spline 적용 전/후)

### I.4 `targetComplexity`/`minComplexity` 게이트화

현재는 `src/game/config.ts`에 선언만 있고 `pathGenerator.ts`에서 검증에 사용되지 않는다(SRC-27). pathGenerator의 `isValid()` 또는 `generate()`에 complexity validation 게이트 추가.

### I.5 0-100 스케일 매핑 함수

`complexityScore`(비율) → `difficultyIndex`(0-100) 변환 함수 정의 및 검증. easy `minComplexity` 0.2가 "20"에 매핑되는지 확인하고, linear/log/step 중 적절한 매핑 선택.

---

## J. Handoff

### J.1 다음 단계

`VALIDATE_FIRST` → CEO가 §H의 불일치 항목에 대해 결정을 내리고, §I의 5개 증거를 확보한 후 Product Planning으로 진행. §K [REVISION]의 B challenge 수용 항목과 남은 리스크를 CEO 판단에 포함한다.

### J.2 지식 후보 (knowledge_candidates)

아래 후보는 Hidden Line 프로젝트를 넘어 재사용 가능한 지식이다.

| KC ID | 제목 | maturity | summary | suggested_owner_file |
|---|---|---|---|---|
| KC-01 | 게임 난이도 다축 설계 패턴 | candidate | LineDifficulty(geometry) × VisibilityLevel(perception) × GeneratorProfile(archetype) 분리는 precision game의 난이도 체감을 독립 튜닝 가능하게 한다. 단일축 슬라이더보다 튜닝 유연성이 높다. | `/Users/kangsungbae/Documents/지식저장소/docs/workflows/app-market-validation.md` (난이도 설계 부록) |
| KC-02 | Path generation validation gate pattern | candidate | `isValid()`의 5개 검증 단계(min distance, length, self-intersection policy, Y-clip, max turn angle)는 generative path 게임의 최소 품질 게이트로 재사용 가능하다. | `/Users/kangsungbae/Documents/지식저장소/docs/conventions/` 신규 |

---

## K. [REVISION] — B Challenge 대응 기록

### K.1 개요

- **리뷰 문서**: `stages/reviews/market-validator-hiddenline-difficulty.md` (t_40288c65)
- **리뷰 verdict**: VALIDATE_FIRST
- **A2 verdict**: 동일하게 VALIDATE_FIRST 유지. B의 3개 challenge를 전면 수용하여 §A, §E, §I, §J 보강.

### K.2 Challenge별 대응

#### Challenge 1: "12단계"는 다축 시스템이다 → **ACCEPT**

- **B 지적**: A1에서 이미 발견했으나, "12단계"와 "0-100 난이도"라는 용어가 현재 다축 구현과 혼동을 줄 수 있음.
- **A2 조치**: §A 근거 요약 항목 1에 "단일 서수 체계가 아니므로, CEO 결정이 필요하다"를 명시. §F.3의 경로 A/B 선택을 CEO 결정 항목으로 연결.
- **변경 섹션**: §A (Recommendation 근거 요약), §J.1 (다음 단계)

#### Challenge 2: 꺾임/겹침 평가는 맞지만, 실기기 QA로 다시 확인해야 한다 → **ACCEPT**

- **B 지적**: 코드 근거(SRC-09~22)는 타당하나, "얼마나" 급작스러운지는 실기기 검증이 없다. 코드 증거와 체감 검증을 분리해야 함.
- **A2 조치**: §I를 I.1~I.5로 구조화. I.2에 실기기 touch QA 측정 항목 테이블 신설 (sharp-turn, overlap, difficulty ramp, warning ramp 각각의 코드 근거와 체감 판단 기준 분리). I.3에 softening 방식 정량 비교 지표 추가.
- **변경 섹션**: §I (전체 재구조화)

#### Challenge 3: 광고수익 최대화는 현재 단계에서 과도하며 정책 리스크 설계가 먼저다 → **ACCEPT**

- **B 지적**: 수익화 논의는 premature. 정책 리스크를 먼저 닫고, core fun 검증 후 수익화를 설계해야 함.
- **A2 조치**: §E.3에 "정책 리스크 → 코어 검증 순서" 프레이밍 추가. (a) 정책 위반 위험, (b) core fun 검증 왜곡, (c) 수익화 표면 부재의 3가지 리스크 명시. 권장 순서를 6단계로 재정렬하여 정책 경계 확정을 P0 최우선으로 배치.
- **변경 섹션**: §E.3 (전면 재작성)

### K.3 최종 권고

```
VALIDATE_FIRST
```

**Product Planning 진입 전 확보해야 할 최소 조건:**

1. **Owner 의도 확정** (§I.1): 난이도 축(단일 vs 다축), 겹침 정책, "최소 20"의 의미 — CEO 결정 ID 필요.
2. **실기기 touch QA** (§I.2): 3 viewport × 4 항목 × 5회 이상 = 45회 측정. sharp-turn 체감 "부드럽다" ≥ 80% 등 정량 기준 충족.
3. **Softening 비교** (§I.3): turn angle 분포 측정으로 spline 전환 여부 판단.
4. **정책 경계 확정** (§E.3): Apps in Toss/Google Play 최신 원문 재확인. rewarded ad 허용 범위, Toss points 연결 금지 항목 명문화.

**Product Planning이 가져야 할 scope:**

- 난이도 시스템: §F.3 경로 A(단일축 통합)로 시작하되, 내부적으로는 §F.1의 다축 파라미터 유지.
- 수익화: 설계하지 않는다. §E.2의 정책 적합성 매트릭스를 "가능한 상한"으로만 참조하고, 실제 수익화는 P3 이후.
- Core loop: 실기기 QA 결과를 바탕으로 sharp-turn softening, overlap 정책, difficulty ramp를 튜닝. 수익화나 retention hook 확장은 아님.

### K.4 남은 리스크

| 리스크 | 심각도 | 설명 |
|---|---|---|
| Owner 의도 불확실성 | HIGH | "12단계"가 정말 단일 서수 체계를 말한 것인지, Daily Pack의 12 variant를 말한 것인지 확인되지 않음. §I.1의 CEO 결정이 없으면 Product Planning의 난이도 축 설계가 엇나갈 수 있음. |
| 실기기 QA 미실시 | HIGH | 코드 분석만으로 sharp-turn/overlap의 "체감"을 판단할 수 없음. spline 전환이나 overlap 정책 변경이 체감을 개선할지 악화시킬지 불확실. |
| 수익화 정책 변경 | MEDIUM | Apps in Toss/Google Play 정책은 2026-06-19 기준. 구현 시점에 정책이 변경되었을 가능성. §E.2의 정책 적합성은 구현 직전 재확인 필요. |
| 경쟁 환경 미발견 | LOW | Google Play "precision tracing" 장르에서 직접 경쟁자가 발견되지 않음. niche 장르의 장점이지만, 수요 규모 자체가 작을 가능성도 있음. |

### K.5 거부된 항목

없음. B의 3개 challenge는 모두 수용되었다.

### K.6 변경 이력

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| 1.0.0 | 2026-06-19 | Market Research A1 최초 작성. VALIDATE_FIRST 판단. |
| 1.1.0 | 2026-06-19 | B challenge 3건 반영: §A 용어 정리(다축 명시), §E.3 정책 리스크 우선 재작성, §I 실기기 QA 체계화. §K [REVISION] 신설. |