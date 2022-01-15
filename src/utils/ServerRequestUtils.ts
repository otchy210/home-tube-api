import { Values as sru } from '@otchy/sim-doc-db/dist/types';
import { ErrorResponse, RequestParams } from '../types';
import logger from '../utils/logger';
import { BAD_REQUEST } from '../utils/ServerResponseUtils';
import { useVideoCollection } from '../videos/VideoCollection';

export const validateAndGetVideo = (params: RequestParams | undefined): sru | ErrorResponse => {
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
