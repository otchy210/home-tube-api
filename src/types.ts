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
    ffmpeg?: string;
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

export type StaticFileResponse = {
    path: string;
};

export type RequestHandlerResponse = {
    maxAge?: number;
    body: Json | ErrorResponse | StaticFileResponse;
};

export type RequestMethod = (context: RequestContext) => RequestHandlerResponse;

export type RequestHandler = {
    path: string;
    get?: RequestMethod;
    post?: RequestMethod;
    delete?: RequestMethod;
};

type JsonPrimitive = string | number | boolean | null;

type JsonArray = JsonPrimitive[] | JsonArray[] | JsonObject[];

type JsonObject = {
    [key: string]: JsonPrimitive | JsonArray | JsonObject;
};

export type Json = JsonPrimitive | JsonArray | JsonObject;

export type VideoValues = {
    key: string;
    path: string;
    name: string;
    names: string[];
    duration?: string;
    width?: number;
    height?: number;
    size?: string;
    stars?: Stars;
    tags?: string[];
    mtime?: number;
};

export type VideoDocument = {
    id: number;
    values: VideoValues;
};

export type VideoMeta = {
    name?: string;
    duration?: string;
    length?: number;
    vcodec?: string;
    width?: number;
    height?: number;
    acodec?: string;
    fileSize?: number;
    mtime?: number;
};

export type Stars = 1 | 2 | 3 | 4 | 5;

export type VideoConverterStatus = 'unavailable' | 'queued' | 'processing' | 'available';

export type VideoProperties = {
    stars?: Stars | null;
    tags?: string[] | null;
    mp4?: VideoConverterStatus;
};

export type VideoDetails = VideoValues & VideoMeta & VideoProperties;

export type AllTags = Record<string, number>;

export const isRequiredVideoMeta = (meta: VideoMeta): meta is Required<VideoMeta> => {
    if (meta.name && meta.duration && meta.length && meta.vcodec && meta.width && meta.height && meta.acodec && meta.fileSize && meta.mtime) {
        return true;
    }
    return false;
};

export type StorageMonitorStatus = 'initialized' | 'reading' | 'waiting' | 'stopped';

export type StorageStatus = {
    [path: string]: {
        size: number;
        status: StorageMonitorStatus;
    };
};

export type FFmpegWoekerStatus = {
    count: number;
    current: string | null;
};

export type ServerStatus = {
    storages: StorageStatus;
    indexedVideo: number;
    meta: FFmpegWoekerStatus;
    thumbnails: FFmpegWoekerStatus;
    snapshot: FFmpegWoekerStatus;
};

export type LengthTag = {
    length: number;
    tag: string;
    label: string;
};

export type SizeTag = {
    size: number;
    tag: string;
    label: string;
};
