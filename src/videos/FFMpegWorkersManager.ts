import { initialize as initializeMataManager, reinstantiate as reinstantiateMetaManager, useMetaManager } from './MetaManager';
import { initialize as initializeThumbnailsManager, reinstantiate as reinstantiateThumbnailsManager, useThumbnailsManager } from './ThumbnailsManager';
import { initialize as initializeSnapshotManager, reinstantiate as reinstantiateSnapshotManager, useSnapshotManager } from './SnapshotManager';

export const initializeWorkers = (ffmpeg?: string): void => {
    initializeMataManager(ffmpeg);
    initializeThumbnailsManager(ffmpeg);
    initializeSnapshotManager(ffmpeg);
};

export const reinstantiateWorkers = (ffmpeg?: string): void => {
    reinstantiateMetaManager(ffmpeg);
    reinstantiateThumbnailsManager(ffmpeg);
    reinstantiateSnapshotManager(ffmpeg);
};

export const stopWorkers = (): void => {
    useMetaManager().stopMonitoring();
    useThumbnailsManager().stopMonitoring();
    useSnapshotManager().stopMonitoring();
};
