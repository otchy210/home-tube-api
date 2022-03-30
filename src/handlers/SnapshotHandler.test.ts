import { RequestContext, RequestHandlerResponse, RequestParams, StaticFileResponse } from '../types';
import { initializeWorkers, stopWorkers } from '../videos/FFmpegWorkersManager';
import { useSnapshotManager } from '../videos/SnapshotManager';
import { useVideoCollection } from '../videos/VideoCollection';
import { snapshotHandler } from './SnapshotHandler';

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
                    key: 'key',
                } as RequestParams,
            } as RequestContext;
            const response = snapshotHandler.get(mockedContext) as RequestHandlerResponse;
            const result = response.body as StaticFileResponse;
            expect(response.maxAge).toBe(60);
            expect(result.path.endsWith('/images/no-snapshot.png')).toBe(true);
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
                    key: 'key',
                    minute: 0,
                } as RequestParams,
            } as RequestContext;
            expect(snapshotHandler.get(mockedContext)).toStrictEqual({ maxAge: 600, body: { path: '/dummy/snapshot.jpg' } });
        });
    });
    afterAll(() => {
        stopWorkers();
    });
});
