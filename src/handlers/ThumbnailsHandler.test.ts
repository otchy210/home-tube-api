import { RequestContext, RequestParams } from '../types';
import { BAD_REQUEST, NOT_FOUND } from '../utils/ServerResponseUtils';
import { thumbnailsHandler } from './ThumbnailsHandler';
import { initializeWorkers, stopWorkers } from '../videos/FFmpegWorkersManager';
import { useThumbnailsManager } from '../videos/ThumbnailsManager';
import { useVideoCollection } from '../videos/VideoCollection';

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
            expect(thumbnailsHandler.get(mockedContext)).toBe(BAD_REQUEST);
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
            expect(thumbnailsHandler.get(mockedContext)).toBe(NOT_FOUND);
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
            expect(thumbnailsHandler.get(mockedContext)).toBe('/dummy/thumbnails_001.jpg');
        });
    });
    afterAll(() => {
        stopWorkers();
    });
});
