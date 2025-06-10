import { existsSync } from 'fs';
import { initialize as initializeMetaManager, useMetaManager } from './MetaManager';
import { useStorageManager } from './StorageManager';

describe('StorageManager', () => {
    initializeMetaManager();
    const storageManager = useStorageManager();
    const storageListener = jest.fn();
    storageManager.add('./test/storage1', storageListener);
    storageManager.add('./test/storage2', storageListener);

    afterAll(() => {
        useMetaManager().stopMonitoring();
        useStorageManager().stopAllMonitors();
    });

    describe('rename', () => {
        const storageManager = useStorageManager();
        it("should be rejected when srcPath doesn't exist", (done) => {
            const srcPath = './test/dummy.mp4';
            const destPath = './test/storage1/test-movie-renamed.mp4';
            storageManager.rename(srcPath, destPath).catch((error) => {
                expect(error).toContain("does't exist");
                done();
            });
        });

        it('should be rejected when destPath exists', (done) => {
            const srcPath = './test/storage1/test-movie.mp4';
            const destPath = './test/storage1/test-movie.mp4';
            storageManager.rename(srcPath, destPath).catch((error) => {
                expect(error).toContain('exists already');
                done();
            });
        });

        it('should be rejected when srcMonitor not found', (done) => {
            const srcPath = './test/storage3/test-movie.mp4';
            const destPath = './test/storage1/test-movie-renamed.mp4';
            storageManager.rename(srcPath, destPath).catch((error) => {
                expect(error).toContain('srcMonitor not found');
                done();
            });
        });

        it('should be rejected when destMonitor not found', (done) => {
            const srcPath = './test/storage1/test-movie.mp4';
            const destPath = './test/storage3/test-movie-renamed.mp4';
            storageManager.rename(srcPath, destPath).catch((error) => {
                expect(error).toContain('destMonitor not found');
                done();
            });
        });

        it('should be rejected when srcMonitor and destMonitor are different', (done) => {
            const srcPath = './test/storage1/test-movie.mp4';
            const destPath = './test/storage2/test-movie-renamed.mp4';
            storageManager.rename(srcPath, destPath).catch((error) => {
                expect(error).toContain('srcPath and destPath should belong to the same storage');
                done();
            });
        });
    });

    describe('renameFileAndMetaDir', () => {
        const storageManager = useStorageManager();
        const metaManager = useMetaManager();
        it('works', () => {
            const srcPath = './test/storage1/test-movie.mp4';
            const destPath = './test/storage1/test-movie-renamed.mp4';
            storageManager.renameFileAndMetaDir(srcPath, destPath);
            expect(existsSync(destPath)).toBe(true);
            expect(metaManager.getRequiredMeta(destPath)?.name).toBe('test-movie-renamed.mp4');
            storageManager.renameFileAndMetaDir(destPath, srcPath);
        });
    });

    describe('move', () => {
        const storageManager = useStorageManager();
        it('delegates to rename', async () => {
            const spy = jest.spyOn(storageManager, 'rename').mockResolvedValue();
            await storageManager.move('a.mp4', 'b.mp4');
            expect(spy).toBeCalledWith('a.mp4', 'b.mp4');
        });
    });
});
