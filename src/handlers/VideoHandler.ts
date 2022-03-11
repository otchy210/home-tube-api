import { existsSync } from 'fs';
import { join } from 'path';
import { CONVERTED_MP4 } from '../const';
import { RequestHandler, RequestMethod, StaticFileResponse } from '../types';
import { parsePath } from '../utils/PathUtils';
import { validateAndGetVideo } from '../utils/ServerRequestUtils';
import { isErrorResponse } from '../utils/ServerResponseUtils';

export const videoHandler: RequestHandler & { get: RequestMethod } = {
    path: '/video',
    get: ({ params }) => {
        const video = validateAndGetVideo(params);
        if (isErrorResponse(video)) {
            return { body: video };
        }
        const videoPath = video.path as string;
        const { metaDir } = parsePath(videoPath);
        const convertedMp4Path = join(metaDir, CONVERTED_MP4);
        const path = existsSync(convertedMp4Path) ? convertedMp4Path : videoPath;
        const response: StaticFileResponse = {
            path,
        };
        return { body: response };
    },
};
