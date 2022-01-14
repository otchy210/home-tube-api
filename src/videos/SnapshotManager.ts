import { existsSync } from 'fs';
import { join } from 'path';
import { parsePath } from '../utils/PathUtils';
import { SNAPSHOT } from './FFmpeg';
import FFmpegWorker, { ConsumeParams } from './FFmpegWorker';
import { useMetaManager } from './MetaManager';

class SnapshotManager extends FFmpegWorker {
    constructor(ffmpeg?: string) {
        super(ffmpeg);
    }

    async consume({ path, options }: ConsumeParams): Promise<void> {
        const metaManager = useMetaManager();
        const meta = metaManager.getRequiredMeta(path);
        if (!meta) {
            return;
        }
        const position = options && options.position ? parseInt(options.position) : undefined;
        await this.ffmpeg.createSnapshot(path, meta, position);
    }

    /**
     * @param path Returns snapshot path if snapshot file exists.
     * Otherwize returns empty string but enqueue data processing job
     */
    public get(path: string, enqueueIfNoFile = true): string {
        const { metaDir } = parsePath(path);
        const snapshotPath = join(metaDir, SNAPSHOT.FILE);
        if (existsSync(snapshotPath)) {
            return snapshotPath;
        }
        if (enqueueIfNoFile) {
            this.enqueue({ path });
        }
        return '';
    }

    public request(path: string, position: number): void {
        this.enqueue({ path, options: { position: String(position) } });
    }
}

let instance: SnapshotManager;

export const initialize = (ffmpeg?: string): void => {
    instance = new SnapshotManager(ffmpeg);
};

export const useSnapshotManager = (): SnapshotManager => {
    if (instance === undefined) {
        throw new Error('SnapshotManager is not initialized');
    }
    return instance;
};

export const reinstantiate = (ffmpeg?: string): void => {
    const current = useSnapshotManager();
    current.stopMonitoring();
    const currentQueue = current.getQueue();
    instance = new SnapshotManager(ffmpeg);
    currentQueue.forEach((request) => instance.enqueue(request));
};
