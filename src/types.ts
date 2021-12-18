export type ServerConfig = {
    port: number;
    appConfigPath?: string;
};

export type VideoStorage = {
    path: string;
    enabled: boolean;
};

export type AppConfig = {
    videoStorages: VideoStorage[];
};
