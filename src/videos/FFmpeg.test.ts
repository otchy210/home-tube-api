import FFmpeg from './FFmpeg';

describe('FFmpeg', () => {
    const ffmpeg = new FFmpeg();
    describe('getMeta', () => {
        it('works', () => {
            expect(ffmpeg.getMeta('test/test-movie.mp4')).toStrictEqual({
                codec: 'h264',
                duration: '4',
                height: 1080,
                length: 4,
                width: 1920,
            });
            expect(ffmpeg.getMeta('test/test-movie.wmv')).toStrictEqual({
                codec: 'msmpeg4v3',
                duration: '4',
                height: 1080,
                length: 4,
                width: 1920,
            });
        });
    });
});
