import { existsSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { DEFAULT_APP_CONFIG_FILE } from '../const';
import { AppConfig, AppConfigValidationError } from '../types';

export const getDefaultAppConfigPath = (): string => {
    const home = homedir();
    return join(home, DEFAULT_APP_CONFIG_FILE);
};

export const DEFAULT_APP_CONFIG: AppConfig = {
    storages: [],
};

export const loadAppConfig = (path: string): AppConfig => {
    if (!existsSync(path)) {
        return DEFAULT_APP_CONFIG;
    }
    const savedConfig = JSON.parse(readFileSync(path).toString()) as AppConfig;
    return { ...DEFAULT_APP_CONFIG, ...savedConfig };
};

export const validateAppConfig = (appConfig: AppConfig): AppConfigValidationError[] => {
    const results: AppConfigValidationError[] = [];
    appConfig.storages.forEach((storage) => {
        if (!existsSync(storage.path)) {
            results.push({
                message: "Storage doesn't exist",
                source: storage.path,
            });
        }
    });
    if (appConfig.ffmpeg) {
        if (!existsSync(appConfig.ffmpeg)) {
            results.push({
                message: "ffmpeg command doesn't exist",
                source: appConfig.ffmpeg,
            });
        }
    }
    return results;
};

export const saveAppConfig = (path: string, appConfig: AppConfig): void => {
    writeFileSync(path, JSON.stringify(appConfig, undefined, 2));
};
