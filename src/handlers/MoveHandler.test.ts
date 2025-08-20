import { RequestContext, RequestParams } from '../types';
import * as sru from '../utils/ServerRequestUtils';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../utils/ServerResponseUtils';
import { useStorageManager } from '../videos/StorageManager';
import { useVideoCollection } from '../videos/VideoCollection';
import { moveHandler } from './MoveHandler';

describe('moveHandler', () => {
    const storageManager = useStorageManager();
    const videoCollection = useVideoCollection();

    it('returns BAD_REQUEST when validation fails', () => {
        jest.spyOn(sru, 'validateAndGetVideo').mockReturnValue(BAD_REQUEST);
        const mockedContext = { params: {} as RequestParams } as RequestContext;
        expect(moveHandler.post(mockedContext).body).toBe(BAD_REQUEST);
    });

    it('returns BAD_REQUEST when dest is missing', () => {
        jest.spyOn(sru, 'validateAndGetVideo').mockReturnValue({ path: 'test.mp4' });
        const mockedContext = { params: { id: 1 } as RequestParams } as RequestContext;
        expect(moveHandler.post(mockedContext).body).toBe(BAD_REQUEST);
    });

    it('returns INTERNAL_SERVER_ERROR when move fails to update', () => {
        jest.spyOn(sru, 'validateAndGetVideo').mockReturnValue({ path: 'src.mp4' });
        jest.spyOn(storageManager, 'move').mockReturnValue(undefined as unknown as Promise<void>);
        jest.spyOn(videoCollection, 'find').mockReturnValue(new Set());
        const mockedContext = { params: { dest: 'destDir' } as RequestParams } as RequestContext;
        expect(moveHandler.post(mockedContext).body).toBe(INTERNAL_SERVER_ERROR);
    });

    it('returns moved video values when success', () => {
        jest.spyOn(sru, 'validateAndGetVideo').mockReturnValue({ path: 'src.mp4' });
        const moveSpy = jest.spyOn(storageManager, 'move').mockResolvedValue();
        const resultVideo = { id: 1, values: { path: 'destDir/src.mp4' } };
        jest.spyOn(videoCollection, 'find').mockReturnValue(new Set([resultVideo]));
        const mockedContext = { params: { dest: 'destDir' } as RequestParams } as RequestContext;
        expect(moveHandler.post(mockedContext).body).toBe(resultVideo.values);
        expect(moveSpy).toBeCalledWith('src.mp4', 'destDir/src.mp4');
    });
});
