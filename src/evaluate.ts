import { compare, validate } from 'compare-versions';
import type { EvaluateInput, Verdict } from './types';

const isLower = (a: string, b: string): boolean => {
  if (!validate(a) || !validate(b)) return false;
  return compare(a, b, '<');
};

// Fail-open on unparseable versions — better to let the user in than to lock
// them out over a typo on the server.
export const evaluateUpdate = ({
  installed,
  minRequired,
  latestAvailable,
}: EvaluateInput): Verdict => {
  if (minRequired && isLower(installed, minRequired)) return 'force';
  if (latestAvailable && isLower(installed, latestAvailable)) return 'suggest';
  return 'none';
};
