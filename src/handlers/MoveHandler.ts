import { basename, join } from 'path';
import { RequestHandler, RequestMethod } from '../types';
import { validateAndGetVideo } from '../utils/ServerRequestUtils';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, isErrorResponse } from '../utils/ServerResponseUtils';
import { useStorageManager } from '../videos/StorageManager';
import { useVideoCollection } from '../videos/VideoCollection';

export const moveHandler: RequestHandler & { post: RequestMethod } = {
    path: '/move',
    post: ({ params }) => {
        const video = validateAndGetVideo(params);
        if (isErrorResponse(video)) {
            return { body: video };
        }
        if (!params || typeof params.dest !== 'string') {
            return { body: BAD_REQUEST };
        }
        const storageManager = useStorageManager();
        const videoCollection = useVideoCollection();
        const srcPath = video.path as string;
        const destDir = params.dest as string;
        const destPath = join(destDir, basename(srcPath));
        // move video file together with its metadata
        storageManager.move(srcPath, destPath);

        const results = Array.from(videoCollection.find({ path: destPath }));
        if (results.length === 0) {
            return { body: INTERNAL_SERVER_ERROR };
        }
        return { body: results[0].values };
    },
};
