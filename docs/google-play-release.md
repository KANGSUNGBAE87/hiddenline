# Hidden Line Google Play Release Prep

Updated: 2026-06-26
Status: packaging scaffold prepared; final AAB build is blocked on local Android toolchain setup.

## App Identity

- App name: `Hidden Line`
- Package name: `com.kangsungbae.hiddenline`
- Platform shell: Capacitor Android
- Target SDK: 35+
- Current generated SDK values: `compileSdkVersion = 36`, `targetSdkVersion = 36`
- First release target: Google Play, while preserving Apps in Toss compatibility.

## Build Commands

```bash
npm run build:google-play:web
npm run cap:sync:android
npm run android:bundle:release
```

Expected Android App Bundle after a successful signed release build:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

Current local blocker:

- This Mac currently has no Java Runtime / Android SDK available to Gradle, so
  the repository can be scaffolded and synced, but a final `.aab` cannot be
  produced here until JDK + Android SDK are installed.

## Signing

Google Play requires a signed Android App Bundle.

- Use Google Play App Signing in Play Console.
- Create and protect a local upload key.
- Do not commit keystores, passwords, or `keystore.properties`.
- `.gitignore` excludes `*.jks`, `*.keystore`, `keystore.properties`, and
  `android/app/release/`.

Owner-gated before upload:

- Google Play developer account access
- App creation in Play Console
- Upload key generation
- App signing enrollment / confirmation
- Release track selection
- Final `.aab` upload

## Data Safety

Current Google Play Data Safety draft for this build:

- Account creation: not required
- Login: not enabled
- Ads: not enabled
- In-app purchases: not enabled
- Analytics SDK: not enabled
- Cloud sync / server ranking: not enabled in the app UI
- Local gameplay data: stored on device for records, settings, and daily play
- Supabase backend: prepared for future features, but current app bundle must be
  audited before declaring any network-backed data collection
- DeepSeek AI: server-side integration boundary is prepared, but no user-facing
  AI feature is enabled in this build

Before production release:

- Run a final binary/network audit.
- Update Data Safety if Supabase sync, login, rankings, ads, IAP, analytics, or
  AI features are enabled.
- Publish a hosted privacy policy URL. The repository draft is
  `public/privacy.html`.

## Store Listing Draft

Short description:

```text
Trace the hidden line with calm precision.
```

Full description draft:

```text
Hidden Line is a quiet precision tracing game.

Each day gives you a hidden path. The line only becomes clear near your finger,
so every move is about focus, rhythm, and control. Follow the path from start to
finish, avoid drifting too far away, and improve your own daily record.

Features:
- Daily-first hidden line challenge
- Practice mode with path and sight difficulty controls
- Local weekly records
- Calm dark visual style
- No ads or in-app purchases in the current build
```

Suggested screenshots:

- Home with Daily challenge visible above the fold
- Play screen with focus reveal
- Warning correction state
- Success result
- Practice difficulty selectors
- Weekly record view

## Apps in Toss Compatibility Note

Google Play is the first release target for this game build, but the codebase
must remain compatible with Apps in Toss.

Keep these separate:

- Google Play shell: Capacitor Android, Play signing, Play Data Safety, Play
  content rating, Android permissions
- Apps in Toss shell: Toss navigation/close behavior, Apps in Toss UX guide,
  `.ait` deployment, Toss login/ads/IAP adapters when enabled

Do not import platform SDKs directly into product/domain logic. Keep login,
ads, in-app purchase, storage, analytics, haptics, share, and backend transport
behind adapters.

## Release Checklist

- [x] Capacitor Android scaffold exists.
- [x] Package name fixed as `com.kangsungbae.hiddenline`.
- [x] Google Play web build script exists.
- [x] Android sync script exists.
- [x] Release bundle script exists.
- [x] Keystore and release artifacts are ignored by git.
- [x] Privacy policy draft exists.
- [ ] Install JDK and Android SDK.
- [ ] Configure local upload signing.
- [ ] Generate signed Android App Bundle.
- [ ] Run physical Android device QA.
- [ ] Complete Play Console Data Safety.
- [ ] Complete Play Console content rating.
- [ ] Add final screenshots and feature graphic.
- [ ] Verify Apps in Toss compatibility is not broken.

## Verification - 2026-06-26

Passed:

```bash
npm test -- tests/release/googlePlayReadiness.test.ts --run
npm test -- --run
npm run build:google-play:web
npm run cap:sync:android
```

Blocked:

```bash
cd android && ./gradlew bundleRelease
```

Result:

```text
Unable to locate a Java Runtime.
```

Next local setup required before producing the final `.aab`:

- Install JDK.
- Install Android Studio / Android SDK.
- Configure Android SDK path.
- Configure upload signing.
- Re-run `npm run android:bundle:release`.

## Official References

- Google Play app setup:
  https://support.google.com/googleplay/android-developer/answer/9859152
- Google Play Data Safety:
  https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play target API level:
  https://support.google.com/googleplay/android-developer/answer/11926878
- Android target SDK requirements:
  https://developer.android.com/google/play/requirements/target-sdk
- Android app signing:
  https://developer.android.com/studio/publish/app-signing
- Android App Bundle upload:
  https://developer.android.com/studio/publish/upload-bundle
- Google Play App Signing:
  https://support.google.com/googleplay/android-developer/answer/9842756
- Apps in Toss Consumer UX Guide:
  https://developers-apps-in-toss.toss.im/design/consumer-ux-guide.html
- Apps in Toss deploy guide:
  https://developers-apps-in-toss.toss.im/development/deploy.html
