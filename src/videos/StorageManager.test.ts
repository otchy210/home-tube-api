import { useStorageManager } from './StorageManager';
import { initialize as initializeMetaManager, useMetaManager } from './MetaManager';
import { existsSync } from 'fs';

describe('StorageManager', () => {
    initializeMetaManager();
    const storageManager = useStorageManager();
    const storageListener = jest.fn();
    storageManager.add('./test', storageListener);

    afterAll(() => {
        useMetaManager().stopMonitoring();
        useStorageManager().stopAllMonitors();
    });

    describe('renameFileAndMetaDir', () => {
        const storageManager = useStorageManager();
        const metaManager = useMetaManager();
        it('works', () => {
            const srcPath = './test/test-movie.mp4';
            const destPath = './test/test-movie-renamed.mp4';
            storageManager.renameFileAndMetaDir(srcPath, destPath);
            expect(existsSync(destPath)).toBe(true);
            expect(metaManager.getRequiredMeta(destPath)?.name).toBe('test-movie-renamed.mp4');
            storageManager.renameFileAndMetaDir(destPath, srcPath);
        });
    });

    describe('rename', () => {
        const storageManager = useStorageManager();
        it("should be rejected when srcPath doesn't exist", (done) => {
            const srcPath = './test/dummy.mp4';
            const destPath = './test/test-movie-renamed.mp4';
            storageManager.rename(srcPath, destPath).catch((error) => {
                expect(error).toContain("does't exist");
                done();
            });
        });
    });
});
