# Example app

A bare React Native demo of `react-native-update-gate`. Switch between the three verdict scenarios to see:

- **Force update** — animated blocking modal.
- **Suggest update** — top-anchored banner.
- **No update** — clean UI, no overlays.

## Run

This example expects a standard React Native bootstrap. From the repo root:

```sh
yarn install
cd example
yarn install
# iOS
cd ios && pod install && cd ..
yarn ios
# Android
yarn android
```

## What you'll see

- The force modal appears immediately on selecting "Force update".
- The suggest banner slides in from the top on selecting "Suggest update"; tapping × dismisses it.
- The "verdict" pill at the bottom shows the live verdict for the selected scenario.
- On Android with a real Play-published build, the IMMEDIATE flow would fire; in the demo (debug build) you'll see the JS modal fallback only.
