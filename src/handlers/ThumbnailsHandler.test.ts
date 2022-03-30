import { RequestContext, RequestParams } from '../types';
import { BAD_REQUEST, NOT_FOUND } from '../utils/ServerResponseUtils';
import { initializeWorkers, stopWorkers } from '../videos/FFmpegWorkersManager';
import { useThumbnailsManager } from '../videos/ThumbnailsManager';
import { useVideoCollection } from '../videos/VideoCollection';
import { thumbnailsHandler } from './ThumbnailsHandler';

describe('ThumbnailsHandler', () => {
    beforeAll(() => {
        initializeWorkers();
    });
    describe('get', () => {
        it('returns BAD_REQUEST when param minute is not number', () => {
            const mockedContext = {
                params: {
                    id: 1,
                    minute: 'string',
                } as RequestParams,
            } as RequestContext;
            expect(thumbnailsHandler.get(mockedContext).body).toBe(BAD_REQUEST);
        });
        it('returns NOT_FOUND when no thumbnails file found', () => {
            const videoCollection = useVideoCollection();
            const mockedGet = jest.spyOn(videoCollection, 'get');
            mockedGet.mockReturnValue({
                id: 0,
                values: {
                    path: '/dummy/dummy.mp4',
                },
            });
            const mockedContext = {
                params: {
                    key: 'key',
                    minute: 0,
                } as RequestParams,
            } as RequestContext;
            expect(thumbnailsHandler.get(mockedContext).body).toBe(NOT_FOUND);
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
            const thumbnailsManager = useThumbnailsManager();
            const mockedGetThumbnails = jest.spyOn(thumbnailsManager, 'get');
            mockedGetThumbnails.mockReturnValue('/dummy/thumbnails_001.jpg');
            const mockedContext = {
                params: {
                    key: 'key',
                    minute: 0,
                } as RequestParams,
            } as RequestContext;
            expect(thumbnailsHandler.get(mockedContext)).toStrictEqual({
                maxAge: 86400,
                body: {
                    path: '/dummy/thumbnails_001.jpg',
                },
            });
        });
    });
    afterAll(() => {
        stopWorkers();
    });
});
