import VideoCollection, { parsePath } from './VideoCollection';

describe('parsePath', () => {
    it('works', () => {
        expect(parsePath('/abc/def/ghi.mp4')).toStrictEqual(['abc', 'def', 'ghi']);
        expect(parsePath('./abc.mp4')).toStrictEqual(['abc']);
        expect(parsePath('../abc//def.mp4')).toStrictEqual(['abc', 'def']);
        expect(parsePath('\\\\abc\\def.mp4')).toStrictEqual(['abc', 'def']);
    });
});

describe('VideoCollection', () => {
    it('add / remove works', () => {
        VideoCollection.add('/path/to/file.mp4');
        VideoCollection.add('/path/to/file.mov');
        expect(VideoCollection.size()).toBe(2);
        VideoCollection.remove('/path/to/file.mp4');
        expect(VideoCollection.size()).toBe(1);
        VideoCollection.remove('/path/to/dummy.mp4');
        expect(VideoCollection.size()).toBe(1);
        VideoCollection.remove('/path/to/file.mov');
        expect(VideoCollection.size()).toBe(0);
    });
    it('is searchable by path names', () => {
        VideoCollection.add('/path/to/日本語動画.mp4');
        const results = VideoCollection.find({ names: '動画' });
        expect(results.size).toBe(1);
        expect(Array.from(results)[0].values).toStrictEqual({
            path: '/path/to/日本語動画.mp4',
            names: ['path', 'to', '日本語動画'],
        });
    });
});
