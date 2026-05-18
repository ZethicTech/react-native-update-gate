import { Linking, Platform } from 'react-native';
import { configureUpdateGate, __resetConfigForTests } from '../src/config';
import { presentUpdate } from '../src/present';

describe('configureUpdateGate + presentUpdate', () => {
  let openURLSpy: jest.SpyInstance;
  let canOpenURLSpy: jest.SpyInstance;

  beforeEach(() => {
    __resetConfigForTests();
    (Platform as { OS: string }).OS = 'ios';
    openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    canOpenURLSpy = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
  });

  afterEach(() => {
    openURLSpy.mockRestore();
    canOpenURLSpy.mockRestore();
  });

  it('throws if presentUpdate is called before configureUpdateGate', async () => {
    await expect(presentUpdate('suggest')).rejects.toThrow(/configureUpdateGate/);
  });

  it('merges repeated configure calls', async () => {
    configureUpdateGate({ appStoreId: '123' });
    configureUpdateGate({ androidPackageName: 'com.acme.app' });
    await expect(presentUpdate('suggest')).resolves.not.toThrow();
  });

  it('throws on iOS suggest if appStoreId is missing', async () => {
    configureUpdateGate({ androidPackageName: 'com.acme.app' });
    await expect(presentUpdate('suggest')).rejects.toThrow(/appStoreId/);
  });

  it('uses options.storeUrl override when provided', async () => {
    configureUpdateGate({ appStoreId: '123' });
    await presentUpdate('suggest', { storeUrl: 'https://example.com/custom' });
    expect(openURLSpy).toHaveBeenCalledWith('https://example.com/custom');
  });

  it('no-ops on iOS force (Modal handles blocking UI)', async () => {
    configureUpdateGate({ appStoreId: '123' });
    await presentUpdate('force');
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('opens App Store deep-link for iOS suggest', async () => {
    configureUpdateGate({ appStoreId: '987654321' });
    await presentUpdate('suggest');
    expect(openURLSpy).toHaveBeenCalledWith('itms-apps://apps.apple.com/app/id987654321');
  });
});
