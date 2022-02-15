import { RequestHandler, RequestMethod, StaticFileResponse } from '../types';
import { validateAndGetVideo } from '../utils/ServerRequestUtils';
import { isErrorResponse } from '../utils/ServerResponseUtils';

export const videoHandler: RequestHandler & { get: RequestMethod } = {
    path: '/video',
    get: ({ params }) => {
        const video = validateAndGetVideo(params);
        if (isErrorResponse(video)) {
            return { body: video };
        }
        const response: StaticFileResponse = {
            path: video.path as string,
        };
        return { body: response };
    },
};
