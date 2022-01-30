import { createServer, IncomingMessage, Server as HttpServer, ServerResponse } from 'http';
import { getDefaultAppConfigPath, loadAppConfig, saveAppConfig } from './utils/AppConfigUtils';
import {
    buildJsonResponseHeaders,
    isErrorResponse,
    isStaticFileResponse,
    writeBadRequest,
    writeErrorResponse,
    writeInternalServerError,
    writeMethodNotAllowed,
    writeNotFound,
} from './utils/ServerResponseUtils';
import { AppConfig, Json, RequestHandler, RequestContext, ServerConfig, RequestParams, Storage, RequestHandlerResponse } from './types';
import { appConfigHandler } from './handlers/AppConfigHandler';
import { searchHandler } from './handlers/SearchHandler';
import { useStorageManager } from './videos/StorageManager';
import logger from './utils/logger';
import { initializeWorkers, reinstantiateWorkers, stopWorkers } from './videos/FFmpegWorkersManager';
import { useMetaManager } from './videos/MetaManager';
import { thumbnailsHandler } from './handlers/ThumbnailsHandler';
import { useVideoCollection } from './videos/VideoCollection';
import { detailsHandler } from './handlers/DetailsHandler';
import { propertiesHandler } from './handlers/PropertiesHandler';
import send = require('send');
import { snapshotHandler } from './handlers/SnapshotHandler';
import { videoHandler } from './handlers/VideoHandler';
import { allTagsHandler } from './handlers/AllTagsHandler';
import { serverStatusHandler } from './handlers/ServerStatusHandler';

const supportedMethods = ['GET', 'POST', 'DELETE', 'OPTIONS'];

export const parseUrl = (url: string): { urlPath: string; params?: RequestParams } => {
    const charIndex = url.indexOf('?');
    if (charIndex < 0) {
        return { urlPath: url };
    }
    const urlPath = url.substring(0, charIndex);
    const params = url
        .substring(charIndex + 1)
        .split('&')
        .map((pairStr) => pairStr.split('='))
        .reduce<RequestParams>((map, [key, value]) => {
            const decodedValue = decodeURIComponent(value);
            if (map[key] !== undefined) {
                console.warn(`Duplicate param name is not allowed: "${key}" has "${map[key]}" already / skipped "${decodedValue}"`);
                return map;
            }
            try {
                map[key] = JSON.parse(decodedValue);
            } catch {
                // treat all parse errors as string value
                map[key] = decodedValue;
            }
            return map;
        }, {});
    return { urlPath, params };
};

export const handleRequestEnd = (context: RequestContext, response: ServerResponse, handler: RequestHandler) => {
    let handlerResponse: RequestHandlerResponse | undefined;
    const origin = context.request?.headers?.origin;
    try {
        switch (context.request.method) {
            case 'GET':
                if (handler?.get === undefined) {
                    writeMethodNotAllowed(response, origin);
                    return;
                }
                handlerResponse = handler.get(context);
                break;
            case 'POST':
                if (handler?.post === undefined) {
                    writeMethodNotAllowed(response, origin);
                    return;
                }
                handlerResponse = handler.post(context);
                break;
            case 'DELETE':
                if (handler?.delete === undefined) {
                    writeMethodNotAllowed(response, origin);
                    return;
                }
                handlerResponse = handler.delete(context);
                break;
        }
        if (handlerResponse === undefined) {
            writeBadRequest(response, origin);
        } else if (isErrorResponse(handlerResponse)) {
            writeErrorResponse(response, handlerResponse, origin);
        } else if (isStaticFileResponse(handlerResponse)) {
            const options: send.SendOptions = {};
            if (handlerResponse.maxAge > 0) {
                options.cacheControl = true;
                options.maxAge = handlerResponse.maxAge * 1000;
                options.immutable = true;
            }
            send(context.request, handlerResponse.path, options).pipe(response);
        } else {
            response.writeHead(200, buildJsonResponseHeaders(origin));
            response.write(JSON.stringify(handlerResponse));
            response.end();
        }
    } catch (e) {
        logger.error(e);
        writeInternalServerError(response, origin);
    }
};

export const handleRequest = (context: RequestContext, response: ServerResponse, requestHandlers: Map<string, RequestHandler>) => {
    const { method, url } = context.request;
    const origin = context.request?.headers?.origin;
    if (method === undefined) {
        writeBadRequest(response, origin);
        return;
    }
    if (!supportedMethods.includes(method)) {
        writeMethodNotAllowed(response, origin);
        return;
    }
    if (method === 'OPTIONS') {
        const responseHeaders = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': supportedMethods.join(', '),
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': 7200,
        };
        response.writeHead(204, responseHeaders);
        response.end();
        return;
    }
    if (url === undefined) {
        writeNotFound(response, origin);
        return;
    }

    const urlParams = parseUrl(url);
    const handler = requestHandlers.get(urlParams.urlPath);
    if (!handler) {
        writeNotFound(response, origin);
        return;
    }
    if (urlParams.params) {
        context.params = urlParams.params;
    }

    const bodyChunks = new Array<Uint8Array>();
    context.request.on('data', (chunk) => {
        bodyChunks.push(chunk);
    });
    context.request.on('end', () => {
        if (bodyChunks.length > 0) {
            const bodyBuffer = Buffer.concat(bodyChunks);
            context.body = JSON.parse(bodyBuffer.toString()) as Json;
        }
        handleRequestEnd(context, response, handler);
    });
};

const defaultRequestHandlers: RequestHandler[] = [
    appConfigHandler,
    searchHandler,
    detailsHandler,
    snapshotHandler,
    propertiesHandler,
    videoHandler,
    thumbnailsHandler,
    allTagsHandler,
    serverStatusHandler,
];

export default class ApiServer {
    private port: number;
    private appConfigPath: string;
    private appConfig: AppConfig;
    private httpServer: HttpServer;
    private requestHandlers = new Map<string, RequestHandler>();

    public constructor(serverConfig: ServerConfig, requestHandlers: RequestHandler[] = defaultRequestHandlers) {
        this.port = serverConfig.port;
        this.appConfigPath = serverConfig.appConfigPath ?? getDefaultAppConfigPath();
        this.appConfig = loadAppConfig(this.appConfigPath);
        initializeWorkers(this.appConfig.ffmpeg);
        this.updateStorages([], this.appConfig.storages);

        requestHandlers.forEach((requestHandler) => {
            const { path } = requestHandler;
            if (this.requestHandlers.has(path)) {
                throw new Error(`Request path has been registered: ${path}`);
            }
            this.requestHandlers.set(path, requestHandler);
        });

        this.httpServer = createServer((request: IncomingMessage, response: ServerResponse): void => {
            const context = {
                apiServer: this,
                appConfig: this.appConfig,
                request,
            } as RequestContext;
            handleRequest(context, response, this.requestHandlers);
        });
    }

    public getAppConfigPath(): string {
        return this.appConfigPath;
    }

    public saveAppConfig(updatedAppConfig: AppConfig): AppConfig {
        const currentStorages = this.appConfig.storages;
        this.updateStorages(currentStorages, updatedAppConfig.storages);
        if (this.appConfig.ffmpeg !== updatedAppConfig.ffmpeg) {
            reinstantiateWorkers(updatedAppConfig.ffmpeg);
        }
        this.appConfig = updatedAppConfig;
        saveAppConfig(this.appConfigPath, updatedAppConfig);
        return updatedAppConfig;
    }

    public getHttpServer(): HttpServer {
        return this.httpServer;
    }

    public start(): Promise<ApiServer> {
        return new Promise((resolve) => {
            this.httpServer.listen(this.port, () => {
                resolve(this);
            });
        });
    }

    private createStorageListener(): (added: Set<string>, removed: Set<string>) => void {
        const metaManager = useMetaManager();
        const videoCollection = useVideoCollection();
        return (added, removed) => {
            removed.forEach((path) => {
                videoCollection.remove(path);
            });
            added.forEach((path) => {
                videoCollection.add(path);
                // try updating meta
                metaManager.get(path);
            });
        };
    }

    private updateStorages(current: Storage[], updated: Storage[]) {
        const storageManager = useStorageManager();

        const currentMap = current.reduce((map, curr) => {
            map.set(curr.path, curr);
            return map;
        }, new Map<string, Storage>());
        const updatedMap = updated.reduce((map, curr) => {
            map.set(curr.path, curr);
            return map;
        }, new Map<string, Storage>());

        // check removed or disabled
        currentMap.forEach((currentStorage, path) => {
            if (currentStorage.enabled && !updatedMap.get(path)?.enabled) {
                storageManager.remove(path);
            }
        });

        // check added or enabled
        updatedMap.forEach((updatedStorage, path) => {
            if (updatedStorage.enabled && !currentMap.get(path)?.enabled) {
                storageManager.add(path, this.createStorageListener());
            }
        });
    }

    public close(): ApiServer {
        stopWorkers();
        this.httpServer.close();
        return this;
    }
}
