import { mkdir, readFile, writeFile } from 'fs/promises';
import { VideoMeta } from '../types';
import { parsePath } from '../utils/PathUtils';
import FFmpeg from './FFmpeg';
import VideoCollection from './VideoCollection';

const MONITOR_INTERVAL = 1000 * 60; // 1 minute

type Request = {
    path: string;
    name: string;
    metaDir: string;
    metaFile: string;
};

export default class MetaManager {
    private ffmpeg;
    private queue: Request[] = [];
    private tid: NodeJS.Timeout | undefined;

    constructor(ffmpeg?: string) {
        this.ffmpeg = new FFmpeg(ffmpeg);
        this.check();
    }

    public enqueue(request: Request): void {
        this.queue.push(request);
    }

    public getQueue() {
        return this.queue;
    }

    private check = async () => {
        this.stopMonitoring();
        const request = this.queue.shift();
        if (!request) {
            this.tid = setTimeout(this.check, MONITOR_INTERVAL);
            return;
        }
        const { path, name, metaDir, metaFile } = request;
        await mkdir(metaDir, { recursive: true });
        const meta = this.ffmpeg.getMeta(path);
        meta.name = name;
        await writeFile(metaFile, JSON.stringify(meta));
        VideoCollection.updateMeta(path, meta);
        this.check();
    };

    public stopMonitoring = () => {
        if (this.tid !== undefined) {
            clearTimeout(this.tid);
        }
    };

    /**
     * Returns full VideoMeta if meta file exists.
     * Otherwize returns only name but enqueue data retrieving job
     */
    public get(path: string, enqueueIfNoMetaData = true): Promise<VideoMeta> {
        const { name, metaDir, metaFile } = parsePath(path);
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
                            name,
                            metaDir,
                            metaFile,
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
