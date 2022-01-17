import { AppConfig, RequestHandler, RequestMethod } from '../types';
import { FFmpegWoekerStatus } from '../videos/FFmpegWorker';
import { useMetaManager } from '../videos/MetaManager';
import { useSnapshotManager } from '../videos/SnapshotManager';
import { useThumbnailsManager } from '../videos/ThumbnailsManager';
import { useVideoCollection } from '../videos/VideoCollection';

type ServerStatus = {
    video: {
        size: number;
    };
    meta: FFmpegWoekerStatus;
    thumbnails: FFmpegWoekerStatus;
    snapshot: FFmpegWoekerStatus;
};

export const serverStatusHandler: RequestHandler & { get: RequestMethod } = {
    path: '/serverStatus',
    get: () => {
        const collection = useVideoCollection();
        const metaManager = useMetaManager();
        const thumbnailsManager = useThumbnailsManager();
        const snapshotManager = useSnapshotManager();

        const status: ServerStatus = {
            video: {
                size: collection.size(),
            },
            meta: metaManager.getStatus(),
            thumbnails: thumbnailsManager.getStatus(),
            snapshot: snapshotManager.getStatus(),
        };
        return status;
    },
};
