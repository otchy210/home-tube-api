import { RequestContext, RequestParams } from '../types';
import { BAD_REQUEST, NOT_FOUND } from '../utils/ServerResponseUtils';
import { thumbnailsHandler } from './ThumbnailsHandler';
import VideoCollection from '../videos/VideoCollection';
import { initializeWorkers, stopWorkers } from '../videos/FFmpegWorkersManager';
import { useThumbnailsManager } from '../videos/ThumbnailsManager';

describe('ThumbnailsHandler', () => {
    beforeAll(() => {
        initializeWorkers();
    });
    describe('get', () => {
        it('returns BAD_REQUEST when no params', () => {
            if (!thumbnailsHandler.get) {
                fail();
            }
            const mockedContext = {} as RequestContext;
            expect(thumbnailsHandler.get(mockedContext)).toBe(BAD_REQUEST);
        });
        it('returns BAD_REQUEST when param id is not number', () => {
            if (!thumbnailsHandler.get) {
                fail();
            }
            const mockedContext = {
                params: {
                    id: 'string',
                    minute: 0,
                } as RequestParams,
            } as RequestContext;
            expect(thumbnailsHandler.get(mockedContext)).toBe(BAD_REQUEST);
        });
        it('returns BAD_REQUEST when param minute is not number', () => {
            if (!thumbnailsHandler.get) {
                fail();
            }
            const mockedContext = {
                params: {
                    id: 1,
                    minute: 'string',
                } as RequestParams,
            } as RequestContext;
            expect(thumbnailsHandler.get(mockedContext)).toBe(BAD_REQUEST);
        });
        it('returns BAD_REQUEST when no video found', () => {
            if (!thumbnailsHandler.get) {
                fail();
            }
            const mockedContext = {
                params: {
                    id: 1,
                    minute: 0,
                } as RequestParams,
            } as RequestContext;
            expect(thumbnailsHandler.get(mockedContext)).toBe(BAD_REQUEST);
        });
        it('returns NOT_FOUND when no thumbnails file found', () => {
            if (!thumbnailsHandler.get) {
                fail();
            }
            const mockedGet = jest.spyOn(VideoCollection, 'get');
            mockedGet.mockReturnValue({
                id: 0,
                values: {
                    path: '/dummy/dummy.mp4',
                },
            });
            const mockedContext = {
                params: {
                    id: 1,
                    minute: 0,
                } as RequestParams,
            } as RequestContext;
            expect(thumbnailsHandler.get(mockedContext)).toBe(NOT_FOUND);
        });
        it('returns thumbnails path when thumbnails file found', () => {
            if (!thumbnailsHandler.get) {
                fail();
            }
            const mockedGetVideo = jest.spyOn(VideoCollection, 'get');
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
                    id: 1,
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
