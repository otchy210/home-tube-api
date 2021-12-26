import { readTestConfigTmpFileAsJson, removeTestConfigTmpFile, testApiServer } from '../utils/TestUtils';
import { appConfigHandler } from './AppConfigHandler';
import { AppConfig } from '../types';

describe('appConfigHandler', () => {
    it('handles GET properly', (done) => {
        testApiServer(
            [appConfigHandler],
            (test) => {
                return test
                    .get('/appConfig')
                    .expect(200)
                    .expect((res) => {
                        const body = JSON.parse(res.text);
                        expect(body.storages.length).toBe(0);
                    });
            },
            done
        );
    });

    it("returns 400 if POST doesn't have body", (done) => {
        testApiServer(
            [appConfigHandler],
            (test) => {
                return test.post('/appConfig').expect(400);
            },
            done
        );
    });

    it('returns 200 and stores default config when POST body is empty', (done) => {
        testApiServer(
            [appConfigHandler],
            (test) => {
                return test.post('/appConfig').send({}).expect(200);
            },
            done
        ).then(() => {
            const config = readTestConfigTmpFileAsJson() as AppConfig;
            expect(config.storages.length).toBe(0);
            removeTestConfigTmpFile();
        });
    });

    it('returns 200 and stores config properly based on POST body', (done) => {
        testApiServer(
            [appConfigHandler],
            (test) => {
                return test
                    .post('/appConfig')
                    .send({ storages: [{ path: '/path/1/', enabled: true }] })
                    .expect(200);
            },
            done
        ).then(() => {
            const config = readTestConfigTmpFileAsJson() as AppConfig;
            expect(config.storages.length).toBe(1);
            expect(config.storages[0].path).toBe('/path/1/');
            expect(config.storages[0].enabled).toBe(true);
            removeTestConfigTmpFile();
        });
    });
});
