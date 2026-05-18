import type { ReactNode } from 'react';

export type Verdict = 'force' | 'suggest' | 'none';

export interface EvaluateInput {
  installed: string;
  /** Below this version, verdict is `'force'`. */
  minRequired?: string;
  /** Below this version (and at or above `minRequired`), verdict is `'suggest'`. */
  latestAvailable?: string;
}

export interface UpdateGateConfig {
  androidPackageName?: string;
  appStoreId?: string;
  iosBundleId?: string;
}

export interface PresentOptions {
  /** Override the destination URL (useful for testing or staging). */
  storeUrl?: string;
}

export interface UseUpdateInput extends EvaluateInput {
  /** Re-check verdict when the app returns to foreground. Default `true`. */
  checkOnResume?: boolean;
  /**
   * Auto-trigger the Android Play Core IMMEDIATE flow when verdict becomes `'force'`.
   * No-op on iOS — render `<ForceUpdateModal>` instead. Default `true`.
   */
  autoPresent?: boolean;
}

export interface UseUpdateResult {
  verdict: Verdict;
  recheck: () => void;
}

export interface UpdateGateTheme {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  border: string;
  shadow: string;
  radius: number;
}

export interface ThemingProps {
  /** Shorthand for `theme={{ primary: accent }}`. */
  accent?: string;
  theme?: Partial<UpdateGateTheme>;
  /** Replace the default built-in icon with any ReactNode (SVG, Lottie, Image, View). */
  icon?: ReactNode;
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  availableVersionCode: number;
  clientStalenessDays: number;
  updatePriority: number;
  immediateAllowed: boolean;
  flexibleAllowed: boolean;
}
