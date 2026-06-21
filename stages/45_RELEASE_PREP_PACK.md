---
version: 1.0.0
status: confirmed
updated: 2026-06-20
canonical: true
phase: QA/Release A store/privacy prep
project: Hidden Line / 히든라인
basis_date: 2026-06-20 KST
input_decision_id: D-20260620-004
approved_inputs:
  - 01_DECISIONS.md D-20260620-004
  - stages/40_RELEASE_REPORT.md
  - stages/reviews/t_109bb7ab-qa-policy-review.md
  - stages/08_PRODUCT_PLAN.md
  - stages/10_UX_FINAL.md
scope_status: COND-2 and COND-3 release-prep pack only; not an upload-ready declaration
---

# Hidden Line QA/Release A — Data Safety and Store Listing Prep Pack

## Summary

This pack converts the approved QA/policy findings for COND-2 and COND-3 into a pre-upload document set for a Google Play-first release while preserving Apps in Toss compatibility. It does not declare upload readiness: a hosted privacy policy URL, Google Play Console Data Safety validation, Google Play screenshot capture from the remediated shell, and the separate COND-1 shell-separation code fix remain outside repo-only completion. [owner_constraint: D-20260620-004 accepted_scope; approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md Section 5-6]

## 1. Fixed basis and scope boundaries

| Item | Decision | Basis |
| --- | --- | --- |
| First release target | Google Play-first Android game release, while keeping Apps in Toss compatibility | [owner_constraint: /Users/kangsungbae/Documents/지식저장소/projects/hiddenline/platform.md:15-18] |
| This document's scope | Resolve non-code release-prep gaps for COND-2 Privacy/Data Safety and COND-3 store listing accuracy | [owner_constraint: task body accepted narrow scope; approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md:150-177] |
| Verified implemented feature boundary | Precision tracing core loop, daily/local challenge entry, five named presets, same-seed retry, local best records, KO/EN i18n | [approved_artifact: stages/40_RELEASE_REPORT.md Summary; approved_artifact: stages/10_UX_FINAL.md Sections 2-4] |
| Explicitly excluded scope | Actual store upload, ads/IAP/rewards, login, backend sync, real Toss/Google SDKs, public 12-level ladder, public 0-100 promise | [owner_constraint: D-20260620-004 excluded_scope] |
| Remaining non-document dependency | Google Play shell must not expose Toss-specific chrome before screenshot capture and upload | [approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md COND-1] |

## 2. Current verified app data boundary

### 2.1 On-device data inventory

| Data area | Current storage key / form | Purpose | Transmitted off-device? | Basis |
| --- | --- | --- | --- | --- |
| Language preference | `hiddenline.locale.v1` | Remember KO/EN selection | No | [approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md:85-87; source: src/App.tsx:17] |
| Last chosen preset | `hiddenline.preset.v1` | Re-focus the next start state | No | [source: src/App.tsx:18; approved_artifact: stages/10_UX_FINAL.md:90-104] |
| Session state | `hiddenline.session-state.v1` | Resume last preset / session context | No | [source: src/storage/schema.ts:91; source: src/storage/localStorageRepository.ts:110-112] |
| Run records / local bests | `hiddenline.records.v1` | Save local daily results and best records | No | [source: src/storage/schema.ts:90; approved_artifact: stages/40_RELEASE_REPORT.md:93-100] |
| Session events and optional difficulty feedback payloads | `hiddenline.session-events.v1` | Keep local run events and local feedback evidence | No | [source: src/storage/schema.ts:45-92; approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md:94-109] |

### 2.2 Negative declarations that must stay true at upload time

- No login or account creation. [approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md:94-99]
- No backend transport for gameplay records or feedback. [approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md:94-99; source: src/platform/noopAdapters.ts:24-27]
- No analytics transmission. [approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md:94-99; source: src/platform/noopAdapters.ts:9-13]
- No ads, IAP, rewards, or cloud save. [approved_artifact: stages/40_RELEASE_REPORT.md:136-139; owner_constraint: D-20260620-004 excluded_scope]
- Optional free-text difficulty feedback stays local and raw text is excluded from analytics transmission. [approved_artifact: stages/20_ARCH_FINAL.md challenge response + 5.4; approved_artifact: stages/40_RELEASE_REPORT.md:101-103]

If any SDK, permission, login path, remote logging, or server endpoint is added before submission, this pack must be revised before Play Console answers are submitted. [source: https://support.google.com/googleplay/android-developer/answer/10787469 ; source: https://developer.android.com/privacy-and-security/declare-data-use]

## 3. Privacy policy URL requirement

Google Play Data Safety completion still requires a privacy policy URL and accurate disclosure, even when the current verified build does not transmit user data off-device. The URL must be public, accessible without login, and point to an app-specific policy page. This repository can draft the content, but hosting the final URL is an Owner/Console action. [approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md COND-2; source: https://support.google.com/googleplay/android-developer/answer/10787469]

### 3.1 URL requirement draft

Required URL characteristics before Console submission:
- Public HTTPS URL
- No login wall
- App-specific page for Hidden Line, not a generic unrelated company policy
- Content consistent with the final Play Console Data Safety answers
- Updated if the app later adds analytics, login, ads, IAP, backend sync, or any new SDK that touches user data

Suggested host targets:
- GitHub Pages under the project or owner site
- Project website privacy path
- Any stable HTTPS page the Owner controls

### 3.2 Hostable privacy policy draft

Below is a draft that can be hosted with final Owner contact details inserted.

```markdown
# Hidden Line Privacy Policy

Last updated: 2026-06-20

Hidden Line is a local-first precision tracing game.

## 1. What Hidden Line stores

Hidden Line currently stores the following information only on the user's device:
- language preference
- last selected preset and recent session state
- local gameplay records and local best results
- local run events needed for the current build's on-device flow
- optional difficulty feedback that the user submits inside the app

## 2. What Hidden Line does not currently do

The current verified build does not:
- require account creation or login
- collect personal information such as name, email address, phone number, or address
- transmit gameplay records or feedback to Hidden Line servers
- use ads, in-app purchases, rewards, or cloud save
- provide online leaderboards, multiplayer, or server-side profile sync

## 3. How data is used

The current verified build uses on-device storage only to:
- remember app language and preset choices
- show local records and recent session state
- support same-seed retry and local daily challenge flow
- keep optional on-device feedback for difficulty tuning in the current local-first build

## 4. Data sharing

Hidden Line does not currently share user data with Hidden Line, Google, advertisers, analytics providers, or other third parties as part of the verified build described in this policy.

## 5. Data deletion and reset limits

Because the current verified build does not keep a server account or server copy of user data, deletion is limited to data stored on the local device.

Current limitation:
- the repository evidence does not show a dedicated in-app account deletion or global reset flow yet

Current user deletion path:
- clear the app's local storage / app data on the device, or
- uninstall and reinstall the app to remove locally stored records, preferences, and session state on that device

After local deletion, previously removed local records cannot be restored by Hidden Line because the current verified build has no cloud backup or server-side account recovery.

## 6. Children's privacy

This policy draft does not claim a special child-directed data program. If the release classification or audience setting changes, the policy must be updated before submission.

## 7. Policy changes

If Hidden Line later adds login, analytics, ads, in-app purchases, remote storage, crash reporting, or any other off-device data handling, this privacy policy and the Google Play Data Safety answers must be updated before that build is released.

## 8. Contact

Owner must insert a valid support contact before hosting:
- support email: [OWNER_TO_INSERT]
- support page or website: [OWNER_TO_INSERT]
```

## 4. Google Play Data Safety answer draft

### 4.1 Working assumption for this draft

This answer draft is valid only if the final upload candidate still matches the verified repo state below:
- localStorage-only storage
- no login/account system
- no remote analytics or crash SDK
- no ads/IAP/rewards SDK
- no backend or cloud sync
- no new permissions or libraries that touch user data

Basis: [approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md Section 3; approved_artifact: stages/40_RELEASE_REPORT.md excluded scope table; source: https://support.google.com/googleplay/android-developer/answer/10787469 ; source: https://developer.android.com/privacy-and-security/declare-data-use]

### 4.2 Draft console answers

| Play Console theme | Draft answer | Why |
| --- | --- | --- |
| Does the app collect or share any required user data types? | Draft: `No` | Current verified build keeps records, preferences, events, and optional feedback on-device only and does not transmit them off-device. [approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md:94-109] |
| Is user data encrypted in transit? | Draft: `Not applicable` under the no-collection/no-transmission path | Current verified build has no network transmission. [approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md:94-99] |
| Does the app provide a way to request data deletion? | Draft: follow the `No collected data` / `not applicable` path in Console if offered; still disclose local deletion instructions in the privacy policy | There is no server-held account data. Current deletion is local-device-only. [approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md COND-2; source: src/storage/schema.ts; source: src/storage/localStorageRepository.ts] |
| Privacy policy URL | Required before submit | Play Console requires the policy link even when this build answers `No` for collection/sharing. [source: https://support.google.com/googleplay/android-developer/answer/10787469] |

### 4.3 Audit notes before the Owner presses Submit

Before using the draft above, the Owner must confirm:
1. The final AAB/APK still has no analytics, ad, login, or remote-storage SDK.
2. The manifest did not gain data-sensitive permissions.
3. No code path was added that sends feedback, records, or identifiers to a server.
4. The hosted privacy policy matches the exact shipped build.

If any answer becomes false, the Data Safety section must be revised before submission. This pack is a draft, not a substitute for the final binary audit. [source: https://support.google.com/googleplay/android-developer/answer/10787469 ; source: https://developer.android.com/privacy-and-security/declare-data-use]

## 5. Store listing claim boundary

### 5.1 What the listing may claim

Store copy may describe only the features verified in the current build:
- precision tracing challenge
- a local daily challenge / today's challenge flow
- five named presets: Intro, Easy, Standard, Hard, Expert
- same-seed retry after a result
- local best records on the device
- Korean default with English selectable, if language support is mentioned

Basis: [approved_artifact: stages/40_RELEASE_REPORT.md Summary; approved_artifact: stages/10_UX_FINAL.md:53-59, 63-70, 188-205, 240-286]

### 5.2 What the listing must not claim

| Forbidden claim | Why blocked | Basis |
| --- | --- | --- |
| Online leaderboard / worldwide ranking / compete with players worldwide | No backend ranking or online leaderboard exists | [approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md:166-177] |
| Multiplayer / live match / versus mode | No multiplayer flow exists | [owner_constraint: D-20260620-004 excluded_scope] |
| Cloud save / account sync | No login or backend sync exists | [approved_artifact: stages/40_RELEASE_REPORT.md:137-138] |
| Cash, prize, reward, or point-winning language | Ads/IAP/rewards are excluded and policy-sensitive | [owner_constraint: D-20260620-004 excluded_scope; approved_artifact: stages/08_PRODUCT_PLAN.md 7.2-7.4] |
| 12 public levels or public 0-100 difficulty promise | Explicitly excluded and not the approved public exposure | [owner_constraint: D-20260620-004 excluded_scope; approved_artifact: stages/08_PRODUCT_PLAN.md 4.1-4.7] |
| Real Toss miniapp release or real Google Play service integration | Real platform SDK integration is still excluded | [owner_constraint: D-20260620-004 excluded_scope] |

### 5.3 Safe copy draft

Short-description draft:
- `Trace hidden lines, retry the same seed, and chase your local best.`

Long-description draft:
- `Hidden Line is a precision tracing challenge where you follow a hidden path with your fingertip.`
- `Start quickly with five named presets from Intro to Expert, then retry the same seed to test whether the line or your touch made the difference.`
- `Take on today's local challenge flow and track your own local best records on the device.`

Copy notes:
- Prefer `local best`, `same seed`, `five named presets`, and `today's challenge`.
- Avoid `global`, `ranked online`, `world leaderboard`, `multiplayer`, `cloud`, `cash`, `reward`, `prize`, and `official season`.
- If `daily` wording risks sounding like a server leaderboard, qualify it as a challenge flow or local daily line pack, not an online competition system. [approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md COND-3]

## 6. Screenshot and creative guardrails

### 6.1 Required principles

- Use only real app screens from the actual Google Play-target build. [approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md:175-177]
- Show implemented flows only: Home, tracing gameplay, Result with same-seed retry, and local daily/local records context.
- Keep captions aligned with actual UI and the verified feature set.
- Do not add badges, overlays, or marketing text that imply online ranking, prizes, or cloud features.

### 6.2 Current screenshot blocker

Do not capture final Google Play screenshots from the current Toss-shell-exposed build. COND-1 remains open: Google Play screenshots should wait until the shell-separation remediation and re-verification chain is done. Otherwise the store assets would misrepresent the intended Google Play shell. [approved_artifact: stages/reviews/t_109bb7ab-qa-policy-review.md COND-1; owner_constraint: D-20260620-004 accepted_scope]

### 6.3 Recommended screenshot set after COND-1 closes

1. Home screen: title + immediate start + five preset framing
2. Gameplay screen: fingertip tracing / precision feel
3. Result screen: same-seed retry as first visible CTA
4. Daily challenge entry or local record context screen

### 6.4 Disallowed screenshot patterns

- Toss-specific `더보기` / `미니앱 종료` chrome in Google Play assets before shell separation is fixed
- Fake leaderboard tables, player counts, rank numbers, or "global" badges
- Cloud icons or login prompts implying account sync
- Reward, cash, or prize imagery
- Promotional claims about ads, IAP, or points

## 7. Remaining Owner/Console actions and release blockers

| Item | Status | Owner / system action | Why it still blocks actual upload |
| --- | --- | --- | --- |
| Host public privacy policy URL | OPEN | Owner publishes the draft to a public HTTPS page | Play Console submission still needs a real URL, not a repo draft |
| Insert support contact into privacy policy | OPEN | Owner adds valid support email / site | A publishable privacy policy needs a real contact path |
| Complete Play Console Data Safety section | OPEN | Owner enters and submits the draft answers in Console | Repo cannot perform Console validation |
| Final binary audit for new SDKs/permissions | OPEN | Owner or QA checks the final upload artifact | The draft answers are only valid if the final binary matches the verified repo state |
| Google Play shell-separation remediation | OPEN, separate code chain | Upstream dev/review/retest tasks must pass | Screenshots and app presentation should not show Toss-specific chrome on Google Play |
| Capture final store screenshots from remediated build | BLOCKED by COND-1 | Owner captures assets after the remediated build is verified | Current build screenshots would not represent the intended Google Play shell |
| Final store copy check against actual upload build | OPEN | Owner reviews the final listing in Console | Prevents deceptive or stale claims at submission time |

## 8. Release-prep pass criteria for this document scope

This pack should be treated as sufficient for COND-2 and COND-3 document prep only when all items below are true:
- Privacy policy draft is hosted at a public URL with real support contact.
- Play Console Data Safety form is filled using a final-binary audit, not this draft alone.
- Store copy uses only the allowed claim set in Section 5.
- Screenshot capture waits for the Google Play shell remediation path to close.
- Actual upload readiness is still judged at the later release gate, not by this document alone.

## 9. knowledge_candidates

### KC-01: Local-first no-login Google Play apps still need a hosted privacy URL and explicit Data Safety declaration
- maturity: candidate
- summary: Even when a Google Play build keeps all records, preferences, and optional feedback on-device and never transmits them off-device, the release-prep bundle still needs a public privacy policy URL and an explicit Play Console Data Safety declaration tied to the final binary audit.
- evidence_path: `/Users/kangsungbae/Documents/hiddenline/stages/45_RELEASE_PREP_PACK.md`; `/Users/kangsungbae/Documents/hiddenline/stages/reviews/t_109bb7ab-qa-policy-review.md`; `https://support.google.com/googleplay/android-developer/answer/10787469`
- suggested_owner_file: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/google-play-data-safety-local-first.md`

### KC-02: Local-only challenge games need store copy that says local records, not online competition
- maturity: candidate
- summary: For Google Play-first local-only games with same-seed retry and daily challenge flows, store listing copy should name `local best` and challenge replay directly and avoid any wording that implies online ranking, worldwide competition, multiplayer, cloud save, or prizes until those systems actually exist.
- evidence_path: `/Users/kangsungbae/Documents/hiddenline/stages/45_RELEASE_PREP_PACK.md`; `/Users/kangsungbae/Documents/hiddenline/stages/reviews/t_109bb7ab-qa-policy-review.md`; `/Users/kangsungbae/Documents/지식저장소/projects/hiddenline/platform.md`
- suggested_owner_file: `/Users/kangsungbae/Documents/지식저장소/docs/workflows/app-platform-standard.md`

## Change Log

| Version | Date | Summary |
| --- | --- | --- |
| 1.0.0 | 2026-06-20 | Initial release-prep pack for COND-2 privacy/Data Safety and COND-3 store listing accuracy under D-20260620-004. |
