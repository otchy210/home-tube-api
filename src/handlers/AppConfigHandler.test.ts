import ApiServer from '../ApiServer';
import { Json, RequestContext } from '../types';
import { BAD_REQUEST } from '../utils/ServerResponseUtils';
import { TEST_CONFIG } from '../utils/TestConst';
import { appConfigHandler } from './AppConfigHandler';

describe('appConfigHandler', () => {
    it('handles GET properly', () => {
        const mockedContext = {
            appConfig: TEST_CONFIG,
        } as RequestContext;
        expect(appConfigHandler.get(mockedContext).body).toStrictEqual(TEST_CONFIG);
    });

    describe('POST', () => {
        it("returns 400 if it doesn't have body", () => {
            if (!appConfigHandler.post) {
                fail('appConfigHandler has to implement post');
            }
            const mockedContext = {} as RequestContext;
            expect(appConfigHandler.post(mockedContext).body).toStrictEqual(BAD_REQUEST);
        });

        it('stores config properly based on body', () => {
            if (!appConfigHandler.post) {
                fail('appConfigHandler has to implement post');
            }

            const mockedApiServer = {
                saveAppConfig: jest.fn(),
            } as unknown as ApiServer;
            const mockedBody = {
                storages: [
                    {
                        path: 'test/storage1',
                        enabled: true,
                    },
                ],
            } as Json;
            const mockedContext = {
                apiServer: mockedApiServer,
                appConfig: TEST_CONFIG,
                body: mockedBody,
            } as RequestContext;

            appConfigHandler.post(mockedContext);

            expect(mockedApiServer.saveAppConfig).toBeCalledWith({
                storages: [
                    {
                        path: 'test/storage1',
                        enabled: true,
                    },
                ],
            });
        });
    });
});
