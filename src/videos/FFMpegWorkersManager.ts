import { initialize as initializeMataManager, reinstantiate as reinstantiateMetaManager, useMetaManager } from './MetaManager';
import { initialize as initializeThumbnailsManager, reinstantiate as reinstantiateThumbnailsManager, useThumbnailsManager } from './ThumbnailsManager';

export const initializeWorkers = (ffmpeg?: string): void => {
    initializeMataManager(ffmpeg);
    initializeThumbnailsManager(ffmpeg);
};

export const reinstantiateWorkers = (ffmpeg?: string): void => {
    reinstantiateMetaManager(ffmpeg);
    reinstantiateThumbnailsManager(ffmpeg);
};

export const stopWorkers = (): void => {
    useMetaManager().stopMonitoring();
    useThumbnailsManager().stopMonitoring();
};
