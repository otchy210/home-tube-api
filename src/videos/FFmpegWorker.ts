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

export type FFmpegWoekerStatus = {
    count: number;
    current: string | null;
};

export default abstract class FFmpegWorker {
    protected ffmpeg: FFmpeg;
    private queue: FFmpegRequest[] = [];
    private tid: NodeJS.Timeout | undefined;
    private current: string | undefined;

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
        if (this.current === path) {
            this.check();
            return;
        }
        this.current = path;

        const { name, metaDir } = parsePath(path);
        mkdir(metaDir, { recursive: true }).then(() => {
            const params: ConsumeParams = {
                path,
                name,
                metaDir,
                options,
            };
            this.consume(params)
                .then(() => {
                    this.check();
                    this.current = undefined;
                })
                .catch((e) => {
                    console.error(e);
                    this.check();
                    this.current = undefined;
                });
        });
    }

    abstract consume(request: ConsumeParams): Promise<void>;

    public stopMonitoring(): void {
        if (this.tid !== undefined) {
            clearTimeout(this.tid);
        }
    }

    public getStatus(): FFmpegWoekerStatus {
        return {
            count: this.queue.length,
            current: this.current ?? null,
        };
    }
}
