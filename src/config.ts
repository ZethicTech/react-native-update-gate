import type { UpdateGateConfig } from './types';

let configState: UpdateGateConfig = {};
let configured = false;

export const configureUpdateGate = (config: UpdateGateConfig): void => {
  configState = { ...configState, ...config };
  configured = true;
};

export const getConfig = (): UpdateGateConfig => configState;

export const isConfigured = (): boolean => configured;

export const __resetConfigForTests = (): void => {
  configState = {};
  configured = false;
};
