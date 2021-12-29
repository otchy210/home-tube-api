import FFmpeg from './FFmpeg';

const MONITOR_INTERVAL = 1000 * 60; // 1 minute

export type FFmpegRequest = {
    path: string;
    name: string;
    metaDir: string;
    metaFile: string;
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
            this.tid = setTimeout(this.check, MONITOR_INTERVAL);
            return;
        }
        this.consume(request).then(() => {
            this.check();
        });
    }

    abstract consume(request: FFmpegRequest): Promise<void>;

    public stopMonitoring(): void {
        if (this.tid !== undefined) {
            clearTimeout(this.tid);
        }
    }
}
