import { RequestContext, RequestParams } from '../types';
import { snapshotHandler } from './SnapshotHandler';
import { initializeWorkers, stopWorkers } from '../videos/FFmpegWorkersManager';
import { useVideoCollection } from '../videos/VideoCollection';
import { useSnapshotManager } from '../videos/SnapshotManager';

describe('SnapshotHandler', () => {
    beforeAll(() => {
        initializeWorkers();
    });
    describe('get', () => {
        it('returns no-snapshot file path when no snapshot file found', () => {
            const videoCollection = useVideoCollection();
            const mockedGet = jest.spyOn(videoCollection, 'get');
            mockedGet.mockReturnValue({
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
            const response = snapshotHandler.get(mockedContext);
            if (typeof response !== 'string') {
                fail();
            } else {
                expect(response.endsWith('/images/no-snapshot.png')).toBe(true);
            }
        });
        it('returns thumbnails path when thumbnails file found', () => {
            const videoCollection = useVideoCollection();
            const mockedGetVideo = jest.spyOn(videoCollection, 'get');
            mockedGetVideo.mockReturnValue({
                id: 0,
                values: {
                    path: '/dummy/dummy.mp4',
                },
            });
            const snapshotManager = useSnapshotManager();
            const mockedGetSnapshot = jest.spyOn(snapshotManager, 'get');
            mockedGetSnapshot.mockReturnValue('/dummy/snapshot.jpg');
            const mockedContext = {
                params: {
                    id: 1,
                    minute: 0,
                } as RequestParams,
            } as RequestContext;
            expect(snapshotHandler.get(mockedContext)).toBe('/dummy/snapshot.jpg');
        });
    });
    afterAll(() => {
        stopWorkers();
    });
});