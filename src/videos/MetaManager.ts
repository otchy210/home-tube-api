import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import { VideoMeta } from '../types';
import { hash } from '../utils/StringUtils';
import FFmpeg from './FFmpeg';

const META_DIR = '.home-tube';
const META_FILE = 'meta.json';

const MONITOR_INTERVAL = 1000 * 60; // 1 minute

type Request = {
    path: string;
    name: string;
    metaDir: string;
    metaFile: string;
};
const ffmpeg = new FFmpeg();
const queue: Request[] = [];
const enqueue = (request: Request): void => {
    queue.push(request);
};
let tid: NodeJS.Timeout;
export const stopMonitoring = () => {
    clearTimeout(tid);
};
const check = async () => {
    stopMonitoring();
    const request = queue.shift();
    if (!request) {
        tid = setTimeout(check, MONITOR_INTERVAL);
        return;
    }
    const { path, name, metaDir, metaFile } = request;
    await mkdir(metaDir, { recursive: true });
    const videoMeta = ffmpeg.getMeta(path);
    videoMeta.name = name;
    await writeFile(metaFile, JSON.stringify(videoMeta));
    check();
};
check();

const MetaManager = {
    /**
     * It returns VideoMeta if meta file exists.
     * Otherwize return only name but enqueue data retrieving job
     */
    get: (path: string, queueIfNoMetaData = true): Promise<VideoMeta> => {
        const name = basename(path);
        const hashedName = hash(name);
        const dir = dirname(path);
        const metaDir = join(dir, META_DIR, hashedName);
        const metaFile = join(metaDir, META_FILE);
        return new Promise((resolve) => {
            readFile(metaFile)
                .then((buf) => {
                    resolve(JSON.parse(buf.toString()));
                })
                .catch(() => {
                    if (queueIfNoMetaData) {
                        enqueue({
                            path,
                            name,
                            metaDir,
                            metaFile,
                        });
                        check();
                    }
                    resolve({
                        name,
                    });
                });
        });
    },
};

export default MetaManager;
