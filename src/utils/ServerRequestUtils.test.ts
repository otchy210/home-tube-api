import { RequestParams } from '../types';
import { useVideoCollection } from '../videos/VideoCollection';
import { validateAndGetVideo } from './ServerRequestUtils';
import { BAD_REQUEST } from './ServerResponseUtils';

describe('validateAndGetVideo', () => {
    it('returns BAD_REQUEST when no params', () => {
        expect(validateAndGetVideo(undefined)).toBe(BAD_REQUEST);
    });
    it('returns BAD_REQUEST when param id is not number', () => {
        const mockedParams = {
            id: 'string',
            minute: 0,
        } as RequestParams;
        expect(validateAndGetVideo(mockedParams)).toBe(BAD_REQUEST);
    });
    it('returns BAD_REQUEST when no video found', () => {
        const mockedParams = {
            id: 1,
            minute: 0,
        } as RequestParams;
        expect(validateAndGetVideo(mockedParams)).toBe(BAD_REQUEST);
    });
    it('returns video properly', () => {
        const mockedParams = {
            key: 'key',
            minute: 0,
        } as RequestParams;
        const videoCollection = useVideoCollection();
        jest.spyOn(videoCollection, 'get').mockReturnValue({ id: 1, values: { path: 'test/storage1/test-movie.mp4' } });
        expect(validateAndGetVideo(mockedParams)).toEqual({ path: 'test/storage1/test-movie.mp4' });
    });
});
