import React from 'react';
import { render } from '@testing-library/react-native';

// Mock the inner components to avoid running their animation lifecycles.
// We only test UpdateGate's routing + prop-flow logic here; the children
// have their own dedicated tests. `require` is inline because jest.mock
// factories cannot reference out-of-scope variables.
jest.mock('../src/components/ForceUpdateModal', () => {
  const RN = require('react-native');
  const ReactLib = require('react');
  return {
    ForceUpdateModal: (props: Record<string, unknown>) =>
      ReactLib.createElement(
        RN.Text,
        { testID: 'force-modal' },
        JSON.stringify({
          visible: props.visible,
          accent: props.accent,
          versionLabel: props.versionLabel,
          title: props.title,
          message: props.message,
          buttonText: props.buttonText,
        }),
      ),
  };
});

jest.mock('../src/components/SuggestUpdateBanner', () => {
  const RN = require('react-native');
  const ReactLib = require('react');
  return {
    SuggestUpdateBanner: (props: Record<string, unknown>) =>
      ReactLib.createElement(
        RN.Text,
        { testID: 'suggest-banner' },
        JSON.stringify({
          visible: props.visible,
          accent: props.accent,
          title: props.title,
          position: props.position,
        }),
      ),
  };
});

// Import AFTER the mocks so UpdateGate picks up the stubs.
import { UpdateGate } from '../src/components/UpdateGate';

const parseProps = (json: string): Record<string, unknown> => JSON.parse(json);

describe('<UpdateGate>', () => {
  it('does not render force modal or suggest banner when verdict is "none"', () => {
    const { getByTestId } = render(
      <UpdateGate
        installed="1.7.0"
        thresholds={{ force: '1.0.0', suggest: '1.7.0' }}
      />,
    );
    expect(parseProps(getByTestId('force-modal').children.join('')).visible).toBe(false);
    expect(parseProps(getByTestId('suggest-banner').children.join('')).visible).toBe(false);
  });

  it('renders force modal when installed < thresholds.force', () => {
    const { getByTestId } = render(
      <UpdateGate
        installed="1.5.0"
        thresholds={{ force: '1.6.0', suggest: '1.7.0' }}
      />,
    );
    const props = parseProps(getByTestId('force-modal').children.join(''));
    expect(props.visible).toBe(true);
  });

  it('renders suggest banner when installed at/above force but below suggest', () => {
    const { getByTestId } = render(
      <UpdateGate
        installed="1.6.0"
        thresholds={{ force: '1.6.0', suggest: '1.7.0' }}
      />,
    );
    expect(parseProps(getByTestId('force-modal').children.join('')).visible).toBe(false);
    expect(parseProps(getByTestId('suggest-banner').children.join('')).visible).toBe(true);
  });

  it('flows the accent prop to both children', () => {
    const { getByTestId } = render(
      <UpdateGate
        installed="1.5.0"
        thresholds={{ force: '1.6.0' }}
        accent="#FF0000"
      />,
    );
    expect(parseProps(getByTestId('force-modal').children.join('')).accent).toBe('#FF0000');
    expect(parseProps(getByTestId('suggest-banner').children.join('')).accent).toBe('#FF0000');
  });

  it('flows the force prop bag to the modal', () => {
    const { getByTestId } = render(
      <UpdateGate
        installed="1.5.0"
        thresholds={{ force: '1.6.0' }}
        force={{ title: 'Critical', message: 'Update now', buttonText: 'GO' }}
      />,
    );
    const props = parseProps(getByTestId('force-modal').children.join(''));
    expect(props.title).toBe('Critical');
    expect(props.message).toBe('Update now');
    expect(props.buttonText).toBe('GO');
  });

  it('flows the suggest prop bag to the banner', () => {
    const { getByTestId } = render(
      <UpdateGate
        installed="1.6.0"
        thresholds={{ force: '1.6.0', suggest: '1.7.0' }}
        suggest={{ title: 'New version', position: 'bottom' }}
      />,
    );
    const props = parseProps(getByTestId('suggest-banner').children.join(''));
    expect(props.title).toBe('New version');
    expect(props.position).toBe('bottom');
  });

  it('auto-generates the version-diff label by default', () => {
    const { getByTestId } = render(
      <UpdateGate
        installed="1.5.0"
        thresholds={{ force: '1.6.0', suggest: '1.7.0' }}
      />,
    );
    expect(parseProps(getByTestId('force-modal').children.join('')).versionLabel).toBe(
      'v1.5.0 → v1.7.0',
    );
  });

  it('uses thresholds.force for the diff when suggest is unset', () => {
    const { getByTestId } = render(
      <UpdateGate
        installed="1.5.0"
        thresholds={{ force: '1.6.0' }}
      />,
    );
    expect(parseProps(getByTestId('force-modal').children.join('')).versionLabel).toBe(
      'v1.5.0 → v1.6.0',
    );
  });

  it('skips the version-diff label when showVersionDiff={false}', () => {
    const { getByTestId } = render(
      <UpdateGate
        installed="1.5.0"
        thresholds={{ force: '1.6.0' }}
        showVersionDiff={false}
      />,
    );
    // JSON.stringify drops undefined keys, so `versionLabel` doesn't appear.
    expect(parseProps(getByTestId('force-modal').children.join('')).versionLabel).toBeUndefined();
  });

  it('explicit force.versionLabel overrides the auto label', () => {
    const { getByTestId } = render(
      <UpdateGate
        installed="1.5.0"
        thresholds={{ force: '1.6.0', suggest: '1.7.0' }}
        force={{ versionLabel: 'Security patch' }}
      />,
    );
    expect(parseProps(getByTestId('force-modal').children.join('')).versionLabel).toBe(
      'Security patch',
    );
  });
});
