import { IncomingMessage } from 'http';
import ApiServer from './ApiServer';
import { ErrorResponse } from './ServerResponseUtils';

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

export type RequestContext = {
    apiServer: ApiServer;
    appConfig: AppConfig;
    request: IncomingMessage;
    body?: Json;
};

export type RequestHandler = {
    path: string;
    get?: (context: RequestContext) => Json | ErrorResponse;
    post?: (context: RequestContext) => Json | ErrorResponse;
    delete?: (context: RequestContext) => Json | ErrorResponse;
};

type JsonPrimitive = string | number | boolean | null;

type JsonArray = JsonPrimitive[] | JsonObject[];

type JsonObject = {
    [key: string]: JsonPrimitive | JsonArray | JsonObject;
};

export type Json = JsonPrimitive | JsonArray | JsonObject;
