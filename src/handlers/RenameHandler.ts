import { dirname, join } from 'path';
import { RequestHandler, RequestMethod } from '../types';
import { validateAndGetVideo } from '../utils/ServerRequestUtils';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, isErrorResponse } from '../utils/ServerResponseUtils';
import { useStorageManager } from '../videos/StorageManager';
import { useVideoCollection } from '../videos/VideoCollection';

export const renameHandler: RequestHandler & { post: RequestMethod } = {
    path: '/rename',
    post: ({ params }) => {
        const video = validateAndGetVideo(params);
        if (isErrorResponse(video)) {
            return { body: video };
        }
        if (!params || !params.name) {
            return { body: BAD_REQUEST };
        }
        const storageManager = useStorageManager();
        const videoCollection = useVideoCollection();
        const name = params.name as string;
        const srcPath = video.path as string;
        const destPath = join(dirname(srcPath), name);
        storageManager.rename(srcPath, destPath);

        const results = Array.from(videoCollection.find({ path: destPath }));
        if (results.length === 0) {
            return { body: INTERNAL_SERVER_ERROR };
        }
        return { body: results[0].values };
    },
};
