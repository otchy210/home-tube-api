import { initialize as initializeMataManager, reinstantiate as reinstantiateMetaManager, useMetaManager } from './MetaManager';
import { initialize as initializeMp4Manager, reinstantiate as reinstantiateMp4Manager, useMp4Manager } from './Mp4Manager';
import { initialize as initializeSnapshotManager, reinstantiate as reinstantiateSnapshotManager, useSnapshotManager } from './SnapshotManager';
import { initialize as initializeThumbnailsManager, reinstantiate as reinstantiateThumbnailsManager, useThumbnailsManager } from './ThumbnailsManager';

export const initializeWorkers = (ffmpeg?: string): void => {
    initializeMataManager(ffmpeg);
    initializeThumbnailsManager(ffmpeg);
    initializeSnapshotManager(ffmpeg);
    initializeMp4Manager(ffmpeg);
};

export const reinstantiateWorkers = (ffmpeg?: string): void => {
    reinstantiateMetaManager(ffmpeg);
    reinstantiateThumbnailsManager(ffmpeg);
    reinstantiateSnapshotManager(ffmpeg);
    reinstantiateMp4Manager(ffmpeg);
};

export const stopWorkers = (): void => {
    useMetaManager().stopMonitoring();
    useThumbnailsManager().stopMonitoring();
    useSnapshotManager().stopMonitoring();
    useMp4Manager().stopMonitoring();
};
