import ApiServer, { handleRequestEnd, parseUrl } from './ApiServer';
import { IncomingMessage, ServerResponse } from 'http';
import { handleRequest } from './ApiServer';
import { buildJsonResponseHeaders, writeBadRequest, writeMethodNotAllowed, writeNotFound } from './utils/ServerResponseUtils';
import { AppConfig, RequestContext, RequestHandler } from './types';
import * as request from 'supertest';

jest.mock('./utils/ServerResponseUtils');

describe('parseUrl', () => {
    it('works', () => {
        expect(parseUrl('/noparams')).toStrictEqual({
            urlPath: '/noparams',
        });
        expect(parseUrl('/single?a=1')).toStrictEqual({
            urlPath: '/single',
            params: { a: 1 },
        });
        expect(parseUrl('/multiple?a=1&b=true&c=str&d=[1,2,3,4]')).toStrictEqual({
            urlPath: '/multiple',
            params: { a: 1, b: true, c: 'str', d: [1, 2, 3, 4] },
        });
    });
});

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
    const mockedBuildJsonResponseHeaders = buildJsonResponseHeaders as jest.Mock;

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

            handleRequestEnd(mockedContext, mockedResponse, mockedRequestHandler);

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
                get: jest.fn().mockReturnValue({ body: { result: 'ok' } }),
            } as unknown as RequestHandler;
            mockedBuildJsonResponseHeaders.mockReturnValue({ dummy: '1' });

            handleRequestEnd(mockedContext, mockedResponse, mockedRequestHandler);

            expect(mockedResponse.writeHead).toBeCalledWith(200, expect.any(Object));
            expect(mockedResponse.write).toBeCalledWith('{"result":"ok"}');
            expect(mockedResponse.end).toBeCalledTimes(1);
        });
    });
});

describe('ApiServer', () => {
    const tmpConfig = `tmp/${Math.random().toString(32).substring(2)}/test-config.json`;
    let apiServer: ApiServer;
    beforeAll(() => {
        apiServer = new ApiServer({ port: 12345, appConfigPath: tmpConfig });
        apiServer.start();
    });
    it('returns 404 for unkown path', () => {
        request(apiServer.getHttpServer()).get('/dummy').expect(404);
    });
    it('/appConfig returns default appConfig', () => {
        request(apiServer.getHttpServer())
            .get('/appConfig')
            .expect(200)
            .expect((res) => {
                const body = JSON.parse(res.text);
                expect(body.storages.length).toBe(0);
            });
    });
    afterAll(() => {
        apiServer.close();
    });
});
