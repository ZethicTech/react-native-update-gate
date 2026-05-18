# @zethictech/react-native-update-gate

> Beautiful, type-safe, server-driven force/suggest update gate for React Native apps.

[![npm](https://img.shields.io/npm/v/@zethictech/react-native-update-gate.svg)](https://www.npmjs.com/package/@zethictech/react-native-update-gate)
[![license: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Force users off broken old builds with **Google Play's native immediate flow** on Android, and a **polished animated modal** on iOS. Drive version thresholds from your own server, not from store metadata. Ship in 15 minutes.

```tsx
import { useUpdate, ForceUpdateModal, SuggestUpdateBanner, configureUpdateGate } from '@zethictech/react-native-update-gate';
import DeviceInfo from 'react-native-device-info';

configureUpdateGate({
  androidPackageName: 'com.acme.app',
  appStoreId: '1234567890',
});

function App() {
  const { verdict } = useUpdate({
    installed: DeviceInfo.getVersion(),
    minRequired: serverConfig.min_app_version,
    latestAvailable: serverConfig.latest_app_version,
  });

  return (
    <>
      <Navigator />
      <ForceUpdateModal visible={verdict === 'force'} />
      <SuggestUpdateBanner visible={verdict === 'suggest'} />
    </>
  );
}
```

That's the whole integration.

---

## Why another in-app-updates library

| | `@zethictech/react-native-update-gate` | `sp-react-native-in-app-updates` | `react-native-version-check` | `forceupdate-reactnative` |
|---|---|---|---|---|
| Modern Play App Update SDK 2.x | ✅ | ⚠️ legacy Play Core | ❌ | ❌ |
| TypeScript-first (strict types shipped) | ✅ | ⚠️ partial | ❌ | ⚠️ |
| React hooks API (`useUpdate()`) | ✅ | ❌ | ❌ | ❌ |
| Server-driven thresholds (first class) | ✅ | ⚠️ workaround | ✅ | ⚠️ |
| Animated, themeable iOS modal | ✅ | ❌ (system alert) | n/a | ⚠️ |
| Suggest mode (dismissible banner) | ✅ | ⚠️ via FLEXIBLE | ❌ | ❌ |
| Tree-shakeable ESM build | ✅ | ❌ | ⚠️ | ⚠️ |
| Zero iOS native code (smaller IPA) | ✅ | ❌ | ✅ | ✅ |
| New Architecture (Fabric) ready | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Accessibility-first | ✅ | ❌ | n/a | ⚠️ |
| Haptic feedback on iOS | ✅ | ❌ | n/a | ❌ |

---

## Installation

```sh
yarn add @zethictech/react-native-update-gate compare-versions
# or
npm install @zethictech/react-native-update-gate compare-versions
```

Then on iOS:

```sh
cd ios && pod install
```

On Android, no extra steps — RN auto-linking wires it up.

> **Note**: the in-app update flow only works on **signed release builds** uploaded to a Google Play track (Internal, Closed, Open, or Production). Debug builds will not trigger Play's immediate flow.

---

## How it works

The package exposes a single mental model:

1. Your **server** tells the app two thresholds: `min_app_version` (below which the app refuses to run) and `latest_app_version` (below which the app suggests an update).
2. The hook **`useUpdate`** compares the installed version to those thresholds and returns a verdict: `'force' | 'suggest' | 'none'`.
3. You render **`<ForceUpdateModal>`** and **`<SuggestUpdateBanner>`** keyed off that verdict.
4. On Android, the hook auto-triggers **Play's IMMEDIATE flow** — the user gets a full-screen, system-level update UI they cannot dismiss.
5. On iOS, the modal is a beautifully animated `<Modal>` that deep-links to the App Store when tapped.

The verdict re-evaluates whenever your thresholds change *and* whenever the app returns to foreground (`AppState`-driven), so the gate catches users at safe boundary moments — never mid-task.

---

## API

### `evaluateUpdate(input): Verdict`

Pure function. No platform branch, no side effects.

```ts
evaluateUpdate({ installed: '1.5.0', minRequired: '1.6.0' });
// 'force'

evaluateUpdate({ installed: '1.6.0', latestAvailable: '1.7.0' });
// 'suggest'

evaluateUpdate({ installed: '1.7.0', latestAvailable: '1.7.0' });
// 'none'
```

Returns `'none'` on any unparseable version string — fail-open by design.

### `configureUpdateGate(config)`

Call once at app startup.

```ts
configureUpdateGate({
  androidPackageName: 'com.acme.app',
  appStoreId: '1234567890',
});
```

### `useUpdate(input): { verdict, recheck }`

React hook. Re-evaluates on `AppState → active` (override with `checkOnResume: false`).

```ts
const { verdict, recheck } = useUpdate({
  installed: '1.5.0',
  minRequired: '1.6.0',
  latestAvailable: '1.7.0',
});
```

Set `autoPresent: false` to disable the implicit Android immediate-flow trigger.

### `presentUpdate(mode, options?)`

Direct platform UI trigger. Called automatically by the hook on Android force, but exposed so the modal/banner button can fire it from iOS.

```ts
await presentUpdate('force');    // Android → Play Core IMMEDIATE; iOS → no-op
await presentUpdate('suggest');  // Both → opens the store listing
```

### `<ForceUpdateModal>`

Blocking, full-screen, animated modal. iOS users see this; Android users see Play's native UI.

```tsx
<ForceUpdateModal
  visible={verdict === 'force'}
  title="Critical Update"
  message="We've added important security fixes."
  buttonText="Update Now"
  versionLabel="v1.5.0 → v1.6.0"
  illustration={<MySvgIcon />}
/>
```

All props are optional; sensible English defaults are baked in. The modal:

- Animates in over 260 ms (fade + slide-up).
- Locks focus inside (`accessibilityViewIsModal`).
- Cannot be dismissed by the Android hardware back button.
- Vibrates on button press.
- Pulls colors from `useTheme()` (or your `theme` prop).

### `<SuggestUpdateBanner>`

Dismissible banner for non-critical updates. **The banner manages its own
dismissal state** — tapping `×`, tapping the action button, or `autoHideAfter`
elapsing all hide the banner without any work from the consumer.

```tsx
<SuggestUpdateBanner visible={verdict === 'suggest'} />
```

That's the minimum integration — no `onDismiss` needed for basic dismissal. The
banner re-appears automatically when `visible` transitions from `false` back to
`true` (e.g. a new release becomes available and the verdict flips back to
`'suggest'`).

```tsx
<SuggestUpdateBanner
  visible={verdict === 'suggest'}
  position="top"
  autoHideAfter={8000}
  onDismiss={() => analytics.track('update_banner_dismissed')}
/>
```

`onDismiss` is **optional** — pass it only if you want a callback (analytics,
AsyncStorage persistence, telemetry). It fires after the banner starts dismissing.

### Theming

Two ways to customise.

**Globally via context:**

```tsx
import { UpdateGateThemeProvider, lightTheme } from '@zethictech/react-native-update-gate';

<UpdateGateThemeProvider value={{ ...lightTheme, primary: '#FF6B6B', radius: 24 }}>
  <App />
</UpdateGateThemeProvider>
```

**Per-component via prop:**

```tsx
<ForceUpdateModal visible={...} theme={{ ...lightTheme, primary: '#FF6B6B' }} />
```

---

## The server contract

This package expects your server to ship two values to the client. How you deliver them is up to you — most apps piggy-back on an existing endpoint (login, token refresh, /me).

### Laravel / PHP example

```php
public function login(Request $request)
{
    $tokenResponse = $user->getBearerTokenByUser($user, $client->id, true);

    $body = json_decode($tokenResponse->getContent(), true);
    $body['app_config'] = [
        'min_app_version' => config('app.min_app_version'),       // '1.6.0'
        'latest_app_version' => config('app.latest_app_version'), // '1.7.2'
    ];

    return response()->json($body);
}
```

### Client-side wiring

```ts
const loginResponse = await api.post('/login', credentials);
await AsyncStorage.setItem('appConfig', JSON.stringify(loginResponse.app_config));

// ...later in App.tsx
const [appConfig, setAppConfig] = useState({ min_app_version: undefined, latest_app_version: undefined });
useEffect(() => {
  AsyncStorage.getItem('appConfig').then((raw) => raw && setAppConfig(JSON.parse(raw)));
}, []);

const { verdict } = useUpdate({
  installed: DeviceInfo.getVersion(),
  minRequired: appConfig.min_app_version,
  latestAvailable: appConfig.latest_app_version,
});
```

---

## Testing

Force/suggest flows cannot be tested in a debug build on Android — Play Core requires a signed release build distributed through a Play track. The simplest test loop:

1. Bump `versionCode` in your app's `android/app/build.gradle`.
2. Build a signed AAB.
3. Upload to **Internal app sharing** (`https://play.google.com/console/u/0/...`).
4. Install the older version on a test device.
5. Open the install link of the newer version to enable update detection.
6. Launch the app — Play's immediate flow appears.

On iOS, the modal works in any build (no Play Core dependency). For visual QA, see the `example/` app in this repo.

---

## Migration from `sp-react-native-in-app-updates`

See [`docs/migration-from-sp.md`](docs/migration-from-sp.md) for a side-by-side diff.

---

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for design decisions:

- Why pure-JS iOS modal beats a native module
- Why Play App Update 2.x over legacy Play Core
- Why hook + components, not a singleton imperative API
- Why server-driven thresholds

---

## Contributing

Contributions welcome! Bug reports, feature requests, and PRs all appreciated.

1. `git clone` + `yarn install`.
2. `yarn typecheck && yarn test` — keep green.
3. `cd example && yarn install` and run the demo app to validate visual changes.

---

## License

MIT © Zethic Tech
