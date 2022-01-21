import { join } from 'path';
import { RequestHandler, RequestMethod, StaticFileResponse } from '../types';
import { validateAndGetVideo } from '../utils/ServerRequestUtils';
import { isErrorResponse } from '../utils/ServerResponseUtils';
import { useSnapshotManager } from '../videos/SnapshotManager';

const NO_SNAPSHOT_FILE = join('images', 'no-snapshot.png');

export const snapshotHandler: RequestHandler & { get: RequestMethod } = {
    path: '/snapshot',
    get: ({ params }) => {
        const video = validateAndGetVideo(params);
        if (isErrorResponse(video)) {
            return video;
        }
        const snapshotManager = useSnapshotManager();
        const path = video.path as string;
        const snapshotPath = snapshotManager.get(path);
        if (!snapshotPath) {
            return join(process.cwd(), NO_SNAPSHOT_FILE);
        }
        const response: StaticFileResponse = {
            path: snapshotPath,
            maxAge: 60 * 10,
        };
        return response;
    },
};
