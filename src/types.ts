import { IncomingMessage } from 'http';
import ApiServer from './ApiServer';

export type ServerConfig = {
    port: number;
    appConfigPath?: string;
};

export type Storage = {
    path: string;
    enabled: boolean;
};

export type AppConfig = {
    storages: Storage[];
};

export type RequestParams = {
    [key: string]: Json;
};

export type RequestContext = {
    apiServer: ApiServer;
    appConfig: AppConfig;
    request: IncomingMessage;
    params?: RequestParams;
    body?: Json;
};

export type ErrorResponse = {
    status: number;
    message: string;
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

export type VideoMeta = {
    duration?: string;
    length?: number;
    vcodec?: string;
    width?: number;
    height?: number;
    acodec?: string;
};
