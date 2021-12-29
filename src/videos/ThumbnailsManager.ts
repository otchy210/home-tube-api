import { join } from 'path';
import { THUMBNAILS_NAME } from './FFmpeg';
import FFmpegWorker, { ConsumeParams } from './FFmpegWorker';

const getThumbnailsFile = (metaDir: string): string => {
    return join(metaDir, THUMBNAILS_NAME);
};

export default class ThumbnailsManager extends FFmpegWorker {
    async consume({ metaDir }: ConsumeParams): Promise<void> {
        const thumbnailsFile = getThumbnailsFile(metaDir);
    }
}
