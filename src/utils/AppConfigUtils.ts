import { existsSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { AppConfig } from '../types';

export const DEFAULT_APP_CONFIG_FILE = '.home-tube-config.json';

export const getDefaultAppConfigPath = (): string => {
    const home = homedir();
    return join(home, DEFAULT_APP_CONFIG_FILE);
};

export const DEFAULT_APP_CONFIG: AppConfig = {
    videoStorages: [],
};

export const loadAppConfig = (path: string): AppConfig => {
    if (!existsSync(path)) {
        return DEFAULT_APP_CONFIG;
    }
    const savedConfigJson = readFileSync(path).toString();
    const savedConfig = JSON.parse(savedConfigJson) as AppConfig;
    return { ...DEFAULT_APP_CONFIG, ...savedConfig };
};

export const saveAppConfig = (path: string, appConfig: AppConfig): void => {
    writeFileSync(path, JSON.stringify(appConfig, undefined, 2));
};
