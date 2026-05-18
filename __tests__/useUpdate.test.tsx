import React from 'react';
import { AppState, type AppStateStatus, Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { useUpdate } from '../src/hooks/useUpdate';

const Probe: React.FC<{
  installed: string;
  minRequired?: string;
  latestAvailable?: string;
}> = (props) => {
  const { verdict } = useUpdate({ ...props, autoPresent: false });
  return <Text testID="verdict">{verdict}</Text>;
};

describe('useUpdate', () => {
  let appStateChangeCallback: ((s: AppStateStatus) => void) | null = null;
  let addListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    appStateChangeCallback = null;
    addListenerSpy = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, cb) => {
        appStateChangeCallback = cb as (s: AppStateStatus) => void;
        return { remove: jest.fn(() => { appStateChangeCallback = null; }) };
      });
  });

  afterEach(() => {
    addListenerSpy.mockRestore();
  });

  it('returns "force" when installed is below minRequired on mount', () => {
    const { getByTestId } = render(<Probe installed="1.5.0" minRequired="1.6.0" />);
    expect(getByTestId('verdict').children[0]).toBe('force');
  });

  it('returns "suggest" when installed is below latestAvailable but at/above minRequired', () => {
    const { getByTestId } = render(
      <Probe installed="1.6.0" minRequired="1.6.0" latestAvailable="1.7.0" />,
    );
    expect(getByTestId('verdict').children[0]).toBe('suggest');
  });

  it('returns "none" when no thresholds match', () => {
    const { getByTestId } = render(<Probe installed="1.7.0" latestAvailable="1.7.0" />);
    expect(getByTestId('verdict').children[0]).toBe('none');
  });

  it('re-evaluates when thresholds change', () => {
    const { getByTestId, rerender } = render(
      <Probe installed="1.7.0" minRequired="1.6.0" />,
    );
    expect(getByTestId('verdict').children[0]).toBe('none');
    rerender(<Probe installed="1.7.0" minRequired="1.8.0" />);
    expect(getByTestId('verdict').children[0]).toBe('force');
  });

  it('subscribes to AppState change to active', () => {
    render(<Probe installed="1.5.0" minRequired="1.6.0" />);
    expect(addListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
    act(() => {
      appStateChangeCallback?.('active');
    });
  });
});
