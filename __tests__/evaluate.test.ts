import { evaluateUpdate } from '../src/evaluate';

describe('evaluateUpdate', () => {
  describe('force verdict', () => {
    it('returns "force" when installed is strictly less than minRequired', () => {
      expect(evaluateUpdate({ installed: '1.5.0', minRequired: '1.6.0' })).toBe('force');
    });

    it('takes precedence over suggest when both thresholds would match', () => {
      expect(
        evaluateUpdate({
          installed: '1.5.0',
          minRequired: '1.6.0',
          latestAvailable: '1.7.0',
        }),
      ).toBe('force');
    });

    it('handles patch-level forces', () => {
      expect(evaluateUpdate({ installed: '1.6.0', minRequired: '1.6.1' })).toBe('force');
    });

    it('handles major-version forces', () => {
      expect(evaluateUpdate({ installed: '1.9.99', minRequired: '2.0.0' })).toBe('force');
    });
  });

  describe('suggest verdict', () => {
    it('returns "suggest" when installed >= minRequired but < latestAvailable', () => {
      expect(
        evaluateUpdate({
          installed: '1.6.0',
          minRequired: '1.6.0',
          latestAvailable: '1.7.0',
        }),
      ).toBe('suggest');
    });

    it('returns "suggest" when only latestAvailable is set and installed is older', () => {
      expect(evaluateUpdate({ installed: '1.6.0', latestAvailable: '1.7.0' })).toBe('suggest');
    });
  });

  describe('none verdict', () => {
    it('returns "none" when no thresholds are provided', () => {
      expect(evaluateUpdate({ installed: '1.0.0' })).toBe('none');
    });

    it('returns "none" when installed is at or above latestAvailable', () => {
      expect(evaluateUpdate({ installed: '1.7.0', latestAvailable: '1.7.0' })).toBe('none');
    });

    it('returns "none" when installed is far ahead', () => {
      expect(
        evaluateUpdate({
          installed: '2.0.0',
          minRequired: '1.6.0',
          latestAvailable: '1.9.0',
        }),
      ).toBe('none');
    });
  });

  describe('graceful failure on invalid versions', () => {
    it('returns "none" if installed is unparseable rather than throwing', () => {
      expect(
        evaluateUpdate({ installed: 'not-a-version', minRequired: '1.0.0' }),
      ).toBe('none');
    });

    it('returns "none" if minRequired is unparseable', () => {
      expect(
        evaluateUpdate({ installed: '1.0.0', minRequired: '???' }),
      ).toBe('none');
    });
  });

  describe('pre-release handling (compare-versions semantics)', () => {
    it('treats a pre-release as lower than the stable release', () => {
      expect(
        evaluateUpdate({ installed: '1.6.0-beta.1', minRequired: '1.6.0' }),
      ).toBe('force');
    });

    it('treats post-stable installs as current', () => {
      expect(
        evaluateUpdate({ installed: '1.6.0', latestAvailable: '1.6.0' }),
      ).toBe('none');
    });
  });
});
