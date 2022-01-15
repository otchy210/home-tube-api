import { RequestContext, RequestParams } from '../types';
import { initializeWorkers, stopWorkers } from '../videos/FFmpegWorkersManager';
import { useVideoCollection } from '../videos/VideoCollection';
import { videoHandler } from './VideoHandler';

describe('videoHandler', () => {
    beforeAll(() => {
        initializeWorkers();
    });
    describe('get', () => {
        it('returns video path', () => {
            const videoCollection = useVideoCollection();
            const mockedGetVideo = jest.spyOn(videoCollection, 'get');
            mockedGetVideo.mockReturnValue({
                id: 1,
                values: {
                    path: '/dummy/dummy.mp4',
                },
            });
            const mockedContext = {
                params: {
                    id: 1,
                } as RequestParams,
            } as RequestContext;
            expect(videoHandler.get(mockedContext)).toBe('/dummy/dummy.mp4');
        });
    });
    afterAll(() => {
        stopWorkers();
    });
});
