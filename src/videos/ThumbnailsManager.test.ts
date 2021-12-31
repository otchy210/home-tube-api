import { initializeWorkers, stopWorkers } from './FFMpegWorkersManager';
import { useThumbnailsManager } from './ThumbnailsManager';

describe('ThumbnailsManager', () => {
    initializeWorkers();
    const thumbnailsManager = useThumbnailsManager();

    describe('get', () => {
        it('returns empty string if there is no thumbnails file', () => {
            expect(thumbnailsManager.get('test/test-movie.mp4', 1, false)).toBe('');
        });
        it('returns thumbranils file path if it exists', () => {
            expect(thumbnailsManager.get('test/test-movie.mp4', 0, false)).toBe('test/.home-tube/443e7d6215557ded18e271e866f1d6b3/thumbnails_000.jpg');
        });
    });

    afterAll(() => {
        stopWorkers();
    });
});
