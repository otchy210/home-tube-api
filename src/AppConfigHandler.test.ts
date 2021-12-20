import { testApiServer } from './ApiServer.test';
import { appConfigHandler } from './AppConfigHandler';

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
