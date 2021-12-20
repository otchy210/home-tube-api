import { execSync } from 'child_process';
import { unlinkSync } from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import { DEFAULT_APP_CONFIG, getDefaultAppConfigPath, handleRequest, loadAppConfig, saveAppConfig } from './ApiServer';
import { writeBadRequest, writeMethodNotAllowed, writeNotFound } from './ServerResponseUtils';
import { AppConfig, RequestHandler } from './types';
jest.mock('./ServerResponseUtils');

const TEST_CONFIG_PATH = './test/test-config.json';
const TEST_CONFIG_TMP_PATH = './tmp/test-config.json';

const TEST_CONFIG = {
    videoStorages: [
        {
            path: '/path/1/',
            enabled: true,
        },
        {
            path: '/path/2/',
            enabled: false,
        },
    ],
};

describe('getDefaultAppConfigPath', () => {
    it('returns default file name', () => {
        expect(getDefaultAppConfigPath()).toMatch(/\.home-tube-config.json$/);
    });
});

describe('loadAppConfig', () => {
    it("returns default app config when config doesn't exist", () => {
        expect(loadAppConfig('dummy')).toStrictEqual(DEFAULT_APP_CONFIG);
    });

    it('loads app config file properly', () => {
        expect(loadAppConfig(TEST_CONFIG_PATH)).toStrictEqual(TEST_CONFIG);
    });
});

describe('saveAppConfig', () => {
    beforeAll(() => {
        try {
            unlinkSync(TEST_CONFIG_TMP_PATH);
        } catch (e) {
            console.debug(e);
        }
    });
    afterAll(() => {
        try {
            unlinkSync(TEST_CONFIG_TMP_PATH);
        } catch (e) {
            console.debug(e);
        }
    });
    it('saves app config file properly', () => {
        saveAppConfig(TEST_CONFIG_TMP_PATH, TEST_CONFIG);
        expect(execSync(`diff ${TEST_CONFIG_PATH} ${TEST_CONFIG_TMP_PATH}`).toString()).toBe('');
    });
});

describe('handleRequest', () => {
    const mockedAppConfig = {} as AppConfig;
    const mockedResponse = {} as ServerResponse;
    const mockedRequestHandlers = new Map<string, RequestHandler>();
    const mockedWriteBadRequest = writeBadRequest as jest.Mock;
    const mockedWriteMethodNotAllowed = writeMethodNotAllowed as jest.Mock;
    const mockedWriteNotFound = writeNotFound as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('responds "bad request" when method is undefined', () => {
        const mockedRequest = {} as IncomingMessage;

        handleRequest(mockedAppConfig, mockedRequest, mockedResponse, mockedRequestHandlers);

        expect(mockedWriteBadRequest).toBeCalledTimes(1);
    });
    it('responds "method not allowed" when method is unsupported', () => {
        const mockedRequest = { method: 'HEAD' } as IncomingMessage;

        handleRequest(mockedAppConfig, mockedRequest, mockedResponse, mockedRequestHandlers);

        expect(mockedWriteMethodNotAllowed).toBeCalledTimes(1);
    });
    it('responds "not found" when request doesn\'t have url', () => {
        const mockedRequest = { method: 'GET' } as IncomingMessage;

        handleRequest(mockedAppConfig, mockedRequest, mockedResponse, mockedRequestHandlers);

        expect(mockedWriteNotFound).toBeCalledTimes(1);
    });
    it('responds "not found" when url doesn\'t match handlers', () => {
        const mockedRequest = { method: 'GET', url: '/not-found' } as IncomingMessage;

        handleRequest(mockedAppConfig, mockedRequest, mockedResponse, mockedRequestHandlers);

        expect(mockedWriteNotFound).toBeCalledTimes(1);
    });
    it.each([['GET'], ['POST'], ['DELETE']])('responds "method not allowed" when method %s is called but the handler doesn\'t support it', (method) => {
        const mockedRequest = { method, url: '/path' } as IncomingMessage;
        const mockedResponse = {} as ServerResponse;
        const mockedRequestHandlers = new Map<string, RequestHandler>();
        mockedRequestHandlers.set('/path', {} as RequestHandler);

        handleRequest(mockedAppConfig, mockedRequest, mockedResponse, mockedRequestHandlers);

        expect(mockedWriteMethodNotAllowed).toBeCalledTimes(1);
    });
    it('responds "ok" when everything goes well', () => {
        const mockedRequest = { method: 'GET', url: '/path' } as IncomingMessage;
        const mockedResponse = {
            writeHead: jest.fn(),
            write: jest.fn(),
            end: jest.fn(),
        } as unknown as ServerResponse;
        const mockedRequestHandlers = new Map<string, RequestHandler>();
        const mockedRequestHandler = {
            get: jest.fn().mockReturnValue({ result: 'ok' }),
        } as unknown as RequestHandler;
        mockedRequestHandlers.set('/path', mockedRequestHandler);

        handleRequest(mockedAppConfig, mockedRequest, mockedResponse, mockedRequestHandlers);

        expect(mockedResponse.writeHead).toBeCalledWith(200, expect.any(Object));
        expect(mockedResponse.write).toBeCalledWith('{"result":"ok"}');
        expect(mockedResponse.end).toBeCalledTimes(1);
    });
});
