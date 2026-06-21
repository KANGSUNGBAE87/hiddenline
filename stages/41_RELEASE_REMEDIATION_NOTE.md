---
version: 1.0.0
status: final
updated: 2026-06-20
canonical: false
project: Hidden Line / 히든라인
related_decision: D-20260620-004
scope: QA/Release remediation A
---

# Hidden Line QA/Release Remediation A — Shell target behavior

## What changed
- Google Play/default builds now render a neutral Google Play shell instead of the Toss miniapp chrome.
- Apps in Toss remains available behind an explicit target flag: `VITE_TARGET=apps-in-toss`.
- Toss-specific controls (`더보기`, `미니앱 종료`, Toss brand menu/icon) are only shown in the Apps in Toss target.
- The Google Play path no longer calls `window.close()` from the top chrome.

## Verification
- `npm test` — PASS, 17 files / 65 tests
- `npm run build` — PASS

## Notes
- This remediation stays inside the approved narrow scope.
- No ads/IAP/rewards, login, backend sync, or real Toss/Google SDK integration was added.
