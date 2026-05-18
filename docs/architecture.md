# Architecture

Design decisions behind `react-native-update-gate` and why the package looks the way it does.

## Why pure-JS iOS modal instead of a native module

Apple has no first-party force-update API. Every iOS solution boils down to "show a modal, deep-link to the App Store." That's a 100-line React Native component, not a 500-line Swift bridge.

Going pure-JS on iOS gives you:

- **Smaller IPA** — no native code, no `react-native-siren` weight.
- **Themeable from app code** — colors, radius, fonts all `useTheme()`-driven; no Xcode rebuild needed to change the look.
- **Easier to ship** — no `pod install` surprises, no Swift/Obj-C bridging headers.
- **Same modal everywhere** — JS rendering means perfect parity across iOS versions; you don't depend on what `UIAlertController` looked like in iOS 14 vs 17.

The trade-off: iOS users can technically force-quit the app from the modal. That's an acceptable cost — the modal reappears on the next cold start, so the user is functionally blocked from using the app until they update.

## Why Play App Update SDK 2.x (not legacy Play Core)

Google moved away from `com.google.android.play:core:1.x` in favour of split, narrower modules in 2023. `com.google.android.play:app-update:2.x`:

- Is what the official docs now point at.
- Drops Play Core's many unrelated APIs we don't need (asset delivery, in-app reviews, feature delivery).
- Has clean Kotlin coroutines support via `app-update-ktx`.
- Stays evergreen — Google's planned 2026+ updates target this surface.

Older `sp-react-native-in-app-updates` is still on the legacy SDK at the time of writing.

## Why a hook + components, not a singleton imperative API

Most existing libraries expose a single class:

```ts
const updates = new SpInAppUpdates(false);
updates.checkNeedsUpdate().then(result => ...);
```

That works, but doesn't fit React's mental model: state lives in components, side effects fire from `useEffect`, UI re-renders on state change. With a hook:

```ts
const { verdict } = useUpdate({ installed, minRequired, latestAvailable });
return <ForceUpdateModal visible={verdict === 'force'} />;
```

The verdict is reactive. Thresholds update from your server → React re-renders → modal appears or disappears. No imperative `if (shouldShow) modal.open()` plumbing.

The pure-functional `evaluateUpdate` underneath is trivially testable and platform-agnostic.

## Why server-driven thresholds, not store-driven

Two approaches:

- **Store-driven**: scrape iTunes Lookup / Play Store metadata to find "what's the latest published version", compare to installed.
- **Server-driven**: your own server returns `min_app_version` and `latest_app_version`.

Store-driven libraries assume the moment you publish a new version, every user on the old version sees the update prompt. That's the wrong UX for staged migrations:

- Apple and Google take hours to days to roll out a version to all regions. Users in late-rollout regions tap "Update" only to find no new version exists yet → frustrating.
- You can't separate "available" from "critical" without your own metadata anyway.
- You can't roll back a version requirement without re-publishing.

Server-driven inverts the control: you publish a new build, wait for both stores to fully roll out (24-72 hours), then flip the server flag. Users go from "no prompt" to "prompt" instantly and uniformly. You can also turn it off without another release.

This package treats server-driven as the primary mode. Store-driven fallback can be added without breaking the API in a future release.

## Why no FLEXIBLE flow in v0.1.0

Google's FLEXIBLE flow (background download, app stays usable, restart prompt later) is genuinely useful — but it's a different mental model than the force-update gate. It's about *progressive enhancement* of an already-usable app, not about *blocking* an outdated app.

For v0.1.0 we're focused on the gate. FLEXIBLE will be added in 0.2.0 as `presentUpdate('flexible')` alongside the suggest banner, without breaking the existing API.

## Trade-offs we accepted

- **Vibration only, no `react-native-haptic-feedback`** — keeping the dependency list minimal. The built-in `Vibration` API is enough for a single button-press tick.
- **No `BlurView` by default** — `@react-native-community/blur` is heavy and not in core RN. The semi-transparent backdrop colour does the job.
- **No built-in i18n** — every string is a prop. Consumers wire `i18next` / their preferred i18n library.
- **No default illustration** — slot is empty; consumers bring `react-native-svg` / `lottie-react-native` / `<Image>` as needed.
