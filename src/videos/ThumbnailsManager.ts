import { existsSync } from 'fs';
import { join } from 'path';
import { isRequiredVideoMeta } from '../types';
import { parsePath } from '../utils/PathUtils';
import { THUMBNAILS_NAME } from './FFmpeg';
import FFmpegWorker, { ConsumeParams } from './FFmpegWorker';
import { useMetaManager } from './MetaManager';

const getThumbnailsFile = (metaDir: string): string => {
    return join(metaDir, THUMBNAILS_NAME);
};

type ThumbnailsStatus = 'PROCESSING';

class ThumbnailsManager extends FFmpegWorker {
    private statuses = new Map<string, ThumbnailsStatus>();

    constructor(ffmpeg?: string) {
        super(ffmpeg);
    }

    async consume({ path, metaDir }: ConsumeParams): Promise<void> {
        const status = this.statuses.get(path);
        if (status === 'PROCESSING') {
            return;
        }
        const thumbnailsFile = getThumbnailsFile(metaDir);
        if (existsSync(thumbnailsFile)) {
            return;
        }
        const metaManager = useMetaManager();
        const meta = await metaManager.get(path);
        if (!isRequiredVideoMeta(meta)) {
            return;
        }
        this.statuses.set(path, 'PROCESSING');
        await this.ffmpeg.createThumbnails(path, meta);
        this.statuses.delete(path);
    }

    /**
     * Returns thumbnails path if thumbnails file exists.
     * Otherwize returns empty string but enqueue data processing job
     */
    public get(path: string, enqueueIfNoThumbnails = true): string {
        const { metaDir } = parsePath(path);
        const thumbnailsFile = getThumbnailsFile(metaDir);
        if (existsSync(thumbnailsFile)) {
            return thumbnailsFile;
        }
        if (enqueueIfNoThumbnails) {
            this.enqueue({ path });
            this.check();
        }
        return '';
    }
}

let instance: ThumbnailsManager;

export const initialize = (ffmpeg?: string): void => {
    instance = new ThumbnailsManager(ffmpeg);
};

export const reinstantiate = (ffmpeg?: string): void => {
    if (instance === undefined) {
        throw new Error('ThumbnailsManager is not initialized');
    }
    const current = instance;
    current.stopMonitoring();
    const currentQueue = current.getQueue();
    instance = new ThumbnailsManager(ffmpeg);
    currentQueue.forEach((request) => instance.enqueue(request));
};

export const useThumbnailsManager = (): ThumbnailsManager => {
    if (instance === undefined) {
        throw new Error('ThumbnailsManager is not initialized');
    }
    return instance;
};
