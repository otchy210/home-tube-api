import { RequestContext, RequestParams } from '../types';
import * as sru from '../utils/ServerRequestUtils';
import { BAD_REQUEST } from '../utils/ServerResponseUtils';
import { initializeWorkers, stopWorkers } from '../videos/FFMpegWorkersManager';
import { usePropertiesManager } from '../videos/PropertiesManager';
import { detailsHandler } from './DetailsHandler';

describe('detailsHandler', () => {
    beforeAll(() => {
        initializeWorkers();
    });
    describe('get', () => {
        it('returns BAD_REQUEST when validation fails', () => {
            const mockedContext = {} as RequestContext;
            expect(detailsHandler.get(mockedContext).body).toBe(BAD_REQUEST);
        });
        it('returns whole view of video properly', () => {
            jest.spyOn(sru, 'validateAndGetVideo').mockReturnValue({
                path: 'test/storage1/test-movie.mp4',
            });
            const propertiesManager = usePropertiesManager();
            jest.spyOn(propertiesManager, 'get').mockReturnValue({
                stars: 5,
            });
            const mockedContext = {
                params: {
                    id: 1,
                } as RequestParams,
            } as RequestContext;
            expect(detailsHandler.get(mockedContext).body).toStrictEqual({
                acodec: 'aac',
                duration: '0:03',
                fileSize: 1504413,
                height: 1080,
                length: 3.08,
                mtime: 1640602283040,
                name: 'test-movie.mp4',
                path: 'test/storage1/test-movie.mp4',
                stars: 5,
                vcodec: 'h264',
                width: 1920,
            });
        });
    });
    afterAll(() => {
        stopWorkers();
    });
});
