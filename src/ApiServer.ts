import { createServer, IncomingMessage, Server as HttpServer, ServerResponse } from 'http';
import { getDefaultAppConfigPath, loadAppConfig, saveAppConfig } from './utils/AppConfigUtils';
import { isErrorResponse, writeBadRequest, writeErrorResponse, writeMethodNotAllowed, writeNotFound } from './utils/ServerResponseUtils';
import { AppConfig, ErrorResponse, Json, RequestHandler, RequestContext, ServerConfig } from './types';
import { appConfigHandler } from './handlers/AppConfigHandler';

const supportedMethods = ['GET', 'POST', 'DELETE'];

export const handleRequestEnd = (context: RequestContext, response: ServerResponse, handler: RequestHandler, bodyChunks: Array<Uint8Array>) => {
    if (bodyChunks.length > 0) {
        const bodyBuffer = Buffer.concat(bodyChunks);
        context.body = JSON.parse(bodyBuffer.toString()) as Json;
    }

    let handlerResponse: Json | ErrorResponse | undefined;
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
    // TODO: need to parse params
    if (!requestHandlers.has(url)) {
        writeNotFound(response);
        return;
    }
    const handler = requestHandlers.get(url) as RequestHandler;

    const bodyChunks = new Array<Uint8Array>();
    context.request.on('data', (chunk) => {
        bodyChunks.push(chunk);
    });
    context.request.on('end', () => {
        handleRequestEnd(context, response, handler, bodyChunks);
    });
};

const defaultRequestHandlers: RequestHandler[] = [appConfigHandler];

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
        requestHandlers.forEach((requestHandler) => {
            const { path } = requestHandler;
            if (this.requestHandlers.has(path)) {
                throw new Error(`Request path has been registered: ${path}`);
            }
            this.requestHandlers.set(path, requestHandler);
        });
        this.httpServer = createServer(this.requestListener);
    }

    public getAppConfigPath(): string {
        return this.appConfigPath;
    }

    public getAppConfig(): AppConfig {
        return this.appConfig;
    }

    public saveAppConfig(updatedAppConfig: AppConfig): AppConfig {
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

    private requestListener = (request: IncomingMessage, response: ServerResponse): void => {
        const context = {
            apiServer: this,
            appConfig: this.appConfig,
            request,
        } as RequestContext;
        handleRequest(context, response, this.requestHandlers);
    };

    public close(): ApiServer {
        this.httpServer.close();
        return this;
    }
}
