import { Values } from '@otchy/sim-doc-db/dist/types';
import { ErrorResponse, Json, RequestHandler, RequestMethod, RequestParams } from '../types';
import logger from '../utils/logger';
import { BAD_REQUEST } from '../utils/ServerResponseUtils';
import { usePropertiesManager } from '../videos/PropertiesManager';
import { useVideoCollection } from '../videos/VideoCollection';

export const validateAndGetVideo = (params: RequestParams | undefined): Values | ErrorResponse => {
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
    return video.values;
};

export const isBadRequest = (video: Values | ErrorResponse): video is ErrorResponse => {
    return video === BAD_REQUEST;
};

export const videoHandler: RequestHandler & { get: RequestMethod } = {
    path: '/video',
    get: ({ params }) => {
        const video = validateAndGetVideo(params);
        if (isBadRequest(video)) {
            return video;
        }
        const propertiesManager = usePropertiesManager();
        const properties = propertiesManager.get(video.path as string);
        // TODO: add all meta data
        return { ...video, ...properties } as Json;
    },
};
