import { Linking, Platform } from 'react-native';
import { getConfig, isConfigured } from './config';
import { getNativeModule } from './native/module';
import type { PresentOptions } from './types';

export type PresentMode = 'force' | 'suggest';

const ensureConfigured = (): void => {
  if (!isConfigured()) {
    throw new Error(
      'react-native-update-gate: configureUpdateGate() must be called before presentUpdate(). ' +
        'Call it once at app startup.',
    );
  }
};

const buildAndroidStoreUrl = (packageName: string): { primary: string; fallback: string } => ({
  primary: `market://details?id=${packageName}`,
  fallback: `https://play.google.com/store/apps/details?id=${packageName}`,
});

const buildIosStoreUrl = (appStoreId: string): string =>
  `itms-apps://apps.apple.com/app/id${appStoreId}`;

const openWithFallback = async (primary: string, fallback?: string): Promise<void> => {
  try {
    if (await Linking.canOpenURL(primary)) {
      await Linking.openURL(primary);
      return;
    }
  } catch {
    // Fall through.
  }
  await Linking.openURL(fallback ?? primary);
};

export const presentUpdate = async (
  mode: PresentMode,
  options: PresentOptions = {},
): Promise<void> => {
  ensureConfigured();
  const cfg = getConfig();

  if (Platform.OS === 'android') {
    if (mode === 'force') {
      const mod = getNativeModule();
      if (mod) {
        try {
          await mod.startImmediateUpdate();
          return;
        } catch {
          // Play Core couldn't start an immediate update (debug build, no higher
          // version on the Play track, etc.). Fall through to the Play Store listing.
        }
      }
    }
    if (options.storeUrl) return Linking.openURL(options.storeUrl);
    if (!cfg.androidPackageName) {
      throw new Error(
        'react-native-update-gate: `androidPackageName` not set. ' +
          'Pass it to configureUpdateGate({ androidPackageName: "com.your.app" }).',
      );
    }
    const { primary, fallback } = buildAndroidStoreUrl(cfg.androidPackageName);
    return openWithFallback(primary, fallback);
  }

  if (Platform.OS === 'ios') {
    // Force mode on iOS is handled by <ForceUpdateModal>, not here.
    if (mode === 'force') return;
    if (options.storeUrl) return Linking.openURL(options.storeUrl);
    if (!cfg.appStoreId) {
      throw new Error(
        'react-native-update-gate: `appStoreId` not set. ' +
          'Pass it to configureUpdateGate({ appStoreId: "1234567890" }).',
      );
    }
    await Linking.openURL(buildIosStoreUrl(cfg.appStoreId));
  }
};
