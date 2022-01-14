import { initializeWorkers, stopWorkers } from './FFMpegWorkersManager';
import { useMetaManager } from './MetaManager';
import { useSnapshotManager } from './SnapshotManager';
import { useThumbnailsManager } from './ThumbnailsManager';

describe('FFmpegWorkers', () => {
    initializeWorkers();

    describe('MetaManager', () => {
        const metaManager = useMetaManager();
        describe('get', () => {
            it('returns only name if there is no meta.json', (done) => {
                metaManager.get('test/test-movie.wmv', false).then((meta) => {
                    expect(meta).toStrictEqual({ name: 'test-movie.wmv' });
                    done();
                });
            });
            it('reads meta.json properly if exists', (done) => {
                metaManager.get('test/test-movie.mp4', false).then((meta) => {
                    expect(meta).toStrictEqual({
                        acodec: 'aac',
                        duration: '3',
                        height: 1080,
                        length: 3.08,
                        name: 'test-movie.mp4',
                        vcodec: 'h264',
                        width: 1920,
                    });
                    done();
                });
            });
        });
    });

    describe('ThumbnailsManager', () => {
        const thumbnailsManager = useThumbnailsManager();

        describe('get', () => {
            it('returns empty string if there is no thumbnails file', () => {
                expect(thumbnailsManager.get('test/test-movie.mp4', 1, false)).toBe('');
            });
            it('returns thumbranils file path if it exists', () => {
                expect(thumbnailsManager.get('test/test-movie.mp4', 0, false)).toBe('test/.home-tube/443e7d6215557ded18e271e866f1d6b3/thumbnails_000.jpg');
            });
        });
    });

    describe('SnapshotManager', () => {
        const snapshotManager = useSnapshotManager();

        describe('get', () => {
            it('returns empty string if there is no thumbnails file', () => {
                expect(snapshotManager.get('test/test-movie.wmv', false)).toBe('');
            });
            it('returns thumbranils file path if it exists', () => {
                expect(snapshotManager.get('test/test-movie.mp4', false)).toBe('test/.home-tube/443e7d6215557ded18e271e866f1d6b3/snapshot.jpg');
            });
        });
    });

    afterAll(() => {
        stopWorkers();
    });
});
