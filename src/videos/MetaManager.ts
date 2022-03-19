import { existsSync, readFileSync } from 'fs';
import { readFile, writeFile } from '../utils/fsPromises';
import { join } from 'path';
import { isRequiredVideoMeta, VideoMeta } from '../types';
import { parsePath } from '../utils/PathUtils';
import FFmpegWorker, { ConsumeParams } from './FFmpegWorker';
import { useMp4Manager } from './Mp4Manager';
import { usePropertiesManager } from './PropertiesManager';
import { useSnapshotManager } from './SnapshotManager';
import { useThumbnailsManager } from './ThumbnailsManager';
import { useVideoCollection } from './VideoCollection';

const META_FILE = 'meta.json';

const getMetaPath = (metaDir: string): string => {
    return join(metaDir, META_FILE);
};

const enqueuSubTasksAsNeeded = (path: string): void => {
    // index properties
    const propertiesManager = usePropertiesManager();
    const properties = propertiesManager.get(path);
    // generate thumbnails
    useThumbnailsManager().get(path, 0);
    // generage snapshot
    useSnapshotManager().get(path);
    // convert mp4
    switch (properties.mp4) {
        case 'processing':
            useMp4Manager().enqueue({ path });
            properties.mp4 = 'queued';
            propertiesManager.update(path, properties);
            break;
        case 'queued':
            useMp4Manager().enqueue({ path });
            break;
    }
};

class MetaManager extends FFmpegWorker {
    constructor(ffmpeg?: string) {
        super(ffmpeg);
    }

    async consume({ path, metaDir }: ConsumeParams): Promise<void> {
        const meta = this.ffmpeg.getMeta(path);

        const metaPath = getMetaPath(metaDir);
        await writeFile(metaPath, JSON.stringify(meta));
        const videoCollection = useVideoCollection();
        videoCollection.updateMeta({ path }, meta);
        enqueuSubTasksAsNeeded(path);
    }

    /**
     * Returns full VideoMeta if meta file exists.
     * Otherwize returns only name but enqueue data retrieving job
     */
    public get(path: string, enqueueIfNoMetaData = true): Promise<VideoMeta> {
        const { name, metaDir } = parsePath(path);
        const metaPath = getMetaPath(metaDir);
        return new Promise((resolve) => {
            readFile(metaPath)
                .then((buf) => {
                    const meta = JSON.parse(buf.toString()) as VideoMeta;
                    const videoCollection = useVideoCollection();
                    videoCollection.updateMeta({ path }, meta);
                    enqueuSubTasksAsNeeded(path);
                    resolve(meta);
                })
                .catch(() => {
                    if (enqueueIfNoMetaData) {
                        this.enqueue({
                            path,
                        });
                    }
                    resolve({
                        name,
                    });
                });
        });
    }

    /**
     * Trys loading meta file synchronously and return it if exists.
     * Otherwize, returns undefined
     */
    public getRequiredMeta(path: string): Required<VideoMeta> | undefined {
        const { metaDir } = parsePath(path);
        const metaPath = getMetaPath(metaDir);
        if (!existsSync(metaPath)) {
            return;
        }
        const meta = JSON.parse(readFileSync(metaPath).toString()) as VideoMeta;
        if (!isRequiredVideoMeta(meta)) {
            return;
        }
        return meta;
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
