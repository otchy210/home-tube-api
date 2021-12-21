import * as request from 'supertest';
import { readFileSync, unlinkSync } from 'fs';
import { Json, RequestHandler } from '../types';
import ApiServer from '../ApiServer';

export const TEST_CONFIG_PATH = './test/test-config.json';
export const TEST_CONFIG_TMP_PATH = './tmp/test-config.json';

export const TEST_CONFIG = {
    storages: [
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

const TEST_HTTP_PORT = 12345;

export const removeTestConfigTmpFile = () => {
    try {
        unlinkSync(TEST_CONFIG_TMP_PATH);
    } catch (e) {} // eslint-disable-line no-empty
};

export const readTestConfigTmpFileAsJson = (): Json => {
    return JSON.parse(readFileSync(TEST_CONFIG_TMP_PATH).toString());
};

export const testApiServer = (
    handlers: RequestHandler[],
    test: (request: request.SuperTest<request.Test>) => request.Test,
    done: jest.DoneCallback
): Promise<void> => {
    removeTestConfigTmpFile();
    const apiServer = new ApiServer({
        port: TEST_HTTP_PORT,
        appConfigPath: TEST_CONFIG_TMP_PATH,
    });
    handlers.forEach((handler) => {
        apiServer.registerRequestHandler(handler);
    });
    return new Promise((resolve) => {
        apiServer.start().then((apiServer) => {
            const httpServer = apiServer.getHttpServer();
            test(request(httpServer)).end((err) => {
                apiServer.close();
                resolve();
                return done(err);
            });
        });
    });
};
