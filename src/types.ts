import { IncomingMessage } from 'http';

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

export type RequestProps = {
    appConfig: AppConfig;
    request: IncomingMessage;
};

export type RequestHandler = {
    path: string;
    get?: (props: RequestProps) => Json;
    post?: (props: RequestProps) => Json;
    delete?: (props: RequestProps) => Json;
};

type JsonPrimitive = string | number | boolean | null;

type JsonArray = JsonPrimitive[] | JsonObject[];

type JsonObject = {
    [key: string]: JsonPrimitive | JsonArray | JsonObject;
};

export type Json = JsonPrimitive | JsonArray | JsonObject;
