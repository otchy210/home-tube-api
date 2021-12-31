import { RequestHandler } from '../types';
import logger from '../utils/logger';
import { BAD_REQUEST, NOT_FOUND } from '../utils/ServerResponseUtils';
import { useThumbnailsManager } from '../videos/ThumbnailsManager';
import VideoCollection from '../videos/VideoCollection';

export const thumbnailsHandler: RequestHandler = {
    path: '/thumbnails',
    get: ({ params }) => {
        if (!params) {
            return BAD_REQUEST;
        }
        const { id, minute } = params;
        if (typeof id !== 'number' || typeof minute !== 'number') {
            return BAD_REQUEST;
        }
        let video;
        try {
            video = VideoCollection.get(id);
        } catch (e) {
            logger.info(`Video not found: ${id}`);
            return BAD_REQUEST;
        }
        const thumbnailsManager = useThumbnailsManager();
        const videoPath = video.values.path as string;
        const thumbnailsPath = thumbnailsManager.get(videoPath, minute);
        if (!thumbnailsPath) {
            return NOT_FOUND;
        }
        return thumbnailsPath;
    },
};
