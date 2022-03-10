import { VideoProperties } from '../types';
import FFmpegWorker, { ConsumeParams, FFmpegRequest } from './FFmpegWorker';
import { usePropertiesManager } from './PropertiesManager';

class Mp4Manager extends FFmpegWorker {
    constructor(ffmpeg?: string) {
        super(ffmpeg);
    }

    public enqueue(request: FFmpegRequest): string {
        const { path } = request;
        const propertiesManager = usePropertiesManager();
        const properties = propertiesManager.get(path);
        switch (properties.mp4) {
            case 'available':
                return 'available';
        }
        const queuedProperties: VideoProperties = {
            ...properties,
            mp4: 'queued',
        };
        propertiesManager.update(path, queuedProperties);
        return super.enqueue(request);
    }

    async consume({ path }: ConsumeParams): Promise<void> {
        const propertiesManager = usePropertiesManager();
        const properties = propertiesManager.get(path);
        switch (properties.mp4) {
            case 'processing':
            case 'available':
                return;
        }
        const processingProperties: VideoProperties = {
            ...properties,
            mp4: 'processing',
        };
        propertiesManager.update(path, processingProperties);
        await this.ffmpeg.convertToMp4(path);
        const availableProperties: VideoProperties = {
            ...propertiesManager.get(path),
            mp4: 'available',
        };
        propertiesManager.update(path, availableProperties);
    }
}

let instance: Mp4Manager;

export const initialize = (ffmpeg?: string): void => {
    instance = new Mp4Manager(ffmpeg);
};

export const useMp4Manager = (): Mp4Manager => {
    if (instance === undefined) {
        throw new Error('Mp4Manager is not initialized');
    }
    return instance;
};

export const reinstantiate = (ffmpeg?: string): void => {
    const current = useMp4Manager();
    current.stopMonitoring();
    const currentQueue = current.getQueue();
    instance = new Mp4Manager(ffmpeg);
    currentQueue.forEach((request) => instance.enqueue(request));
};
