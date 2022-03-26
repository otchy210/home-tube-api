import { existsSync, rmdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { CONVERTED_MP4 } from '../const';
import { isRequiredVideoMeta } from '../types';
import { parsePath } from '../utils/PathUtils';
import FFmpeg, { formatSeekTime } from './FFmpeg';

describe('formatSeekTime', () => {
    it('works', () => {
        expect(formatSeekTime(0)).toBe('00:00:00');
        expect(formatSeekTime(1)).toBe('00:00:01');
        expect(formatSeekTime(59)).toBe('00:00:59');
        expect(formatSeekTime(60)).toBe('00:01:00');
        expect(formatSeekTime(60 * 60 - 1)).toBe('00:59:59');
        expect(formatSeekTime(60 * 60)).toBe('01:00:00');
        expect(formatSeekTime(60 * 60 * 99 + 60 * 59 + 59)).toBe('99:59:59');
    });
});
describe('FFmpeg', () => {
    const ffmpeg = new FFmpeg();
    describe('getMeta', () => {
        it('works', () => {
            const path1 = 'test/storage1/test-movie.mp4';
            const mtime1 = statSync(path1).mtime.getTime();
            expect(ffmpeg.getMeta(path1)).toStrictEqual({
                acodec: 'aac',
                vcodec: 'h264',
                duration: '0:03',
                fileSize: 1504413,
                height: 1080,
                length: 3.08,
                mtime: mtime1,
                name: 'test-movie.mp4',
                width: 1920,
            });

            const path2 = 'test/storage1/test-movie.avi';
            const mtime2 = statSync(path2).mtime.getTime();
            expect(ffmpeg.getMeta(path2)).toStrictEqual({
                acodec: 'mp3',
                vcodec: 'mpeg4',
                duration: '0:03',
                fileSize: 1468780,
                height: 1080,
                length: 3.1,
                mtime: mtime2,
                name: 'test-movie.avi',
                width: 1920,
            });

            const path3 = 'test/storage1/test-movie.wmv';
            const mtime3 = statSync(path3).mtime.getTime();
            expect(ffmpeg.getMeta(path3)).toStrictEqual({
                acodec: 'wmav2',
                vcodec: 'msmpeg4v3',
                duration: '0:03',
                fileSize: 1454572,
                height: 1080,
                length: 3.14,
                mtime: mtime3,
                name: 'test-movie.wmv',
                width: 1920,
            });
        });
    });

    describe('createThumbnails', () => {
        it('works', (done) => {
            const path = 'test/storage1/test-movie.wmv';
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
            const path = 'test/storage1/test-movie.wmv';
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

    describe('updateSnapshot', () => {
        it('works', (done) => {
            const path = 'test/storage1/test-movie.wmv';
            const meta = ffmpeg.getMeta(path);
            if (!isRequiredVideoMeta(meta)) {
                throw new Error();
            }
            ffmpeg
                .updateSnapshot(
                    path,
                    meta,
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQAAAAA3iMLMAAAAEklEQVR4AWPg50egDx/gCJc4ACpfD/HR6M3qAAAAAElFTkSuQmCC'
                )
                .then(() => {
                    const { metaDir } = parsePath(path);
                    const snapshotPath = join(metaDir, 'snapshot.jpg');
                    expect(existsSync(snapshotPath)).toBe(true);
                    unlinkSync(snapshotPath);
                    rmdirSync(metaDir);
                    done();
                });
        });
    });

    describe('convertToMp4', () => {
        it('works', (done) => {
            const path = 'test/storage1/test-movie.wmv';
            ffmpeg.convertToMp4(path).then(() => {
                const { metaDir } = parsePath(path);
                const mp4Path = join(metaDir, CONVERTED_MP4);
                expect(existsSync(mp4Path)).toBe(true);
                unlinkSync(mp4Path);
                rmdirSync(metaDir);
                done();
            });
        });
    });
});
