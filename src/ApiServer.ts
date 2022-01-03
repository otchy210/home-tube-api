import { createServer, IncomingMessage, Server as HttpServer, ServerResponse } from 'http';
import { getDefaultAppConfigPath, loadAppConfig, saveAppConfig } from './utils/AppConfigUtils';
import {
    isErrorResponse,
    writeBadRequest,
    writeErrorResponse,
    writeInternalServerError,
    writeMethodNotAllowed,
    writeNotFound,
} from './utils/ServerResponseUtils';
import { AppConfig, ErrorResponse, Json, RequestHandler, RequestContext, ServerConfig, RequestParams, Storage } from './types';
import { appConfigHandler } from './handlers/AppConfigHandler';
import { searchHandler } from './handlers/SearchHandler';
import { StorageManager } from './videos/StorageManager';
import logger from './utils/logger';
import { initializeWorkers, reinstantiateWorkers } from './videos/FFmpegWorkersManager';
import { useMetaManager } from './videos/MetaManager';
import { useThumbnailsManager } from './videos/ThumbnailsManager';
import { thumbnailsHandler } from './handlers/ThumbnailsHandler';
import { useVideoCollection } from './videos/VideoCollection';
import { videoHandler } from './handlers/VideoHandler';
import { propertiesHandler } from './handlers/PropertiesHandler';

const supportedMethods = ['GET', 'POST', 'DELETE'];

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
            if (map[key] !== undefined) {
                throw new Error(`Duplicate param name is not allowed: ${key}`);
            }
            try {
                map[key] = JSON.parse(value);
            } catch {
                // treat all parse errors as string value
                map[key] = value;
            }
            return map;
        }, {});
    return { urlPath, params };
};

export const handleRequestEnd = (context: RequestContext, response: ServerResponse, handler: RequestHandler) => {
    let handlerResponse: Json | ErrorResponse | undefined;
    try {
        switch (context.request.method) {
            case 'GET':
                if (handler?.get === undefined) {
                    writeMethodNotAllowed(response);
                    return;
                }
                handlerResponse = handler.get(context);
                break;
            case 'POST':
                if (handler?.post === undefined) {
                    writeMethodNotAllowed(response);
                    return;
                }
                handlerResponse = handler.post(context);
                break;
            case 'DELETE':
                if (handler?.delete === undefined) {
                    writeMethodNotAllowed(response);
                    return;
                }
                handlerResponse = handler.delete(context);
                break;
        }
        if (handlerResponse === undefined) {
            writeBadRequest(response);
        } else if (isErrorResponse(handlerResponse)) {
            writeErrorResponse(response, handlerResponse);
        } else {
            response.writeHead(200, {
                'Content-Type': 'application/json; charset=UTF-8',
            });
            response.write(JSON.stringify(handlerResponse));
            response.end();
        }
    } catch (e) {
        logger.error(e);
        writeInternalServerError(response);
    }
};

export const handleRequest = (context: RequestContext, response: ServerResponse, requestHandlers: Map<string, RequestHandler>) => {
    const { method, url } = context.request;
    if (method === undefined) {
        writeBadRequest(response);
        return;
    }
    if (!supportedMethods.includes(method)) {
        writeMethodNotAllowed(response);
        return;
    }
    if (url === undefined) {
        writeNotFound(response);
        return;
    }

    const urlParams = parseUrl(url);
    const handler = requestHandlers.get(urlParams.urlPath);
    if (!handler) {
        writeNotFound(response);
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

const defaultRequestHandlers: RequestHandler[] = [appConfigHandler, searchHandler, thumbnailsHandler, videoHandler, propertiesHandler];

export default class ApiServer {
    private port: number;
    private appConfigPath: string;
    private appConfig: AppConfig;
    private httpServer: HttpServer;
    private requestHandlers = new Map<string, RequestHandler>();
    private storageManager = new StorageManager();

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
                this.storageManager.remove(path);
            }
        });

        // check added or enabled
        updatedMap.forEach((updatedStorage, path) => {
            if (updatedStorage.enabled && !currentMap.get(path)?.enabled) {
                this.storageManager.add(path, this.createStorageListener());
            }
        });
    }

    public close(): ApiServer {
        const metaManager = useMetaManager();
        const thumbnailsManager = useThumbnailsManager();
        metaManager.stopMonitoring();
        thumbnailsManager.stopMonitoring();
        this.httpServer.close();
        return this;
    }
}
