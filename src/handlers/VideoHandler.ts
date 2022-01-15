import { RequestHandler, RequestMethod } from '../types';
import { validateAndGetVideo } from '../utils/ServerRequestUtils';
import { isErrorResponse } from '../utils/ServerResponseUtils';

export const videoHandler: RequestHandler & { get: RequestMethod } = {
    path: '/video',
    get: ({ params }) => {
        const video = validateAndGetVideo(params);
        if (isErrorResponse(video)) {
            return video;
        }
        return video.path as string;
    },
};
