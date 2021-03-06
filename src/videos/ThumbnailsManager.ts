import { existsSync } from 'fs';
import { join } from 'path';
import { parsePath } from '../utils/PathUtils';
import { getThumbnailsName } from './FFmpeg';
import FFmpegWorker, { ConsumeParams } from './FFmpegWorker';
import { useMetaManager } from './MetaManager';

const getThumbnailsPath = (metaDir: string, minute: number): string => {
    return join(metaDir, getThumbnailsName(minute));
};

class ThumbnailsManager extends FFmpegWorker {
    constructor(ffmpeg?: string) {
        super(ffmpeg);
    }

    async consume({ path, metaDir }: ConsumeParams): Promise<void> {
        const metaManager = useMetaManager();
        const meta = metaManager.getRequiredMeta(path);
        if (!meta) {
            return;
        }
        const minutes = Math.ceil(meta.length / 60);
        let existsAll = true;
        for (let minute = 0; minute < minutes; minute++) {
            const thumbnailsPath = getThumbnailsPath(metaDir, minute);
            if (!existsSync(thumbnailsPath)) {
                existsAll = false;
                break;
            }
        }
        if (existsAll) {
            return;
        }
        await this.ffmpeg.createThumbnails(path, meta);
    }

    /**
     * Returns thumbnails path if thumbnails file exists.
     * Otherwize returns empty string but enqueue data processing job (when minute === 0)
     */
    public get(path: string, minute: number, enqueueIfNoFile = true): string {
        const { metaDir } = parsePath(path);
        const thumbnailsPath = getThumbnailsPath(metaDir, minute);
        if (existsSync(thumbnailsPath)) {
            return thumbnailsPath;
        }
        if (minute === 0 && enqueueIfNoFile) {
            this.enqueue({ path });
        }
        return '';
    }
}

let instance: ThumbnailsManager;

export const initialize = (ffmpeg?: string): void => {
    instance = new ThumbnailsManager(ffmpeg);
};

export const useThumbnailsManager = (): ThumbnailsManager => {
    if (instance === undefined) {
        throw new Error('ThumbnailsManager is not initialized');
    }
    return instance;
};

export const reinstantiate = (ffmpeg?: string): void => {
    const current = useThumbnailsManager();
    current.stopMonitoring();
    const currentQueue = current.getQueue();
    instance = new ThumbnailsManager(ffmpeg);
    currentQueue.forEach((request) => instance.enqueue(request));
};
