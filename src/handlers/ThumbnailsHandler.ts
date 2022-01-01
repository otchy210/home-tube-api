import { RequestHandler, RequestParams } from '../types';
import { BAD_REQUEST, NOT_FOUND } from '../utils/ServerResponseUtils';
import { useThumbnailsManager } from '../videos/ThumbnailsManager';
import { isBadRequest, validateAndGetVideo } from './VideoHandler';

export const thumbnailsHandler: RequestHandler = {
    path: '/thumbnails',
    get: ({ params }) => {
        const video = validateAndGetVideo(params);
        if (isBadRequest(video)) {
            return video;
        }
        const { minute } = params as RequestParams;
        if (typeof minute !== 'number') {
            return BAD_REQUEST;
        }
        const thumbnailsManager = useThumbnailsManager();
        const videoPath = video.path as string;
        const thumbnailsPath = thumbnailsManager.get(videoPath, minute);
        if (!thumbnailsPath) {
            return NOT_FOUND;
        }
        return thumbnailsPath;
    },
};
