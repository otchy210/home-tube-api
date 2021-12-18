import { AppConfig, ServerConfig } from './types';

const getDefaultAppConfigPath = (): string => {
    return './.home-tube-config.json';
};

const loadAppConfig = (path: string): AppConfig => {
    return { videoStorages: [] };
};

export default class Server {
    private port: number;
    private appConfig: AppConfig;

    public constructor(config: ServerConfig) {
        this.port = config.port;
        const appConfigPath = config.appConfigPath ?? getDefaultAppConfigPath();
        this.appConfig = loadAppConfig(appConfigPath);
    }
}
