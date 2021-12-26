import { execSync } from 'child_process';
import StorageMonitor, { getExtension, readDir } from './StorageMonitor';

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

describe('StorageMonitor', () => {
    const tmp = `tmp/${Math.random().toString(32).substring(2)}`;

    beforeAll(() => {
        execSync(`mkdir -p ${tmp}/storage1/a/b/a`);
        execSync(`mkdir -p ${tmp}/storage1/b`);
        execSync(`touch ${tmp}/storage1/a/b/a/test-movie.mp4`);
        execSync(`touch ${tmp}/storage1/b/test-movie.avi`);
    });

    it('retrieves initial data', (done) => {
        const listener = jest.fn();
        const worker = new StorageMonitor(`${tmp}/storage1`, 1, listener);
        worker.start().then((result) => {
            expect(result.size).toBe(2);
            worker.stop();
            done();
        });
    });

    it('monitors file creation and deletion', (done) => {
        const listener = jest.fn();
        const worker = new StorageMonitor(`${tmp}/storage1`, 0.1, listener);
        worker.start().then(() => {
            expect(listener).toBeCalledTimes(1);
            listener.mockReset();
        });
        setTimeout(() => {
            execSync(`touch ${tmp}/storage1/a/b/a/test-movie2.mp4`);
        }, 100);
        setTimeout(() => {
            expect(listener).toBeCalledTimes(1);
            expect(listener).toBeCalledWith<[Set<string>, Set<string>]>(new Set([`${tmp}/storage1/a/b/a/test-movie2.mp4`]), new Set<string>());
            listener.mockReset();
        }, 300);
        setTimeout(() => {
            execSync(`rm ${tmp}/storage1/a/b/a/*.mp4`);
        }, 400);
        setTimeout(() => {
            expect(listener).toBeCalledTimes(1);
            expect(listener).toBeCalledWith<[Set<string>, Set<string>]>(
                new Set<string>(),
                new Set([`${tmp}/storage1/a/b/a/test-movie.mp4`, `${tmp}/storage1/a/b/a/test-movie2.mp4`])
            );
            listener.mockReset();
        }, 500);
        setTimeout(() => {
            worker.stop();
            done();
        }, 600);
    });

    afterAll(() => {
        execSync(`rm -rf ${tmp}`);
    });
});
