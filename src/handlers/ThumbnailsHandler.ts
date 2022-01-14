import { RequestHandler, RequestMethod, RequestParams } from '../types';
import { BAD_REQUEST, NOT_FOUND } from '../utils/ServerResponseUtils';
import { useThumbnailsManager } from '../videos/ThumbnailsManager';
import { isBadRequest, validateAndGetVideo } from './VideoHandler';

export const thumbnailsHandler: RequestHandler & { get: RequestMethod } = {
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
        const path = video.path as string;
        const thumbnailsPath = thumbnailsManager.get(path, minute);
        if (!thumbnailsPath) {
            return NOT_FOUND;
        }
        return thumbnailsPath;
    },
};
