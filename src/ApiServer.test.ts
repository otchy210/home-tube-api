import * as request from 'supertest';
import ApiServer from './ApiServer';

describe('ApiServer', () => {
    const tmpConfig = `tmp/${Math.random().toString(32).substring(2)}/test-config.json`;

    let apiServer: ApiServer;
    beforeAll(() => {
        apiServer = new ApiServer({
            port: 12345,
            appConfig: tmpConfig,
        });
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
