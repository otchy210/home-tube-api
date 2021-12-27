import FFmpeg from './FFmpeg';

describe('FFmpeg', () => {
    const ffmpeg = new FFmpeg();
    describe('getMeta', () => {
        it('works', () => {
            expect(ffmpeg.getMeta('test/test-movie.mp4')).toStrictEqual({
                acodec: 'aac',
                vcodec: 'h264',
                duration: '3',
                height: 1080,
                length: 3.08,
                width: 1920,
            });
            expect(ffmpeg.getMeta('test/test-movie.avi')).toStrictEqual({
                acodec: 'mp3',
                vcodec: 'mpeg4',
                duration: '3',
                height: 1080,
                length: 3.1,
                width: 1920,
            });
            expect(ffmpeg.getMeta('test/test-movie.wmv')).toStrictEqual({
                acodec: 'wmav2',
                vcodec: 'msmpeg4v3',
                duration: '3',
                height: 1080,
                length: 3.14,
                width: 1920,
            });
        });
    });
});
