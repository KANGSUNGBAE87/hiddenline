# 01_DECISIONS

Only `studio-ceo` edits this file.

## D-20260619-001

- status: accepted
- stage: Intake / routing
- decision: Treat Owner request as an existing-game difficulty/product review, not a direct code patch. Start evidence-first Market Research ABA before Product Planning, UX, Architecture, and any Development approval.
- evidence: Owner requested existing folder analysis, path-generation difficulty fixes, game/product/ad revenue consideration, and priority on difficulty-appropriate line generation.
- alternatives rejected: Direct `dev-builder` implementation now; rejected because 12-level difficulty, curve/overlap scoring, ad revenue, and policy/gameplay tradeoffs need evidence and stage decisions first.
- scope impact: Market Research may inspect current docs/code/app state and external references. Product code changes remain excluded until Owner approves Development after Architecture.
- owner approval required: no for Market Research start; yes before Development.
- next task: Hidden Line Market Research A1
- date: 2026-06-19

## D-20260619-002

[CEO_DECISION]
id: D-20260619-002
verdict: APPROVE_WITH_CHANGES
approved_artifact: `stages/05_MARKET_RESEARCH.md` v1.1.0
accepted_scope: Market evidence accepted. Product Planning may start on 0-100/12-level alternatives, smoothness/overlap/length/winding definitions, onboarding floor 20, and retention/ad boundaries.
excluded_scope: Code changes, monetization implementation, ranking/reward advantage, and treating 12 variants as confirmed ordered levels.
reason: A→B→A complete; B challenges accepted; DeepSeek auxiliary agrees evidence is sufficient, with K.3 validation gates run alongside planning.
open_risk: Owner difficulty intent and device touch QA remain HIGH; ad policy must be rechecked before implementation.
next_task: Product Planning A1 → B challenge → A2 → CEO gate.
[/CEO_DECISION]

## D-20260619-003

[CEO_DECISION]
id: D-20260619-003
verdict: APPROVE_WITH_CHANGES
approved_artifact: `stages/08_PRODUCT_PLAN.md` A2 final candidate
accepted_scope: 5 named presets as first public exposure, 0-100 as internal calibration/QA, onboarding floor 20+ band, result/retry/daily validation, monetization closed as later-only.
excluded_scope: 12 public levels, player-facing 0-100 promise, ads/IAP/reward implementation, Apps in Toss execution, code changes, Development start.
reason: B challenges were accepted; DeepSeek auxiliary agrees UX can start, but final UX must not convert unresolved difficulty intent into public numeric/12-level promises.
open_risk: Owner difficulty intent, device touch QA, overlap policy, 0-100 mapping, monetization policy recheck.
next_task: UX A1 → UX Growth challenge → UX A2 → CEO gate.
[/CEO_DECISION]

## D-20260619-004

[CEO_DECISION]
id: D-20260619-004
verdict: APPROVE_WITH_CHANGES
approved_artifact: `stages/10_UX_FINAL.md` A2 final candidate
accepted_scope: 5 named presets, no public 0-100/12-level promise, same-seed retry first, return_next_day/last-session measurement, 5-point difficulty feedback.
excluded_scope: code changes, Development start, ads/IAP/rewards, login gate, Apps in Toss execution, public numeric difficulty promise.
reason: B review gaps were accepted; DeepSeek auxiliary agrees Architecture can start with local persistence, seed determinism, feedback path, state-machine, and Google Play preflight conditions.
open_risk: device touch QA, seed reproducibility, local-only retention data loss, overlap/smoothness mapping, policy recheck before implementation.
next_task: Architecture A1 → risk challenge → A2 → CEO gate; Development remains Owner-gated.
[/CEO_DECISION]

## D-20260619-005

[CEO_DECISION]
id: D-20260619-005
verdict: APPROVE
approved_artifact: `stages/20_ARCH_FINAL.md` A2 final candidate
accepted_scope: deterministic seed/path/difficulty architecture, 5 named presets with internal 0-100 calibration, local-first persistence/analytics, PII-safe feedback boundary, platform-neutral adapters.
excluded_scope: Development start, code changes, ads/IAP/rewards, login/backend sync, Apps in Toss execution, public 12-level or numeric difficulty promise.
reason: B gaps were resolved; DeepSeek auxiliary agrees Architecture is testable and scope-safe.
open_risk: device touch QA, PRNG implementation parity, local data loss, future platform/policy recheck.
next_task: Owner explicit approval for Development before any dev-builder task.
[/CEO_DECISION]

## D-20260619-006

[CEO_DECISION]
id: D-20260619-006
verdict: APPROVE
approved_artifact: Owner Slack approval for Development start, building from `stages/20_ARCH_FINAL.md` / D-20260619-005.
accepted_scope: dev-builder may implement deterministic path/difficulty, same-seed retry, local persistence/events, i18n, and platform-neutral boundaries.
excluded_scope: ads/IAP/rewards, login, backend sync, real Apps in Toss SDK, public 12-level or public 0-100 difficulty promises.
reason: Owner explicitly approved the Development gate; prior architecture scope remains locked.
open_risk: touch feel, PRNG parity, local data loss, and platform-policy recheck.
next_task: Development A dev-builder → dev-reviewer → Development CEO gate.
[/CEO_DECISION]

## D-20260619-007

[CEO_DECISION]
id: D-20260619-007
verdict: OPERATIONAL — Development CEO gate (t_cb1b26ee) blocked pending remediation
approved_artifact: none (operational ruling)
accepted_scope: Reviewer CHANGES_REQUIRED → remediation t_3fed6b22 must complete before gate can decide.
excluded_scope: Do not complete or approve the gate while remediation runs.
reason: Pre-created gate and remediation share parent; both promoted. Gate blocked.
open_risk: Same pattern can recur in other projects.
next_task: t_3fed6b22 remediation → remediation reviewer → gate restart.
[/CEO_DECISION]

## D-20260619-008

[CEO_DECISION]
id: D-20260619-008
verdict: REJECT
approved_artifact: none; Development A1 build report rejected against reviewer handoff t_1dfe53d5.
accepted_scope: Keep only remediation of 5-preset/Intro-first UX, local events/session/feedback, and deterministic seed/fixture gaps.
excluded_scope: QA/Release, ads/IAP/rewards, login/backend sync, real Toss SDK, public 12-level or 0-100 promises.
reason: Reviewer found 3 blocking approved-contract gaps; tests/build passing is insufficient. DeepSeek auxiliary agrees QA must wait.
open_risk: Remediation may partially satisfy contracts; require targeted dev-reviewer verification before next gate.
next_task: canonical chain is t_3fed6b22 remediation → t_b951fb5a targeted dev-reviewer → blocked gate t_cb1b26ee unblock/re-run; duplicate t_8b43c76a/t_1482f223 are discarded by comment.
[/CEO_DECISION]

## D-20260619-009

[CEO_DECISION]
id: D-20260619-009
verdict: REJECT
approved_artifact: none; B2 review `stages/reviews/t_7be5915c-remediation-review.md` remains CHANGES_REQUIRED.
accepted_scope: Next remediation only closes 5 presets/Intro-first/result progression, runtime local events/session/feedback/return_next_day, and deterministic PRNG/locked fixture/browser warning.
excluded_scope: QA/Release, ads/IAP/rewards, login/backend sync, real Toss/Google SDKs, public 12-level or 0-100 promises.
reason: B2 found three approved-scope blockers still open; passing tests/build is insufficient. DeepSeek auxiliary agrees reject/no QA.
open_risk: A3 may widen scope; reviewer must verify runtime emit/hydrate and deterministic fixture evidence, not helper existence.
next_task: t_ebbab1a7 dev-builder → t_b4be7452 dev-reviewer → t_764fead9 CEO gate.
[/CEO_DECISION]

## D-20260620-001

[CEO_DECISION]
id: D-20260620-001
verdict: OPERATIONAL_FRESH_CHAIN
approved_artifact: none; old A3/B3 chain remains non-approval path.
accepted_scope: Owner chose fresh chain over manual promote. Open clean A4→B4→CEO gate for deterministic PRNG/fixture/browser closure, including the unrelated UI TS test/build blocker only as needed for verification.
excluded_scope: preset UX, event/session/feedback wiring, QA/Release, ads/IAP/rewards, login/backend sync, real Toss/Google SDKs, public 12-level or public 0-100 promises.
reason: t_b4be7452 has a dead parked parent and t_a3b2196f is blocked by full test/build; clean chain is safer than manual promotion.
open_risk: A4 must not widen product scope; reviewer must verify full npm test/build and exclusions.
next_task: fresh chain dev-builder → dev-reviewer → studio-ceo gate.
[/CEO_DECISION]

## D-20260620-002

[CEO_DECISION]
id: D-20260620-002
verdict: REJECT
approved_artifact: none; B4 review `stages/reviews/t_ee28c68f-fresh-remediation-review.md` remains CHANGES_REQUIRED.
accepted_scope: Use existing A4b follow-up `t_36e881a0` only to refresh `stages/30_BUILD_REPORT.md` so it matches the verified clean test/build state.
excluded_scope: QA/Release, product-source widening, preset/event/session work, ads/IAP/rewards, login/backend sync, real Toss/Google SDKs, public 12-level or 0-100 promises.
reason: B4 verified code/tests but canonical build report is stale and contradictory; DeepSeek auxiliary agrees no QA while B4 is CHANGES_REQUIRED.
open_risk: Artifact freshness rule may need knowledge-store promotion after B5.
next_task: t_36e881a0 → t_28f4e219 → t_92d9681e.
[/CEO_DECISION]

## D-20260620-003

[CEO_DECISION]
id: D-20260620-003
verdict: APPROVE
approved_artifact: `stages/30_BUILD_REPORT.md` A5 refresh + B5 PASS review `stages/reviews/t_28f4e219-a4b-build-report-refresh-review.md`.
accepted_scope: Development remediation is approved as artifact-only build-report freshness closure; QA/Release may start with split functional and policy checks.
excluded_scope: product-source widening, ads/IAP/rewards, login/backend sync, real Toss/Google SDKs, public 12-level or public 0-100 promises.
reason: B5 found no blockers; tests/build evidence and canonical report now match. DeepSeek auxiliary also recommends approve.
open_risk: Release readiness still unproven until QA functional/policy pass; knowledge rule needs promotion.
next_task: t_635c5fad → t_109bb7ab → t_15d0c4db; knowledge follow-up t_17218af6.
[/CEO_DECISION]

## D-20260620-004

[CEO_DECISION]
id: D-20260620-004
verdict: APPROVE_WITH_CHANGES
approved_artifact: `stages/40_RELEASE_REPORT.md` + `stages/reviews/t_109bb7ab-qa-policy-review.md`.
accepted_scope: QA evidence passes, but release readiness is conditional on Google Play shell separation, privacy/Data Safety prep, and accurate store listing.
excluded_scope: actual store upload, ads/IAP/rewards, login/backend sync, real Toss/Google SDKs, public 12-level ladder, public 0-100 promise.
reason: Functional QA passed 65/65 and build clean; policy is PASS_CONDITIONAL. DeepSeek auxiliary recommends changes before upload.
open_risk: hosted privacy URL/Console validation and device/platform QA remain.
next_task: t_d62cc6f0 → t_6b32773d → t_60fd157a; parallel t_775409cd; fan-in t_d36b4480 → t_c16c995d. Knowledge: t_452ed4e4.
[/CEO_DECISION]

## D-20260620-005

[CEO_DECISION]
id: D-20260620-005
verdict: APPROVE_WITH_CHANGES
approved_artifact: `stages/46_TARGETED_RELEASE_RETEST.md`, `stages/45_RELEASE_PREP_PACK.md`, `stages/reviews/t_d36b4480-final-release-policy-review.md`.
accepted_scope: repo-level post-remediation QA/Release package: COND-1 closed, COND-2/3 prepared, excluded scope preserved.
excluded_scope: Google Play upload/submission, hosted privacy URL, Console Data Safety validation, final binary audit, screenshots, device/platform QA.
reason: Evidence supports conditional repo readiness; DeepSeek auxiliary warned to reject if judged as upload readiness, so no upload-readiness claim is made.
open_risk: Owner/Console hard gates remain before Submit.
next_task: Owner completes URL/Data Safety/screenshots/final audit, then run final upload gate.
[/CEO_DECISION]

## D-20260620-006

[CEO_DECISION]
id: D-20260620-006
verdict: APPROVE_WITH_CHANGES
approved_artifact: `stages/15_UI_DESIGN.md` A2 final candidate.
accepted_scope: Home/Preset/Gameplay/Result visual hierarchy, dark-cyan palette, type/tap/safe-area/i18n rules, B challenge responses.
excluded_scope: product code, UX-flow changes, release/upload approval, ads/IAP/login/backend SDKs, public numeric/12-level promise.
reason: B’s 3 layout challenges were accepted; readability and mood are specified. DeepSeek auxiliary agrees conditional approval because exact Owner complaint and real-device occlusion remain unverified.
open_risk: Architecture/implementation must prove 360px viewport, safe-area, finger occlusion, and no native-looking controls.
next_task: Architecture A1→risk→A2→CEO gate; Development remains Owner-gated.
[/CEO_DECISION]

## D-20260620-007

[CEO_DECISION]
id: D-20260620-007
verdict: APPROVE_WITH_CHANGES
approved_artifact: `stages/20_ARCH_FINAL.md` A2 final candidate.
accepted_scope: Visual/UI remediation architecture for Home summary→sheet, Result sticky+inline retry, tokenized controls, viewport/safe-area/i18n/reduced-motion gates; current adapters limited to storage/analytics/locale/haptics.
excluded_scope: Development start, product-flow widening, ads/IAP/login/share/backend files or SDKs, release/upload, public numeric/12-level promise.
reason: B findings 1/2/4 are resolved; B3 is acceptable only as a CEO constraint. DeepSeek auxiliary recommends conditional approval with future-only adapter creation banned.
open_risk: real-device 360px, safe-area/finger occlusion, sticky/inline collision, locale overflow.
next_task: Ask Owner to approve this constrained Development scope before any dev-builder card.
[/CEO_DECISION]

## D-20260620-008

[CEO_DECISION]
id: D-20260620-008
verdict: APPROVE
approved_artifact: Owner Slack approval for Development start from D-20260620-007 / `stages/20_ARCH_FINAL.md` A2.
accepted_scope: Implement only the approved Visual/UI remediation: class/CSS coverage, 360/390/430 viewport checks, safe-area, retry non-overlap, i18n overflow, reduced motion; existing adapter boundary remains storage/analytics/locale/haptics only.
excluded_scope: auth/login, ads, IAP, share, backend transport files/stubs/SDKs, release/upload, public numeric/12-level promise, broader product-flow changes.
reason: Owner explicitly approved Hidden Line Development start in Slack; scope remains bounded by Architecture D-20260620-007.
open_risk: real-device viewport/safe-area/finger occlusion and locale overflow still require implementation review and QA evidence.
next_task: Development dev-builder → dev-reviewer → CEO Development gate.
[/CEO_DECISION]

## D-20260620-009

[CEO_DECISION]
id: D-20260620-009
verdict: APPROVE_WITH_CHANGES
approved_artifact: Owner approval for 2-pass split replacing oversized review `t_1b9a8434`.
accepted_scope: Run `t_a86a2753` static review → `t_2fb56075` runtime/evidence review → `t_e6d8e2d2` CEO gate; raise dev-reviewer default 34→46 as safety margin.
excluded_scope: Development approval, QA/Release, store/upload, code/design changes, broad review retry.
reason: Four failures show one card mixed doc load, static review, viewport QA, and tests/build; split is safer than another broad retry.
open_risk: A2 may still find Visual/UI blockers; old gate `t_7abd0be6` remains superseded.
next_task: `t_a86a2753`.
[/CEO_DECISION]

## D-20260620-010

[CEO_DECISION]
id: D-20260620-010
verdict: REJECT
approved_artifact: none; split reviews `t_a86a2753` and `t_2fb56075` remain CHANGES_REQUIRED.
accepted_scope: Open only targeted remediation for rejected scope creep, hard-coded i18n copy, and JS/canvas reduced-motion blocker.
excluded_scope: QA/Release, store/upload, auth/login, ads, IAP, share, backend, public numeric/12-level promise, broader product-flow/gameplay/storage widening.
reason: A1 found high-scope drift plus i18n/reduced-motion gaps; A2 confirmed layout passes but reduced-motion still animates. DeepSeek auxiliary agrees no QA.
open_risk: real-device thumb/safe-area pass remains after remediation review.
next_task: `t_2de4d299` → `t_c967c0c5` → `t_3fc361b3`.
[/CEO_DECISION]

## D-20260620-011

[CEO_DECISION]
id: D-20260620-011
verdict: REJECT
approved_artifact: none; Owner screenshot review rejects current Visual/UI readiness.
accepted_scope: Stop stale targeted dev remediation; restart Visual/UI A→B→A from original game/design/future plans and current screenshots.
excluded_scope: code changes, release/upload, ads/IAP/login/backend, public numeric/12-level promise.
reason: Live UI shows box/card clutter, messy difficulty/sight/feedback controls, and original dark calm tactile direction drift. DeepSeek auxiliary agrees design restart before dev.
open_risk: schedule slip, prior dev work may be discarded, real-device visual QA still required.
next_task: Visual restart A1 → UI layout challenge → A2 → CEO gate.
[/CEO_DECISION]

## D-20260620-012

[CEO_DECISION]
id: D-20260620-012
verdict: REJECT (SUPERSEDED)
approved_artifact: none; entire chain t_2de4d299 → t_c967c0c5 → t_3fc361b3 is stale per D-20260620-011.
accepted_scope: No substantive decision needed; D-20260620-011 already ordered Visual/UI restart. Redirect to new canonical gate t_0ec04554.
excluded_scope: Do not revive, re-open, or re-approve the old targeted remediation path.
reason: Parent t_c967c0c5 archived SUPERSEDED; dev-reviewer confirmed D-20260620-011 killed this chain. New visual restart A1→B→A2 is in progress (t_a66e3d2d running).
open_risk: t_0ec04554 blocked until t_a66e3d2d completes.
next_task: t_0ec04554 (already pre-created, pending parent t_a66e3d2d).
[/CEO_DECISION]

## D-20260620-013

[CEO_DECISION]
id: D-20260620-013
verdict: APPROVE_WITH_CHANGES
approved_artifact: stages/16_VISUAL_RESTART_PLAN.md v0.2.0 A2 final
accepted_scope: 9 visual-defect corrections (L1-L9), 3 B challenges accepted, 8 component rules, 10 handoff boundaries, 18 QA items. Replaces stale D-20260620-006/D-20260620-010 path. Prior functional QA D-20260620-004 preserved as functional-only.
excluded_scope: code, Development, Product/UX changes, ads/IAP, login/backend, 12-level/0-100 promise, release/upload.
reason: A→B→A complete. B 3건 수용. Lineage maps design-plan.md → drift → correction. Addresses "boxes only everywhere" via progressive disclosure + first-viewport compression. DeepSeek auxiliary approves.
open_risk: 실기기 visual QA, popover row 360px tightness, Owner Development approval.
next_task: 🔴 Owner Development approval → dev-builder. Send slack:studio-reports.
[/CEO_DECISION]

## D-20260620-014

[CEO_DECISION]
id: D-20260620-014
verdict: APPROVE
approved_artifact: Owner Slack approval (message_id=1781941080.518189) — "반드시 디자인기획문과 샘플파일 asset 파일을 참조 한다음 만들어 승인합니다"
accepted_scope: Development starts from D-20260620-013 Visual/UI restart plan with mandatory design-doc + asset reference constraint. dev-builder must read ai/design/2026-06-08-hidden-line-design-plan.md, ai/design/assets/hidden-line-reference-board.png, ai/plans/design-plan.md(v0.4), and stages/16_VISUAL_RESTART_PLAN.md before any code change.
excluded_scope: Product/UX flow changes, ads/IAP/login/backend, 12-level/0-100 public promise, release/upload.
reason: Owner approved with explicit condition. DeepSeek auxiliary confirms scope is bounded.
open_risk: 실기기 visual QA, popover 360px tightness, prior dev work 일부 폐기.
next_task: dev-builder → dev-reviewer → CEO gate (Owner 재승인 필요).
[/CEO_DECISION]

## D-20260620-015

[CEO_DECISION]
id: D-20260620-015
verdict: APPROVE
approved_artifact: stages/30_BUILD_REPORT.md v1.6.0 + dev-reviewer t_6e1383ce review report
accepted_scope: Visual/UI Restart Development — 9 Visual Defects L1-L9, 10 Handoff boundaries H1-H10, 18 QA Checklist Q1-Q18. 66/66 tests, build clean.
excluded_scope: F1(difficulty popover semantic mismatch), F2(hardcoded DarkPopover labels), N1(duplicate CSS) — SHOULD_FIX/NICE_TO_HAVE, non-blocking. Actual-device viewport/notch QA.
reason: 6개 gate criteria 모두 충족. L1-L9 전면 구현 완료, H1-H10 handoff 경계 준수, npm test 66/66, npm build 성공. dev-reviewer PASS_WITH_CHANGES. F1(difficulty popover label "난이도"지만 visibility level 변경 → Plan §2.2 rule 3 불일치)과 F2(DarkPopover.tsx 하드코딩 라벨)는 실제 사용자 혼선 가능성이 있으나 시각 결함 교정 자체를 막지 않음. post-approval remediation 권고. DeepSeek auxiliary unavailable (API key auth 실패) — CEO 직접 판단.
open_risk: F1으로 인한 difficulty/sight 구분 사용자 혼선 가능성. 실기기 notch/punch-hole + safe-area viewport QA 필요.
next_task: QA/Release stage (qa-functional → qa-policy). Owner에게 Slack 보고.
[/CEO_DECISION]
