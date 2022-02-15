import { join } from 'path';
import { RequestHandler, RequestMethod, StaticFileResponse } from '../types';
import { validateAndGetVideo } from '../utils/ServerRequestUtils';
import { BAD_REQUEST, isErrorResponse } from '../utils/ServerResponseUtils';
import { useSnapshotManager } from '../videos/SnapshotManager';

const NO_SNAPSHOT_FILE = join('images', 'no-snapshot.png');

export const snapshotHandler: RequestHandler & { get: RequestMethod; post: RequestMethod } = {
    path: '/snapshot',
    get: ({ params }) => {
        const video = validateAndGetVideo(params);
        if (isErrorResponse(video)) {
            return { body: video };
        }
        const snapshotManager = useSnapshotManager();
        const path = video.path as string;
        const snapshotPath = snapshotManager.get(path);
        if (!snapshotPath) {
            const noSnapshotPath = join(process.cwd(), NO_SNAPSHOT_FILE);
            const response: StaticFileResponse = {
                path: noSnapshotPath,
            };
            return { body: response, maxAge: 60 };
        }
        const response: StaticFileResponse = {
            path: snapshotPath,
        };
        return { body: response, maxAge: 60 * 10 };
    },
    post: ({ params, body }) => {
        if (!body) {
            return { body: BAD_REQUEST };
        }
        const video = validateAndGetVideo(params);
        if (isErrorResponse(video)) {
            return { body: video };
        }
        const snapshotManager = useSnapshotManager();
        const path = video.path as string;
        const dataURL = (body as { dataURL: string }).dataURL;
        snapshotManager.update(path, dataURL);
        return { body: true };
    },
};
