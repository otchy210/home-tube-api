import * as request from 'supertest';
import ApiServer from './ApiServer';
import { appConfigHandler } from './AppConfigHandler';
import { RequestHandler } from './types';

const HTTP_PORT = 12345;

const testApiServer = (handlers: RequestHandler[], test: (request: request.SuperTest<request.Test>) => request.Test, done: jest.DoneCallback) => {
    const apiServer = new ApiServer({
        port: HTTP_PORT,
        appConfigPath: 'dummy-path-to-get-default-config',
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

describe('AppConfigHandler', () => {
    it('handles GET properly', (done) => {
        testApiServer(
            [appConfigHandler],
            (test) => {
                return test
                    .get('/appConfig')
                    .set('Accept', 'application/json')
                    .expect(200)
                    .expect((res) => {
                        const body = JSON.parse(res.text);
                        expect(body.videoStorages.length).toBe(0);
                    });
            },
            done
        );
    });
});
