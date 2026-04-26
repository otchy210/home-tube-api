import { AnyRequestHandler, Json, RequestContext, RequestHandlerResponse, RequestParams } from '../types';
import logger from '../utils/logger';
import { validateAndGetVideo } from '../utils/ServerRequestUtils';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, isErrorResponse } from '../utils/ServerResponseUtils';
import { useStorageManager } from '../videos/StorageManager';
import { useVideoCollection } from '../videos/VideoCollection';

type StorageOperation = 'move' | 'rename';

type VideoPathUpdateOptions = {
    operation: StorageOperation;
    buildDestPath: (srcPath: string, params: RequestParams) => string | undefined;
};

export const handleVideoPathUpdate = async ({ params }: RequestContext, options: VideoPathUpdateOptions): Promise<RequestHandlerResponse> => {
    const video = validateAndGetVideo(params);
    if (isErrorResponse(video)) {
        return { body: video };
    }
    if (!params) {
        return { body: BAD_REQUEST };
    }

    const storageManager = useStorageManager();
    const videoCollection = useVideoCollection();
    const srcPath = video.path as string;
    const destPath = options.buildDestPath(srcPath, params);
    if (!destPath) {
        return { body: BAD_REQUEST };
    }

    try {
        await storageManager[options.operation](srcPath, destPath);
    } catch (error) {
        const storageError = error as Error & { code?: string };
        if (storageError.code === 'EEXIST') {
            logger.warn(`skip ${options.operation}: ${storageError.message}`);
            return { body: video as Json };
        }
        throw error;
    }

    const results = Array.from(videoCollection.find({ path: destPath }));
    if (results.length === 0) {
        return { body: INTERNAL_SERVER_ERROR };
    }
    return { body: results[0].values };
};

export type VideoPathUpdateHandler = AnyRequestHandler & {
    post: (context: RequestContext) => Promise<RequestHandlerResponse>;
};
