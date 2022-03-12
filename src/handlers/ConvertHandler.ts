import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { CONVERTED_MP4 } from '../const';
import { RequestHandler, RequestMethod, RequestParams } from '../types';
import { parsePath } from '../utils/PathUtils';
import { validateAndGetVideo } from '../utils/ServerRequestUtils';
import { BAD_REQUEST, isErrorResponse } from '../utils/ServerResponseUtils';
import { useMp4Manager } from '../videos/Mp4Manager';
import { usePropertiesManager } from '../videos/PropertiesManager';

export const convertHandler: RequestHandler & { post: RequestMethod; delete: RequestMethod } = {
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
    delete: ({ params }) => {
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
        const propertiesManager = usePropertiesManager();
        const properties = propertiesManager.get(path);
        const status = properties.mp4 ?? 'unavailable';
        if (status !== 'available') {
            return { body: { status } };
        }

        const { metaDir } = parsePath(path);
        const convertedMp4Path = join(metaDir, CONVERTED_MP4);
        if (existsSync(convertedMp4Path)) {
            rmSync(convertedMp4Path);
        }
        properties.mp4 = 'unavailable';
        propertiesManager.update(path, properties);
        return { body: { status: 'unavailable' } };
    },
};
