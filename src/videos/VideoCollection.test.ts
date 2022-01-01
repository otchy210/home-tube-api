import { getNames, useVideoCollection } from './VideoCollection';

describe('getNames', () => {
    it('works', () => {
        expect(getNames('/abc/def/ghi.mp4')).toStrictEqual(['abc', 'def', 'ghi']);
        expect(getNames('./abc.mp4')).toStrictEqual(['abc']);
        expect(getNames('../abc//def.mp4')).toStrictEqual(['abc', 'def']);
        expect(getNames('\\\\abc\\def.mp4')).toStrictEqual(['abc', 'def']);
    });
});

describe('VideoCollection', () => {
    const videoCollection = useVideoCollection();
    it('add / remove works', () => {
        videoCollection.add('/path/to/file.mp4');
        videoCollection.add('/path/to/file.mov');
        expect(videoCollection.size()).toBe(2);
        videoCollection.remove('/path/to/file.mp4');
        expect(videoCollection.size()).toBe(1);
        videoCollection.remove('/path/to/dummy.mp4');
        expect(videoCollection.size()).toBe(1);
        videoCollection.remove('/path/to/file.mov');
        expect(videoCollection.size()).toBe(0);
    });
    it('is searchable by path names', () => {
        videoCollection.add('/path/to/日本語動画.mp4');
        const results = videoCollection.find({ names: '動画' });
        expect(results.size).toBe(1);
        expect(Array.from(results)[0].values).toStrictEqual({
            path: '/path/to/日本語動画.mp4',
            name: '日本語動画.mp4',
            names: ['path', 'to', '日本語動画'],
        });
    });
});
