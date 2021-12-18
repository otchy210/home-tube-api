import { DEFAULT_APP_CONFIG, getDefaultAppConfigPath, loadAppConfig } from './Server';

describe('getDefaultAppConfigPath', () => {
    it('returns default file name', () => {
        expect(getDefaultAppConfigPath()).toMatch(/\.home-tube-config.json$/);
    });
});

describe('loadAppConfig', () => {
    it("returns default app config when config doesn't exist", () => {
        expect(loadAppConfig('dummy')).toStrictEqual(DEFAULT_APP_CONFIG);
    });

    it('loads app config file properly', () => {
        expect(loadAppConfig('./test/test-config.json')).toStrictEqual({
            videoStorages: [
                {
                    path: '/path/1/',
                    enabled: true,
                },
                {
                    path: '/path/2/',
                    enabled: false,
                },
            ],
        });
    });
});
