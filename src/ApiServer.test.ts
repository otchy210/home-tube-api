import ApiServer from './ApiServer';
import * as request from 'supertest';
import * as ApiServerUtils from './utils/ApiServerUtils';

describe('ApiServer', () => {
    const tmpConfig = `tmp/${Math.random().toString(32).substring(2)}/test-config.json`;
    jest.spyOn(ApiServerUtils, 'parseArgv').mockReturnValue({
        port: 12345,
        appConfig: tmpConfig,
    } as ApiServerUtils.Argv);

    let apiServer: ApiServer;
    beforeAll(() => {
        apiServer = new ApiServer();
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
