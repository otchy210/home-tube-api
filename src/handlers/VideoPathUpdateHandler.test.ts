import { RequestContext, RequestParams } from '../types';
import * as sru from '../utils/ServerRequestUtils';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../utils/ServerResponseUtils';
import { useStorageManager } from '../videos/StorageManager';
import { useVideoCollection } from '../videos/VideoCollection';
import { handleVideoPathUpdate } from './VideoPathUpdateHandler';

describe('handleVideoPathUpdate', () => {
    const storageManager = useStorageManager();
    const videoCollection = useVideoCollection();
    const buildDestPath = jest.fn();

    beforeEach(() => {
        jest.restoreAllMocks();
        buildDestPath.mockReset();
    });

    it('returns BAD_REQUEST when validation fails', async () => {
        jest.spyOn(sru, 'validateAndGetVideo').mockReturnValue(BAD_REQUEST);
        const mockedContext = { params: {} as RequestParams } as RequestContext;

        await expect(
            handleVideoPathUpdate(mockedContext, {
                operation: 'move',
                buildDestPath,
            })
        ).resolves.toStrictEqual({ body: BAD_REQUEST });
        expect(buildDestPath).not.toBeCalled();
    });

    it('returns BAD_REQUEST when params are missing', async () => {
        jest.spyOn(sru, 'validateAndGetVideo').mockReturnValue({ path: 'src.mp4' });
        const mockedContext = {} as RequestContext;

        await expect(
            handleVideoPathUpdate(mockedContext, {
                operation: 'move',
                buildDestPath,
            })
        ).resolves.toStrictEqual({ body: BAD_REQUEST });
        expect(buildDestPath).not.toBeCalled();
    });

    it('returns BAD_REQUEST when destPath cannot be built', async () => {
        jest.spyOn(sru, 'validateAndGetVideo').mockReturnValue({ path: 'src.mp4' });
        buildDestPath.mockReturnValue(undefined);
        const mockedContext = { params: { dest: 1 } as RequestParams } as RequestContext;

        await expect(
            handleVideoPathUpdate(mockedContext, {
                operation: 'move',
                buildDestPath,
            })
        ).resolves.toStrictEqual({ body: BAD_REQUEST });
        expect(buildDestPath).toBeCalledWith('src.mp4', mockedContext.params);
    });

    it('returns INTERNAL_SERVER_ERROR when operation succeeds but collection is not updated', async () => {
        jest.spyOn(sru, 'validateAndGetVideo').mockReturnValue({ path: 'src.mp4' });
        jest.spyOn(storageManager, 'move').mockResolvedValue();
        jest.spyOn(videoCollection, 'find').mockReturnValue(new Set());
        buildDestPath.mockReturnValue('destDir/src.mp4');
        const mockedContext = { params: { dest: 'destDir' } as RequestParams } as RequestContext;

        await expect(
            handleVideoPathUpdate(mockedContext, {
                operation: 'move',
                buildDestPath,
            })
        ).resolves.toStrictEqual({ body: INTERNAL_SERVER_ERROR });
    });

    it.each(['move' as const, 'rename' as const])('returns updated video values when %s succeeds', async (operation) => {
        jest.spyOn(sru, 'validateAndGetVideo').mockReturnValue({ path: 'src.mp4' });
        const operationSpy = jest.spyOn(storageManager, operation).mockResolvedValue();
        const resultVideo = { id: 1, values: { path: 'destDir/src.mp4' } };
        jest.spyOn(videoCollection, 'find').mockReturnValue(new Set([resultVideo]));
        buildDestPath.mockReturnValue('destDir/src.mp4');
        const mockedContext = { params: { dest: 'destDir' } as RequestParams } as RequestContext;

        await expect(
            handleVideoPathUpdate(mockedContext, {
                operation,
                buildDestPath,
            })
        ).resolves.toStrictEqual({ body: resultVideo.values });
        expect(operationSpy).toBeCalledWith('src.mp4', 'destDir/src.mp4');
    });

    it('returns original video values when destination exists', async () => {
        const video = { path: 'src.mp4' };
        const error = new Error('destDir/src.mp4 exists already') as Error & { code: string };
        error.code = 'EEXIST';
        jest.spyOn(sru, 'validateAndGetVideo').mockReturnValue(video);
        jest.spyOn(storageManager, 'move').mockRejectedValue(error);
        buildDestPath.mockReturnValue('destDir/src.mp4');
        const mockedContext = { params: { dest: 'destDir' } as RequestParams } as RequestContext;

        await expect(
            handleVideoPathUpdate(mockedContext, {
                operation: 'move',
                buildDestPath,
            })
        ).resolves.toStrictEqual({ body: video });
    });

    it('rejects when operation fails with an unexpected error', async () => {
        const error = new Error('unexpected');
        jest.spyOn(sru, 'validateAndGetVideo').mockReturnValue({ path: 'src.mp4' });
        jest.spyOn(storageManager, 'move').mockRejectedValue(error);
        buildDestPath.mockReturnValue('destDir/src.mp4');
        const mockedContext = { params: { dest: 'destDir' } as RequestParams } as RequestContext;

        await expect(
            handleVideoPathUpdate(mockedContext, {
                operation: 'move',
                buildDestPath,
            })
        ).rejects.toBe(error);
    });
});
