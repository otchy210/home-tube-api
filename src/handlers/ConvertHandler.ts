import { RequestHandler, RequestMethod, RequestParams } from '../types';
import { validateAndGetVideo } from '../utils/ServerRequestUtils';
import { BAD_REQUEST, isErrorResponse } from '../utils/ServerResponseUtils';
import { useMp4Manager } from '../videos/Mp4Manager';

export const convertHandler: RequestHandler & { post: RequestMethod } = {
    path: '/convert',
    post: ({ params }) => {
        const video = validateAndGetVideo(params);
        if (isErrorResponse(video)) {
            return { body: video };
        }
        const { type } = params as RequestParams;
        // support only mp4 for now
        if (type !== 'mp4') {
            return { body: BAD_REQUEST };
        }
        const path = video.path as string;
        const mp4Manager = useMp4Manager();
        const status = mp4Manager.enqueue({ path });
        return { body: { status } };
    },
};
