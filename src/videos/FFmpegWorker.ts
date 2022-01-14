import { mkdir } from 'fs/promises';
import { parsePath } from '../utils/PathUtils';
import FFmpeg from './FFmpeg';

const MONITOR_INTERVAL = 1000 * 10; // 10 seconds

export type FFmpegRequest = {
    path: string;
    options?: Record<string, string>;
};

export type ConsumeParams = {
    path: string;
    name: string;
    metaDir: string;
    options?: Record<string, string>;
};

type Status = 'PROCESSING';

export default abstract class FFmpegWorker {
    protected ffmpeg: FFmpeg;
    private queue: FFmpegRequest[] = [];
    private tid: NodeJS.Timeout | undefined;
    private statuses = new Map<string, Status>();

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
        const { path, options } = request;
        const status = this.statuses.get(path);
        if (status === 'PROCESSING') {
            this.check();
            return;
        }
        this.statuses.set(path, 'PROCESSING');

        const { name, metaDir } = parsePath(path);
        mkdir(metaDir, { recursive: true }).then(() => {
            const params = {
                path,
                name,
                metaDir,
                options,
            };
            this.consume(params)
                .then(() => {
                    this.check();
                    this.statuses.delete(path);
                })
                .catch((e) => {
                    console.error(e);
                    this.check();
                    this.statuses.delete(path);
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
