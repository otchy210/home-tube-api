import { execSync } from 'child_process';
import { unlinkSync } from 'fs';
import { DEFAULT_APP_CONFIG, getDefaultAppConfigPath, loadAppConfig, saveAppConfig } from './ApiServer';

const TEST_CONFIG_PATH = './test/test-config.json';
const TEST_CONFIG_TMP_PATH = './tmp/test-config.json';

const TEST_CONFIG = {
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
};

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
        expect(loadAppConfig(TEST_CONFIG_PATH)).toStrictEqual(TEST_CONFIG);
    });
});

describe('saveAppConfig', () => {
    beforeAll(() => {
        try {
            unlinkSync(TEST_CONFIG_TMP_PATH);
        } catch (e) {
            console.debug(e);
        }
    });
    afterAll(() => {
        try {
            unlinkSync(TEST_CONFIG_TMP_PATH);
        } catch (e) {
            console.debug(e);
        }
    });
    it('saves app config file properly', () => {
        saveAppConfig(TEST_CONFIG_TMP_PATH, TEST_CONFIG);
        expect(execSync(`diff ${TEST_CONFIG_PATH} ${TEST_CONFIG_TMP_PATH}`).toString()).toBe('');
    });
});
