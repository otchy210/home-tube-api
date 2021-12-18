import { existsSync, readFileSync, writeFileSync } from 'fs';
import { createServer, IncomingMessage, Server as HttpServer, ServerResponse } from 'http';
import { homedir } from 'os';
import { join } from 'path';
import { AppConfig, Json, RequestHandler, RequestProps, ServerConfig } from './types';

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

const writeBadRequest = (res: ServerResponse): void => {
    res.writeHead(400, 'Bad Request');
    res.end();
};

const writeNotFound = (res: ServerResponse): void => {
    res.writeHead(404, 'Not Found');
    res.end();
};

const writeMethodNotAllowed = (res: ServerResponse): void => {
    res.writeHead(405, 'Method Not Allowed');
    res.end();
};

const supportedMethods = ['GET', 'POST', 'DELETE'];

export default class ApiServer {
    private port: number;
    private appConfig: AppConfig;
    private httpServer: HttpServer;
    private requestHandlers = new Map<string, RequestHandler>();

    public constructor(serverConfig: ServerConfig) {
        this.port = serverConfig.port;
        const appConfigPath = serverConfig.appConfigPath ?? getDefaultAppConfigPath();
        this.appConfig = loadAppConfig(appConfigPath);
        this.httpServer = createServer(this.requestListener);
    }

    public getAppConfig(): AppConfig {
        return this.appConfig;
    }

    public getHttpServer(): HttpServer {
        return this.httpServer;
    }

    public registerRequestHandler = (requestHandler: RequestHandler): void => {
        const { path } = requestHandler;
        if (this.requestHandlers.has(path)) {
            throw new Error(`Request path has been registered: ${path}`);
        }
        this.requestHandlers.set(path, requestHandler);
    };

    public start(): Promise<ApiServer> {
        return new Promise((resolve) => {
            this.httpServer.listen(this.port, () => {
                resolve(this);
            });
        });
    }

    private requestListener = (req: IncomingMessage, res: ServerResponse): void => {
        // TODO: need test
        const { method, url } = req;
        if (method === undefined) {
            writeBadRequest(res);
            return;
        }
        if (!supportedMethods.includes(method)) {
            writeMethodNotAllowed(res);
            return;
        }
        if (url === undefined) {
            writeNotFound(res);
            return;
        }
        // TODO: need to parse params
        if (!this.requestHandlers.has(url)) {
            writeNotFound(res);
            return;
        }
        const handler = this.requestHandlers.get(url);
        const props: RequestProps = {
            appConfig: this.appConfig,
            request: req,
        };
        let response: Json | undefined;
        switch (method) {
            case 'GET':
                if (handler?.get === undefined) {
                    writeMethodNotAllowed(res);
                    return;
                }
                response = handler.get(props);
                break;
            case 'POST':
                if (handler?.post === undefined) {
                    writeMethodNotAllowed(res);
                    return;
                }
                // TODO: need to parse body
                response = handler.post(props);
                break;
            case 'DELETE':
                if (handler?.delete === undefined) {
                    writeMethodNotAllowed(res);
                    return;
                }
                response = handler.delete(props);
                break;
        }
        res.writeHead(200, {
            'Content-Type': 'application/json; charset=UTF-8',
        });
        res.write(JSON.stringify(response));
        res.end();
    };

    public close(): ApiServer {
        this.httpServer.close();
        return this;
    }
}
