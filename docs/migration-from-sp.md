# Migrating from `sp-react-native-in-app-updates`

If you're currently using `sp-react-native-in-app-updates`, here's how to swap it out.

## Before

```ts
import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates';
import { Platform } from 'react-native';

const inAppUpdates = new SpInAppUpdates(false);

inAppUpdates.checkNeedsUpdate().then(result => {
  if (result.shouldUpdate) {
    const updateOptions = Platform.select({
      ios: {
        title: 'Update available',
        message: 'A new version is available. Update?',
        buttonUpgradeText: 'Update',
        buttonCancelText: 'Cancel',
      },
      android: {
        updateType: IAUUpdateKind.IMMEDIATE,
      },
    });
    inAppUpdates.startUpdate(updateOptions);
  }
});
```

## After

```tsx
import { useUpdate, ForceUpdateModal, configureUpdateGate } from '@zethictech/react-native-update-gate';
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
      <ForceUpdateModal
        visible={verdict === 'force'}
        title="Update available"
        message="A new version is available. Update?"
        buttonText="Update"
      />
    </>
  );
}
```

## What you give up

- **Imperative `inAppUpdates.startUpdate(...)`** — replaced by a reactive verdict + declarative components. If you need to fire programmatically, call `presentUpdate('force')` directly.

## What you gain

- **TypeScript types** ship by default — no `@types/sp-react-native-in-app-updates` shim needed.
- **React hook integration** — verdict re-evaluates on `AppState → active`, no manual re-check.
- **Server-driven thresholds** — your server controls when the gate fires, decoupled from store publishing.
- **Animated, themeable iOS modal** — no more system `UIAlertController`.
- **Suggest banner** — non-blocking update prompt for non-critical releases.
- **Modern Play App Update SDK 2.x** — `sp-` still uses legacy Play Core.
- **Smaller iOS binary** — no `react-native-siren` native code on iOS.

## Mapping the old API to the new

| Old (`sp-`) | New (`react-native-update-gate`) |
|---|---|
| `new SpInAppUpdates(false)` | `configureUpdateGate({...})` |
| `inAppUpdates.checkNeedsUpdate()` | Inputs to `useUpdate({...})` |
| `result.shouldUpdate` | `verdict === 'force'` or `'suggest'` |
| `inAppUpdates.startUpdate(...)` | `presentUpdate('force')` / `presentUpdate('suggest')` |
| iOS modal options | `<ForceUpdateModal>` props |
| `IAUUpdateKind.IMMEDIATE` | Triggered automatically when verdict is `'force'` on Android |
| `IAUUpdateKind.FLEXIBLE` | (not in 0.1.0 — coming in 0.2.0) |

## Step-by-step

1. `yarn remove sp-react-native-in-app-updates && yarn add react-native-update-gate compare-versions`
2. `cd ios && pod install`
3. Delete your old `useEffect` that called `inAppUpdates.checkNeedsUpdate()`.
4. Add `useUpdate` and the two component renders to `App.tsx`.
5. Wire your server response (`min_app_version` / `latest_app_version`) into the hook inputs.
6. Rebuild Android (`cd android && ./gradlew clean && cd .. && yarn android`).
7. Test on a real Android device via Internal app sharing — should see Play's IMMEDIATE flow when verdict becomes `'force'`.
