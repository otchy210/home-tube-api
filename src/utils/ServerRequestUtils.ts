import { Values } from '@otchy/sim-doc-db/dist/types';
import { ErrorResponse, RequestParams } from '../types';
import logger from '../utils/logger';
import { BAD_REQUEST } from '../utils/ServerResponseUtils';
import { useVideoCollection } from '../videos/VideoCollection';

export const validateAndGetVideo = (params: RequestParams | undefined): Values | ErrorResponse => {
    if (!params) {
        return BAD_REQUEST;
    }
    const { key } = params;
    if (typeof key !== 'string') {
        return BAD_REQUEST;
    }
    const videoCollection = useVideoCollection();
    let video;
    try {
        video = videoCollection.get(key);
    } catch (e) {
        logger.info(`Video not found: ${key}`);
        return BAD_REQUEST;
    }
    return video.values;
};
