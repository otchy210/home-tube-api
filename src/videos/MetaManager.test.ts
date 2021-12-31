import { initializeWorkers, stopWorkers } from './FFMpegWorkersManager';
import { useMetaManager } from './MetaManager';

describe('MetaManager', () => {
    initializeWorkers();
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

    afterAll(() => {
        stopWorkers();
    });
});
