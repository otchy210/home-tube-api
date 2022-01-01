import { RequestContext, RequestParams } from '../types';
import { BAD_REQUEST } from '../utils/ServerResponseUtils';
import { usePropertiesManager } from '../videos/PropertiesManager';
import { useVideoCollection } from '../videos/VideoCollection';
import * as root from './VideoHandler';

describe('validateAndGetVideo', () => {
    it('returns BAD_REQUEST when no params', () => {
        expect(root.validateAndGetVideo(undefined)).toBe(BAD_REQUEST);
    });
    it('returns BAD_REQUEST when param id is not number', () => {
        const mockedParams = {
            id: 'string',
            minute: 0,
        } as RequestParams;
        expect(root.validateAndGetVideo(mockedParams)).toBe(BAD_REQUEST);
    });
    it('returns BAD_REQUEST when no video found', () => {
        const mockedParams = {
            id: 1,
            minute: 0,
        } as RequestParams;
        expect(root.validateAndGetVideo(mockedParams)).toBe(BAD_REQUEST);
    });
    it('returns video properly', () => {
        const mockedParams = {
            id: 1,
            minute: 0,
        } as RequestParams;
        const videoCollection = useVideoCollection();
        jest.spyOn(videoCollection, 'get').mockReturnValue({ id: 1, values: { path: 'test/test-movie.mp4' } });
        expect(root.validateAndGetVideo(mockedParams)).toEqual({ path: 'test/test-movie.mp4' });
    });
});

describe('videoHandler', () => {
    describe('get', () => {
        it('returns BAD_REQUEST when validation fails', () => {
            if (!root.videoHandler.get) {
                fail();
            }
            const mockedContext = {} as RequestContext;
            expect(root.videoHandler.get(mockedContext)).toBe(BAD_REQUEST);
        });
        it('returns whole view of video properly', () => {
            if (!root.videoHandler.get) {
                fail();
            }
            jest.spyOn(root, 'validateAndGetVideo').mockReturnValue({
                path: 'test/test-movie.mp4',
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
            expect(root.videoHandler.get(mockedContext)).toStrictEqual({
                path: 'test/test-movie.mp4',
                stars: 5,
            });
        });
    });
});
