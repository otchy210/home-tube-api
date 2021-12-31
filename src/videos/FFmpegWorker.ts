import { mkdir } from 'fs/promises';
import { parsePath } from '../utils/PathUtils';
import FFmpeg from './FFmpeg';

const MONITOR_INTERVAL = 1000 * 10; // 10 seconds

export type FFmpegRequest = {
    path: string;
};

export type ConsumeParams = {
    path: string;
    name: string;
    metaDir: string;
};

export default abstract class FFmpegWorker {
    protected ffmpeg: FFmpeg;
    private queue: FFmpegRequest[] = [];
    private tid: NodeJS.Timeout | undefined;

    constructor(ffmpeg?: string) {
        this.ffmpeg = new FFmpeg(ffmpeg);
        this.check();
    }

    public enqueue(request: FFmpegRequest): void {
        this.queue.push(request);
    }

    public getQueue(): FFmpegRequest[] {
        return this.queue;
    }

    protected check() {
        this.stopMonitoring();
        const request = this.queue.shift();
        if (!request) {
            this.tid = setTimeout(() => {
                this.check();
            }, MONITOR_INTERVAL);
            return;
        }
        const { path } = request;
        const { name, metaDir } = parsePath(path);
        mkdir(metaDir, { recursive: true }).then(() => {
            const params = {
                path,
                name,
                metaDir,
            };
            this.consume(params).then(() => {
                this.check();
            });
        });
    }

    abstract consume(request: ConsumeParams): Promise<void>;

    public stopMonitoring(): void {
        if (this.tid !== undefined) {
            clearTimeout(this.tid);
        }
    }
}
