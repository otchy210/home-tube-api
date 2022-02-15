import { RequestHandler, RequestMethod, ServerStatus } from '../types';
import { useMetaManager } from '../videos/MetaManager';
import { useSnapshotManager } from '../videos/SnapshotManager';
import { useStorageManager } from '../videos/StorageManager';
import { useThumbnailsManager } from '../videos/ThumbnailsManager';
import { useVideoCollection } from '../videos/VideoCollection';

export const serverStatusHandler: RequestHandler & { get: RequestMethod } = {
    path: '/serverStatus',
    get: () => {
        const storageManager = useStorageManager();
        const collection = useVideoCollection();
        const metaManager = useMetaManager();
        const thumbnailsManager = useThumbnailsManager();
        const snapshotManager = useSnapshotManager();

        const status: ServerStatus = {
            storages: storageManager.getStatus(),
            indexedVideo: collection.size(),
            meta: metaManager.getStatus(),
            thumbnails: thumbnailsManager.getStatus(),
            snapshot: snapshotManager.getStatus(),
        };
        return { body: status };
    },
};
