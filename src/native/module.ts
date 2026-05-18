import { NativeModules, Platform } from 'react-native';
import type { UpdateCheckResult } from '../types';

interface UpdateGateNativeModule {
  checkForUpdate: () => Promise<UpdateCheckResult>;
  startImmediateUpdate: () => Promise<boolean>;
}

const LINKING_ERROR =
  `react-native-update-gate: the native Android module is not linked. ` +
  `Rebuild after installing the package ` +
  `(\`cd android && ./gradlew clean && cd .. && yarn android\`). ` +
  `Expo users need a development build.`;

export const getNativeModule = (): UpdateGateNativeModule | null => {
  if (Platform.OS !== 'android') return null;
  const mod = NativeModules.UpdateGate as UpdateGateNativeModule | undefined;
  if (!mod) throw new Error(LINKING_ERROR);
  return mod;
};
