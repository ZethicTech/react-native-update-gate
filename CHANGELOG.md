# Changelog

All notable changes to `react-native-update-gate` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.2] — 2026-05-18

### Changed
- Authorship and copyright attribution updated from "SABA Hospitality" to
  **Zethic Tech** (the package maintainer). The package is a standalone
  open-source library — SABA Hospitality is one of its consumers, not the
  author. Affects `LICENSE`, `README.md` footer, and `package.json` `author` field.

## [0.2.1] — 2026-05-18

### Changed
- **Package renamed to `@zethictech/react-native-update-gate`** (scoped under
  the Zethic Tech org on npm). Update consumer imports:
  ```diff
  - import { useUpdate } from 'react-native-update-gate';
  + import { useUpdate } from '@zethictech/react-native-update-gate';
  ```
- Release workflow now uses npm **Trusted Publishing** (OIDC) — no more
  `NPM_TOKEN` secret. Requires npm ≥ 11.5.1 (workflow upgrades npm before publish).

## [0.2.0] — 2026-05-18

### Added
- **`accent` shorthand prop** on `<ForceUpdateModal>` and `<SuggestUpdateBanner>`.
  Override just the primary colour without spreading a full theme object:
  ```tsx
  <ForceUpdateModal visible={true} accent="#0F62FE" />
  ```
- **`theme` prop now accepts `Partial<UpdateGateTheme>`** — pass only the
  properties you want to override. Merged on top of the context theme + platform default.
- **`createTheme(overrides)` helper** exported for building a complete theme
  from partial overrides.
- **`withAlpha(color, alpha)` helper** exported for tinted colour utilities.
- **Built-in default icons** for both components:
  - `ForceUpdateModal` ships a 72×72 download-arrow card (`↓`) in tinted accent.
  - `SuggestUpdateBanner` ships a 32×32 up-arrow chip (`↑`) in tinted accent.
  - Replace either via the new `icon` prop with any ReactNode (SVG, Lottie, Image).
- **Subtle icon bob animation** on the default modal icon (3 px, 1.6 s loop).
- **Optional `@react-native-community/blur` integration** — installs as an
  optional peer dependency. When installed, the modal uses a true frosted-glass
  backdrop on iOS. Falls back gracefully to a darker scrim when not installed.

### Changed
- Modal redesigned in iOS / Liquid Glass aesthetic: pill button, tinted accent
  bar above title, soft floating shadow, tinted version-label pill.
- Banner redesigned with a left accent bar, tinted icon chip, pill action button,
  larger close-button hit target.
- Default `radius` bumped from 20 → 24 for softer card corners.
- Default backdrop opacity slightly reduced for a cleaner look.

### Fixed
- `useTheme` now correctly merges partial themes from context + props + accent
  shorthand (was previously all-or-nothing).

## [0.1.1] — 2026-05-15

### Fixed
- `<SuggestUpdateBanner>` now handles dismissal internally. Tapping the `×` close
  button, tapping the action button, or `autoHideAfter` elapsing all hide the
  banner immediately without requiring the consumer to wire `onDismiss` or
  track local state. The banner re-appears automatically when the `visible`
  prop transitions from `false` back to `true` (e.g. a new release bumps the
  `latestAvailable` threshold).

### Changed
- `onDismiss` is now an **optional** callback fired *after* dismissal completes
  (for analytics / persistence). Existing consumers that passed it continue to
  work unchanged.

## [0.1.0] — 2026-05-15

### Added
- `evaluateUpdate(input)` — pure verdict function (`'force' | 'suggest' | 'none'`).
- `presentUpdate(mode)` — platform-aware UI trigger.
- `configureUpdateGate(config)` — one-time package config.
- `useUpdate(input)` — React hook with `AppState` resume re-check.
- `<ForceUpdateModal>` — animated, themeable, accessible blocking modal for iOS (and Android fallback).
- `<SuggestUpdateBanner>` — dismissible banner for non-critical updates.
- `<UpdateGateThemeProvider>` + `useTheme()` — theming primitives.
- Android native module wrapping Google's Play App Update SDK 2.x (IMMEDIATE flow).
- iOS: zero native code — pure-RN modal + `Linking` deep-link to App Store.
- Server-driven version threshold support (`minRequired` + `latestAvailable`).
- TypeScript types shipped (`strict`, `noUncheckedIndexedAccess`).
- ESM + CommonJS dual build via `react-native-builder-bob`.
- Jest test suite covering verdict matrix, config, and hook.
