import { mkdir, readFile, writeFile } from 'fs/promises';
import { VideoMeta } from '../types';
import { parsePath } from '../utils/PathUtils';
import FFmpegWorker, { FFmpegRequest } from './FFmpegWorker';
import VideoCollection from './VideoCollection';

export default class MetaManager extends FFmpegWorker {
    constructor(ffmpeg?: string) {
        super(ffmpeg);
    }

    async consume(request: FFmpegRequest): Promise<void> {
        const { path, name, metaDir, metaFile } = request;
        await mkdir(metaDir, { recursive: true });
        const meta = this.ffmpeg.getMeta(path);
        meta.name = name;
        await writeFile(metaFile, JSON.stringify(meta));
        VideoCollection.updateMeta(path, meta);
    }

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
