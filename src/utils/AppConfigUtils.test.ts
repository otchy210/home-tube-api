import { execSync } from 'child_process';
import { unlinkSync } from 'fs';
import { setTimeout } from 'timers';
import { AppConfig } from '../types';
import { DEFAULT_APP_CONFIG, getAppConfigDeepCopy, getDefaultAppConfigPath, loadAppConfig, saveAppConfig } from './AppConfigUtils';
import { TEST_CONFIG_PATH, TEST_CONFIG } from './TestConst';

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
    it('saves app config file properly', (done) => {
        const tmpConfig = `tmp/${Math.random().toString(32).substring(2)}.json`;

        saveAppConfig(tmpConfig, TEST_CONFIG);
        setTimeout(() => {
            expect(execSync(`diff ${TEST_CONFIG_PATH} ${tmpConfig}`).toString()).toBe('');
            unlinkSync(tmpConfig);
            done();
        }, 100);
    });
});

describe('getAppConfigDeepCopy', () => {
    it('copies appConfig deeply', () => {
        const src: AppConfig = {
            storages: [
                {
                    path: 'a',
                    enabled: true,
                },
                {
                    path: 'b',
                    enabled: false,
                },
            ],
            ffmpeg: 'c',
        };
        const copy = getAppConfigDeepCopy(src);
        expect(copy).toStrictEqual(src);
    });
});
