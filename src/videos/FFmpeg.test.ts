import { existsSync, rmdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { isRequiredVideoMeta } from '../types';
import { parsePath } from '../utils/PathUtils';
import FFmpeg from './FFmpeg';

describe('FFmpeg', () => {
    const ffmpeg = new FFmpeg();
    describe('getMeta', () => {
        it('works', () => {
            expect(ffmpeg.getMeta('test/test-movie.mp4')).toStrictEqual({
                acodec: 'aac',
                vcodec: 'h264',
                duration: '3',
                height: 1080,
                length: 3.08,
                name: 'test-movie.mp4',
                width: 1920,
            });
            expect(ffmpeg.getMeta('test/test-movie.avi')).toStrictEqual({
                acodec: 'mp3',
                vcodec: 'mpeg4',
                duration: '3',
                height: 1080,
                length: 3.1,
                name: 'test-movie.avi',
                width: 1920,
            });
            expect(ffmpeg.getMeta('test/test-movie.wmv')).toStrictEqual({
                acodec: 'wmav2',
                vcodec: 'msmpeg4v3',
                duration: '3',
                height: 1080,
                length: 3.14,
                name: 'test-movie.wmv',
                width: 1920,
            });
        });
    });

    describe('createThumbnails', () => {
        it('works', (done) => {
            const path = 'test/test-movie.wmv';
            const meta = ffmpeg.getMeta(path);
            if (!isRequiredVideoMeta(meta)) {
                throw new Error();
            }
            ffmpeg.createThumbnails(path, meta).then(() => {
                const { metaDir } = parsePath(path);
                const thumbnailsPath = join(metaDir, 'thumbnails_000.jpg');
                expect(existsSync(thumbnailsPath)).toBe(true);
                unlinkSync(thumbnailsPath);
                rmdirSync(metaDir);
                done();
            });
        });
    });

    describe('createSnapshot', () => {
        it('works', (done) => {
            const path = 'test/test-movie.wmv';
            const meta = ffmpeg.getMeta(path);
            if (!isRequiredVideoMeta(meta)) {
                throw new Error();
            }
            ffmpeg.createSnapshot(path, meta).then(() => {
                const { metaDir } = parsePath(path);
                const snapshotPath = join(metaDir, 'snapshot.jpg');
                expect(existsSync(snapshotPath)).toBe(true);
                unlinkSync(snapshotPath);
                rmdirSync(metaDir);
                done();
            });
        });
    });
});
