import { join } from 'path';
import { RequestHandler, RequestMethod } from '../types';
import { useSnapshotManager } from '../videos/SnapshotManager';
import { isBadRequest, validateAndGetVideo } from './DetailsHandler';

const NO_SNAPSHOT_FILE = join('images', 'no-snapshot.png');

export const snapshotHandler: RequestHandler & { get: RequestMethod } = {
    path: '/snapshot',
    get: ({ params }) => {
        const video = validateAndGetVideo(params);
        if (isBadRequest(video)) {
            return video;
        }
        const snapshotManager = useSnapshotManager();
        const path = video.path as string;
        const snapshotPath = snapshotManager.get(path);
        if (!snapshotPath) {
            return join(process.cwd(), NO_SNAPSHOT_FILE);
        }
        return snapshotPath;
    },
};
