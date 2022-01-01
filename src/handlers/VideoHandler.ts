import { Document } from '@otchy/sim-doc-db/dist/types';
import { ErrorResponse, Json, RequestHandler, RequestParams } from '../types';
import logger from '../utils/logger';
import { BAD_REQUEST } from '../utils/ServerResponseUtils';
import { usePropertiesManager } from '../videos/PropertiesManager';
import { useVideoCollection } from '../videos/VideoCollection';

export const validateAndGetVideo = (params: RequestParams | undefined): Document | ErrorResponse => {
    if (!params) {
        return BAD_REQUEST;
    }
    const { id } = params;
    if (typeof id !== 'number') {
        return BAD_REQUEST;
    }
    const videoCollection = useVideoCollection();
    let video;
    try {
        video = videoCollection.get(id);
    } catch (e) {
        logger.info(`Video not found: ${id}`);
        return BAD_REQUEST;
    }
    return video;
};

export const isBadRequest = (video: Document | ErrorResponse): video is ErrorResponse => {
    return video === BAD_REQUEST;
};

export const videoHandler: RequestHandler = {
    path: '/video',
    get: ({ params }) => {
        const video = validateAndGetVideo(params);
        if (isBadRequest(video)) {
            return video;
        }
        const propertiesManager = usePropertiesManager();
        const properties = propertiesManager.get(video.values.path as string);
        return { id: video.id, values: { ...video.values, ...properties } } as Json;
    },
};