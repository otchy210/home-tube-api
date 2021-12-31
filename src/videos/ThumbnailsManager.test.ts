import { initialize, useThumbnailsManager } from './ThumbnailsManager';

describe('ThumbnailsManager', () => {
    initialize();
    const thumbnailsManager = useThumbnailsManager();
    describe('get', () => {
        it('returns empty string if there is no thumbnails file', () => {
            expect(thumbnailsManager.get('test/test-movie.wmv', false)).toBe('');
        });
        it('returns thumbranils file path if it exists', () => {
            expect(thumbnailsManager.get('test/test-movie.mp4')).toBe('test/.home-tube/443e7d6215557ded18e271e866f1d6b3/thumbnails.jpg');
        });
    });

    afterAll(() => {
        thumbnailsManager.stopMonitoring();
    });
});
