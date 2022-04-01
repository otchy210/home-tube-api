import { sha256 } from '../utils/StringUtils';
import { getNames, useVideoCollection } from './VideoCollection';

describe('getNames', () => {
    it('works', () => {
        expect(getNames('/abc/def/ghi.mp4')).toStrictEqual(['abc', 'def', 'ghi', 'mp4']);
        expect(getNames('./abc.mp4')).toStrictEqual(['abc', 'mp4']);
        expect(getNames('../abc//def.mp4')).toStrictEqual(['abc', 'def', 'mp4']);
        expect(getNames('\\\\abc\\def.mp4')).toStrictEqual(['abc', 'def', 'mp4']);
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
            key: 'LmScC35-sEgPDA08IQLe3U02x4tUd3PXaJ32QopI2tQ',
            path: '/path/to/日本語動画.mp4',
            name: '日本語動画.mp4',
            names: ['path', 'to', '日本語動画', 'mp4'],
        });
        videoCollection.remove('/path/to/日本語動画.mp4');
    });

    it('allTags works', () => {
        videoCollection.add('/path/to/1.mp4');
        videoCollection.add('/path/to/2.mp4');
        videoCollection.add('/path/to/3.mp4');

        videoCollection.updateProperties({ path: '/path/to/1.mp4' }, { tags: ['tag1', 'tag2', 'tag3'] });
        videoCollection.updateProperties({ key: sha256('/path/to/2.mp4') }, { tags: ['tag2', 'tag3', 'tag4'] });
        videoCollection.updateProperties({ path: '/path/to/3.mp4' }, { tags: ['tag2', 'tag4', 'tag6'] });

        expect(videoCollection.getAllTags()).toStrictEqual({ tag1: 1, tag2: 3, tag3: 2, tag4: 2, tag6: 1 });

        videoCollection.remove('/path/to/1.mp4');

        expect(videoCollection.getAllTags()).toStrictEqual({ tag2: 2, tag3: 1, tag4: 2, tag6: 1 });

        videoCollection.remove('/path/to/2.mp4');
        videoCollection.remove('/path/to/3.mp4');

        expect(videoCollection.getAllTags()).toStrictEqual({});
    });
});
