import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import { VideoMeta } from '../types';
import { hash } from '../utils/StringUtils';
import FFmpeg from './FFmpeg';
import VideoCollection from './VideoCollection';

const META_DIR = '.home-tube';
const META_FILE = 'meta.json';

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
     * It returns VideoMeta if meta file exists.
     * Otherwize return only name but enqueue data retrieving job
     */
    public get(path: string, queueIfNoMetaData = true): Promise<VideoMeta> {
        const name = basename(path);
        const hashedName = hash(name);
        const dir = dirname(path);
        const metaDir = join(dir, META_DIR, hashedName);
        const metaFile = join(metaDir, META_FILE);
        return new Promise((resolve) => {
            readFile(metaFile)
                .then((buf) => {
                    const meta = JSON.parse(buf.toString());
                    VideoCollection.updateMeta(path, meta);
                    resolve(meta);
                })
                .catch(() => {
                    if (queueIfNoMetaData) {
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
