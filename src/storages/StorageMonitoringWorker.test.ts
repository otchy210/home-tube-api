import { execSync } from 'child_process';
import StorageMonitoringWorker, { getExtension, readDir } from './StorageMonitoringWorker';

describe('getExtension', () => {
    it('works', () => {
        expect(getExtension('filename.abc')).toBe('abc');
        expect(getExtension('filename.abc.def')).toBe('def');
        expect(getExtension('filename.ABC')).toBe('abc');
    });
});

describe('readDir', () => {
    it('works', () => {
        const result = new Set<string>();
        const root = 'test/storage1';
        readDir(root, result).then(() => {
            expect(result.size).toBe(2);
            expect(result.has(`${root}/a/b/a/test-movie.mp4`)).toBe(true);
            expect(result.has(`${root}/b/test-movie.avi`)).toBe(true);
        });
    });
});

describe('StorageMonitoringWorker', () => {
    beforeAll(() => {
        execSync('mkdir -p tmp/storage1/a/b/a');
        execSync('mkdir -p tmp/storage1/b');
        execSync('touch tmp/storage1/a/b/a/test-movie.mp4');
        execSync('touch tmp/storage1/b/test-movie.avi');
    });

    it('retrieves initial data', () => {
        const listener = jest.fn();
        const worker = new StorageMonitoringWorker('tmp/storage1', 1, listener);
        worker.start().then((result) => {
            expect(result.size).toBe(2);
            worker.stop();
        });
    });

    afterAll(() => {
        execSync('rm -rf tmp/storage1');
    });
});
