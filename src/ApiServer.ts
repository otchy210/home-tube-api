import { createServer, IncomingMessage, Server as HttpServer, ServerResponse } from 'http';
import { getDefaultAppConfigPath, loadAppConfig, saveAppConfig } from './utils/AppConfigUtils';
import { AppConfig, RequestHandler, RequestContext, Storage, ApiServerConfig } from './types';
import { useStorageManager } from './videos/StorageManager';
import { initializeWorkers, reinstantiateWorkers, stopWorkers } from './videos/FFmpegWorkersManager';
import { useMetaManager } from './videos/MetaManager';
import { useVideoCollection } from './videos/VideoCollection';
import { handleRequest, parseArgv } from './utils/ApiServerUtils';
import { defaultRequestHandlers } from './handlers/defaultRequestHandlers';
import { DEFAULT_API_PORT } from './const';
import { getLocalIpv4Addresses } from './utils/NetworkUtils';

export default class ApiServer {
    private port: number;
    private appConfigPath: string;
    private appConfig: AppConfig;
    private httpServer: HttpServer;
    private requestHandlers = new Map<string, RequestHandler>();

    public constructor(apiServerConfig?: ApiServerConfig, requestHandlers: RequestHandler[] = defaultRequestHandlers) {
        const config = apiServerConfig ?? parseArgv();

        this.port = config.port ?? DEFAULT_API_PORT;
        this.appConfigPath = config.appConfig ?? getDefaultAppConfigPath();
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

    public showInitialMessages() {
        console.log('==== HomeTube API Server =======================================');
        console.log('Running on:');
        getLocalIpv4Addresses().forEach((ipv4) => {
            const host = ipv4 === '127.0.0.1' ? 'localhost' : ipv4;
            console.log(`    http://${host}:${this.port}`);
        });
        console.log(`appConfigPath: ${this.appConfigPath}`);
        console.log('Press Ctrl+C to stop the server');
        console.log('================================================================');
    }

    public getPort(): number {
        return this.port;
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
