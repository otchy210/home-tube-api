import * as request from 'supertest';
import ApiServer, { handleRequestEnd } from './ApiServer';
import { unlinkSync } from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import { handleRequest } from './ApiServer';
import { writeBadRequest, writeMethodNotAllowed, writeNotFound } from './ServerResponseUtils';
import { AppConfig, RequestContext, RequestHandler } from './types';
import { TEST_CONFIG_TMP_PATH } from './AppConfigUtils.test';

jest.mock('./ServerResponseUtils');

const TEST_HTTP_PORT = 12345;

export const testApiServer = (handlers: RequestHandler[], test: (request: request.SuperTest<request.Test>) => request.Test, done: jest.DoneCallback) => {
    try {
        unlinkSync(TEST_CONFIG_TMP_PATH);
    } catch (e) {
        console.debug(`failed to remove ${TEST_CONFIG_TMP_PATH}`);
    }
    const apiServer = new ApiServer({
        port: TEST_HTTP_PORT,
        appConfigPath: TEST_CONFIG_TMP_PATH,
    });
    handlers.forEach((handler) => {
        apiServer.registerRequestHandler(handler);
    });
    apiServer.start().then((apiServer) => {
        const httpServer = apiServer.getHttpServer();
        test(request(httpServer)).end((err) => {
            apiServer.close();
            return done(err);
        });
    });
};

describe('handleRequest', () => {
    const mockedApiServer = {} as ApiServer;
    const mockedAppConfig = {} as AppConfig;
    const defaultMockedRequest = { on: jest.fn() } as unknown as IncomingMessage;
    const mockedResponse = {} as ServerResponse;
    const defaultMockedContext = {
        apiServer: mockedApiServer,
        appConfig: mockedAppConfig,
        request: defaultMockedRequest,
    } as RequestContext;
    const mockedRequestHandlers = new Map<string, RequestHandler>();
    const mockedWriteBadRequest = writeBadRequest as jest.Mock;
    const mockedWriteMethodNotAllowed = writeMethodNotAllowed as jest.Mock;
    const mockedWriteNotFound = writeNotFound as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('responds "bad request" when method is undefined', () => {
        handleRequest(defaultMockedContext, mockedResponse, mockedRequestHandlers);

        expect(mockedWriteBadRequest).toBeCalledTimes(1);
    });
    it('responds "method not allowed" when method is unsupported', () => {
        const mockedContext = { ...defaultMockedContext, request: { method: 'HEAD', ...defaultMockedRequest } } as RequestContext;

        handleRequest(mockedContext, mockedResponse, mockedRequestHandlers);

        expect(mockedWriteMethodNotAllowed).toBeCalledTimes(1);
    });
    it('responds "not found" when request doesn\'t have url', () => {
        const mockedContext = { ...defaultMockedContext, request: { method: 'GET', ...defaultMockedRequest } } as RequestContext;

        handleRequest(mockedContext, mockedResponse, mockedRequestHandlers);

        expect(mockedWriteNotFound).toBeCalledTimes(1);
    });
    it('responds "not found" when url doesn\'t match handlers', () => {
        const mockedContext = { ...defaultMockedContext, request: { method: 'GET', url: '/not-found', ...defaultMockedRequest } } as RequestContext;

        handleRequest(mockedContext, mockedResponse, mockedRequestHandlers);

        expect(mockedWriteNotFound).toBeCalledTimes(1);
    });

    describe('handleRequestEnd', () => {
        it.each([['GET'], ['POST'], ['DELETE']])('responds "method not allowed" when method %s is called but the handler doesn\'t support it', (method) => {
            const mockedContext = { ...defaultMockedContext, request: { method, url: '/path', ...defaultMockedRequest } } as RequestContext;
            const mockedResponse = {} as ServerResponse;
            const mockedRequestHandler = {} as RequestHandler;
            const mockedBodyChunks = [] as Array<Uint8Array>;

            handleRequestEnd(mockedContext, mockedResponse, mockedRequestHandler, mockedBodyChunks);

            expect(mockedWriteMethodNotAllowed).toBeCalledTimes(1);
        });
        it('responds "ok" when GET method goes well', () => {
            const mockedContext = { ...defaultMockedContext, request: { method: 'GET', url: '/path', ...defaultMockedRequest } } as RequestContext;
            const mockedResponse = {
                writeHead: jest.fn(),
                write: jest.fn(),
                end: jest.fn(),
            } as unknown as ServerResponse;
            const mockedRequestHandler = {
                get: jest.fn().mockReturnValue({ result: 'ok' }),
            } as unknown as RequestHandler;
            const mockedBodyChunks = [] as Array<Uint8Array>;

            handleRequestEnd(mockedContext, mockedResponse, mockedRequestHandler, mockedBodyChunks);

            expect(mockedResponse.writeHead).toBeCalledWith(200, expect.any(Object));
            expect(mockedResponse.write).toBeCalledWith('{"result":"ok"}');
            expect(mockedResponse.end).toBeCalledTimes(1);
        });
    });
});
