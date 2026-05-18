export { evaluateUpdate } from './evaluate';
export { presentUpdate, type PresentMode } from './present';
export { configureUpdateGate } from './config';
export { useUpdate } from './hooks/useUpdate';
export { ForceUpdateModal, type ForceUpdateModalProps } from './components/ForceUpdateModal';
export {
  SuggestUpdateBanner,
  type SuggestUpdateBannerProps,
} from './components/SuggestUpdateBanner';
export {
  UpdateGate,
  type UpdateGateProps,
  type UpdateThresholds,
} from './components/UpdateGate';
export {
  UpdateGateThemeProvider,
  lightTheme,
  darkTheme,
  createTheme,
  withAlpha,
} from './components/theme';

export type {
  Verdict,
  EvaluateInput,
  UpdateGateConfig,
  PresentOptions,
  UseUpdateInput,
  UseUpdateResult,
  UpdateGateTheme,
  UpdateCheckResult,
  ThemingProps,
} from './types';
