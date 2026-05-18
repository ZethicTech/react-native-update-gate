import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { evaluateUpdate } from '../evaluate';
import { presentUpdate } from '../present';
import type { UseUpdateInput, UseUpdateResult, Verdict } from '../types';

export const useUpdate = (input: UseUpdateInput): UseUpdateResult => {
  const { installed, minRequired, latestAvailable, checkOnResume = true, autoPresent = true } =
    input;

  const compute = useCallback(
    (): Verdict =>
      evaluateUpdate({ installed, minRequired, latestAvailable }),
    [installed, minRequired, latestAvailable],
  );

  const [verdict, setVerdict] = useState<Verdict>(compute);
  const lastTriggered = useRef<Verdict | null>(null);

  const recheck = useCallback((): void => {
    setVerdict(compute());
  }, [compute]);

  useEffect(() => {
    setVerdict(compute());
  }, [compute]);

  useEffect(() => {
    if (!checkOnResume) return undefined;
    const handler = (state: AppStateStatus): void => {
      if (state === 'active') recheck();
    };
    const subscription = AppState.addEventListener('change', handler);
    return () => subscription.remove();
  }, [checkOnResume, recheck]);

  useEffect(() => {
    if (!autoPresent) return;
    if (verdict !== 'force') {
      lastTriggered.current = verdict;
      return;
    }
    if (lastTriggered.current === 'force') return;
    // iOS force-blocking is handled by <ForceUpdateModal>, not here.
    if (Platform.OS !== 'android') {
      lastTriggered.current = verdict;
      return;
    }
    lastTriggered.current = verdict;
    presentUpdate('force').catch(() => undefined);
  }, [verdict, autoPresent]);

  return { verdict, recheck };
};
