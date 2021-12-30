import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { VideoMeta } from '../types';
import { parsePath } from '../utils/PathUtils';
import FFmpegWorker, { ConsumeParams } from './FFmpegWorker';
import VideoCollection from './VideoCollection';

const META_FILE = 'meta.json';

const getMetaFile = (metaDir: string): string => {
    return join(metaDir, META_FILE);
};

class MetaManager extends FFmpegWorker {
    constructor(ffmpeg?: string) {
        super(ffmpeg);
    }

    async consume({ path, name, metaDir }: ConsumeParams): Promise<void> {
        const meta = this.ffmpeg.getMeta(path);
        meta.name = name;

        const metaFile = getMetaFile(metaDir);
        await writeFile(metaFile, JSON.stringify(meta));
        VideoCollection.updateMeta(path, meta);
    }

    /**
     * Returns full VideoMeta if meta file exists.
     * Otherwize returns only name but enqueue data retrieving job
     */
    public get(path: string, enqueueIfNoMetaData = true): Promise<VideoMeta> {
        const { name, metaDir } = parsePath(path);
        const metaFile = getMetaFile(metaDir);
        return new Promise((resolve) => {
            readFile(metaFile)
                .then((buf) => {
                    const meta = JSON.parse(buf.toString());
                    VideoCollection.updateMeta(path, meta);
                    resolve(meta);
                })
                .catch(() => {
                    if (enqueueIfNoMetaData) {
                        this.enqueue({
                            path,
                        });
                        this.check();
                    }
                    resolve({
                        name,
                    });
                });
        });
    }
}

let instance: MetaManager;

export const initialize = (ffmpeg?: string): void => {
    instance = new MetaManager(ffmpeg);
};

export const reinstantiate = (ffmpeg?: string): void => {
    if (instance === undefined) {
        throw new Error('MetaManager is not initialized');
    }
    const current = instance;
    current.stopMonitoring();
    const currentQueue = current.getQueue();
    instance = new MetaManager(ffmpeg);
    currentQueue.forEach((request) => instance.enqueue(request));
};

export const useMetaManager = (): MetaManager => {
    if (instance === undefined) {
        throw new Error('MetaManager is not initialized');
    }
    return instance;
};
