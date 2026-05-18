import React from 'react';
import { useUpdate } from '../hooks/useUpdate';
import { ForceUpdateModal, type ForceUpdateModalProps } from './ForceUpdateModal';
import {
  SuggestUpdateBanner,
  type SuggestUpdateBannerProps,
} from './SuggestUpdateBanner';
import type { ThemingProps } from '../types';

export interface UpdateThresholds {
  /** Below this version, verdict is `'force'` — blocking modal renders. */
  force?: string;
  /** Below this version (and at/above `force`), verdict is `'suggest'` — banner renders. */
  suggest?: string;
}

export interface UpdateGateProps extends ThemingProps {
  /** Currently installed app version, e.g. `DeviceInfo.getVersion()`. */
  installed: string;
  /** Version thresholds. `force` blocks; `suggest` gently prompts. */
  thresholds: UpdateThresholds;
  /** Re-check verdict when the app returns to foreground. Default `true`. */
  checkOnResume?: boolean;
  /** Auto-trigger Android Play Core IMMEDIATE flow on `'force'`. Default `true`. */
  autoPresent?: boolean;
  /** Force-modal customisation (title, message, buttonText, etc.). */
  force?: Omit<ForceUpdateModalProps, 'visible' | 'accent' | 'theme' | 'icon'>;
  /** Suggest-banner customisation (title, message, position, etc.). */
  suggest?: Omit<SuggestUpdateBannerProps, 'visible' | 'accent' | 'theme' | 'icon'>;
  /** Auto-build `vX → vY` pill on the force modal. Default `true`. */
  showVersionDiff?: boolean;
}

export const UpdateGate: React.FC<UpdateGateProps> = ({
  installed,
  thresholds,
  checkOnResume,
  autoPresent,
  accent,
  theme,
  icon,
  force,
  suggest,
  showVersionDiff = true,
}) => {
  const { verdict } = useUpdate({
    installed,
    minRequired: thresholds.force,
    latestAvailable: thresholds.suggest,
    checkOnResume,
    autoPresent,
  });

  const target = thresholds.suggest ?? thresholds.force;
  const autoVersionLabel =
    showVersionDiff && target ? `v${installed} → v${target}` : undefined;

  return (
    <>
      <ForceUpdateModal
        visible={verdict === 'force'}
        accent={accent}
        theme={theme}
        icon={icon}
        versionLabel={force?.versionLabel ?? autoVersionLabel}
        {...force}
      />
      <SuggestUpdateBanner
        visible={verdict === 'suggest'}
        accent={accent}
        theme={theme}
        icon={icon}
        {...suggest}
      />
    </>
  );
};
