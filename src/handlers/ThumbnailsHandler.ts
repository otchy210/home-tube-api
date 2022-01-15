import { RequestHandler, RequestMethod, RequestParams } from '../types';
import { validateAndGetVideo } from '../utils/ServerRequestUtils';
import { BAD_REQUEST, isErrorResponse, NOT_FOUND } from '../utils/ServerResponseUtils';
import { useThumbnailsManager } from '../videos/ThumbnailsManager';

export const thumbnailsHandler: RequestHandler & { get: RequestMethod } = {
    path: '/thumbnails',
    get: ({ params }) => {
        const video = validateAndGetVideo(params);
        if (isErrorResponse(video)) {
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
