# Hidden Line Architecture B — Visual/UI Implementation Risk Challenge

- task_id: t_ca391c00
- parent_artifact: t_9b6b8be8 → `stages/20_ARCH_FINAL.md` v0.3.0
- reviewed_at: 2026-06-20
- verdict: CHANGES_REQUIRED
- scope: read-only risk review
- basis: `stages/20_ARCH_FINAL.md`, `stages/15_UI_DESIGN.md` A2, `01_DECISIONS.md` D-20260620-006, `app-platform-standard.md`, `apps-in-toss-development-gate.md`, `design-preflight.md`

## [CHALLENGE]

### 1) Result sticky bar safe-area 미정의 — §5.2 "44px visual height"가 notched device에서 완전히 가려질 위험

- 반증 근거: Architecture §5.2는 "44px visual height"만 명시하고 safe-area inset 처리를 규정하지 않았다. UI Design §9.4는 "반투명 glass + top border + safe-area padding"을 명시하지만, Architecture는 safe-area를 §7.3의 별도 QA hook에만 언급하고 sticky bar 자체의 높이 계산에 통합하지 않았다. iPhone X+ 계열 bottom safe-area는 34px, Pixel 4+는 ~24px이다. 44px visual bar가 safe-area padding 없이 구현되면 home indicator zone과 겹쳐 thumb zone에서 tap이 불가능해진다.

- 영향: §7.3의 "bottom CTA / sticky bar respects safe-area insets" 검증이 통과해도, 실제 기기에서는 bar의 하단 24~34px이 indicator와 충돌한다. 이는 acceptance criteria의 "Result sticky retry does not create a new overlay/recap-covering bug"를 위반한다.

- 권장 대안: §5.2에 명시적 규칙 추가:
  1. 총 점유 높이 = 44px (visual bar) + `env(safe-area-inset-bottom)`
  2. bar의 hit target은 safe-area까지 확장되어야 함
  3. backdrop-blur + safe-area padding이 결합된 하나의 계산으로 제시

- 검증법: 390×844 viewport + 34px bottom safe-area에서 bar hit target이 recap content를 78px 이상 가리지 않으면서 thumb zone(화면 하단 48px) 내에서 tap 가능한지 확인.

### 2) End inline CTA state transition underspecified — §5.3이 sticky bar와 inline CTA의 dual-state 상호작용을 정의하지 않음

- 반증 근거: UI Design §9.4는 "사용자가 recap 끝에 도달하면 full inline primary CTA로 자연스럽게 확장/전환한다"고 명시한다. Architecture §5.3은 "the sticky bar preserves action visibility while the user scrolls"와 "the end inline CTA completes the same-seed retry contract when the user reaches the bottom"이라고만 기술하고, 두 element 간의 전환 메커니즘을 정의하지 않았다.

- 영향: dev-builder가 아래 중 잘못된 구현을 할 위험이 있다:
  - sticky bar와 inline CTA가 동시에 표시되어 화면 하단에 중복 CTA 발생
  - sticky bar가 inline CTA 위에 겹쳐서 동일한 overlay 버그 재발
  - sticky bar가 사라지지 않고 recap 끝에서도 유지되어 스크롤 종료 후에도 불필요한 공간 점유

- 권장 대안: §5.3에 state transition rule 추가:
  1. recap scroll 중: slim sticky bar만 visible (44px + safe-area)
  2. recap scroll이 끝에 도달: sticky bar는 opacity 0 / translateY 처리로 사라지고, recap 아래 full inline primary CTA가 노출됨
  3. scroll up → sticky bar 다시 visible, inline CTA는 recap 하단에 유지
  4. recap 높이가 viewport보다 작아 스크롤이 불필요한 경우: sticky bar 대신 inline CTA만 표시

- 검증법: recap 높이 ≥ 400px 시나리오에서 scroll → sticky bar visible; scroll-end → sticky bar hidden + inline CTA visible. Playwright viewport test로 확인.

### 3) §8.2 Adapter 과잉 명세 — 9개 adapter 중 5개가 승인 범위 밖

- 반증 근거: Architecture §8.2는 auth, ads, IAP, share, backend transport를 포함해 9개 adapter를 "keep behind adapters even if stubbed"로 열거한다. 그러나 D-20260620-006은 ads/IAP/login/backend SDKs를 excluded scope로 명시하고, app-platform-standard.md §17은 "승인 범위 밖 capability가 optional/stub adapter로 미리 생기지 않았는가? 현재 MVP에 실제 플랫폼 차이가 없는 기능은 추상화하지 말고 제외 상태로 남긴다"고 규정한다.

- 영향: dev-builder가 out-of-scope adapter를 stub으로라도 생성하면:
  - 불필요한 인터페이스/디렉토리 구조 생성
  - 추후 SDK 연결 시 stub을 실제 구현으로 교체할 위험 — 이는 명시적 승인 없이 scope creep을 유발
  - prior architecture reviews에서 동일 패턴이 반복 지적됨 (t_f7cbc27a, t_40698451)

- 권장 대안: §8.2를 두 그룹으로 분할:
  - 현재 scope adapter (필수): storage, analytics, locale resolution, haptics
  - future-only adapter (이번 stage에서 생성 금지): auth, ads, IAP, share, backend transport — manifest로만 명시하고 "이 stage에서는 생성하지 않음" 명시

- 검증법: 구현 후 `src/platform/` 또는 adapter 디렉토리에 auth/ads/IAP/share/backend 관련 파일이 0개인지 확인.

### 4) §6.1 Button taxonomy에 Icon button 누락 — UI Design §8.1과 불일치

- 반증 근거: Architecture §6.1은 `primary, secondary, ghost, danger, chip` 5종을 정의한다. UI Design §8.1은 여기에 추가로 "Icon button: 44px tap target, circular dark glass"를 back/close/more/language 버튼용으로 정의했다. Architecture의 taxonomy에 icon button이 없으면 back/close/more 버튼이 button system 밖으로 누락되어 native rendering될 위험이 있다. 이는 §6.3의 "Controls must not render as browser gray buttons"와 정면 충돌한다.

- 영향: Home의 설정(⚙), Preset sheet의 닫기(✕), Gameplay의 뒤로가기(‹), Result의 더보기(⋯) 등 최소 4곳의 icon button이 native fallback으로 렌더되어 Owner가 지적한 "엉망" 상태의 일부가 재현된다.

- 권장 대안: §6.1 button taxonomy에 `icon` 추가. 정의:
  - `icon`: 44px × 44px circular, transparent/dark glass surface, 1.75-2px stroke icon, cyan-active state
  - hover/pressed/disabled states를 다른 button category와 동일하게 정의

- 검증법: Home, Preset sheet, Gameplay, Result 화면의 icon button이 `button.icon` 또는 equivalent token class를 사용하는지 CSS audit.

### 5) (PASS_WITH_CONDITIONS) §7.1 Locale persistence detail 누락

Architecture §8.3은 locale을 "storage adapter boundary"로 위임하지만, storage key나 fallback logic을 명시하지 않는다. app-platform-standard.md §74는 "사용자 언어 선택은 로그인 상태와 독립적으로 유지한다"고 요구한다. Implementation에서 `localStorage.getItem('locale') || navigator.language.slice(0,2) || 'ko'` 같은 명시적 fallback chain을 Architecture에 기록할 것을 권장한다. Blocking은 아니다.

### 6) (PASS_WITH_CONDITIONS) §4.4 Platform back/close differentiation 미흡

Architecture §4.4는 "pressing back closes the sheet"로 단일화하지만, Google Play의 system back button과 Apps in Toss의 in-app close/miniapp back seam은 구현이 다르다. §2.3이 "active UI layer only" 원칙을 명시했으므로 blocking은 아니지만, platform별 back handler 분기를 Architecture에 암시할 것을 권장한다.

## Acceptance criteria check

| Criteria | Status | Note |
|---|---|---|
| A1 does not start or imply dev-builder work before Owner approval | PASS | §1.3, §13 명시적 배제 |
| Remove native-looking preset buttons without breaking 5 named presets, same-seed retry, or UX contracts | PASS (with §6.1 fix) | Icon button taxonomy 누락만 해결되면 button system은 완전 |
| Result sticky retry does not create new overlay/recap-covering bug | FAIL | §5.2 safe-area, §5.3 state transition 미정의로 동일 버그 재발 위험 |
| Apps in Toss + Google Play compatibility boundaries remain intact | PASS (with §8.2 fix) | Adapter 과잉 명세만 정리되면 platform neutrality 유지 |
| Every blocking finding names exact artifact section and requested change | PASS | Issues 1-4 모두 §번호 + 구체적 변경 요청 포함 |

## Handoff

- Verdict: CHANGES_REQUIRED — 4개 blocking finding (safe-area 미정의, state transition underspecified, adapter 과잉 명세, icon button taxonomy 누락)이 해소되어야 Architecture A2로 진행 가능
- Parent task t_9b6b8be8의 open_risks 중 3개 (sticky-bar collision, safe-area/finger-occlusion proof, 360px crowding)가 이 review에서 구체화됨
- Next profile: `tech-architect` — §5.2, §5.3, §8.2, §6.1 수정 후 A2 candidate로 재제출
- Development remains Owner-gated; 이 review는 stage approval이 아님
