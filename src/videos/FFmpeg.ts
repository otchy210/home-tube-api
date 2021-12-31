import { execSync } from 'child_process';
import { copyFile, mkdir } from 'fs/promises';
import { basename, join } from 'path';
import { VideoMeta } from '../types';
import { execPromise } from '../utils/ChildProcessUtils';
import { parsePath } from '../utils/PathUtils';

const getFFmpeg = (): string => {
    return execSync('which ffmpeg').toString().trim();
};

const getTmpDir = (): string => {
    return process.env.TMPDIR ?? process.env.TMP ?? process.env.TEMP ?? '/tmp';
};

const parseMetaDuration = (line: string): { duration: string; length: number } => {
    const duration = line.trim().split(' ')[1].split(',')[0];
    const [hours, mins, secs] = duration.split(':');
    const length = parseInt(hours) * 3600 + parseInt(mins) * 60 + parseFloat(secs);
    return { duration: formatDuration(duration), length };
};

const formatDuration = (duration: string): string => {
    const [hhmmss] = duration.split('.');
    let result = hhmmss;
    let c = result.charAt(0);
    while (c === '0' || c === ':') {
        result = result.substring(1);
        c = result.charAt(0);
    }
    return result;
};

const parseMetaVideo = (line: string): { vcodec: string; width: number; height: number } => {
    const vcodec = line.trim().split(' ')[3];
    const match = /, ([\d]{2,4})x([\d]{2,4})/.exec(line) as RegExpExecArray;
    const width = parseInt(match[1]);
    const height = parseInt(match[2]);
    return { vcodec, width, height };
};

const parseMetaAudio = (line: string): { acodec: string } => {
    const acodec = line.trim().split(' ')[3];
    return { acodec };
};

const THUMBNAIL_TMP_DIR = 'home-tube';
const THUMBNAIL_SIZE = 240;
const THUMBNAIL_ROW_SIZE = 60;
const THUMBNAIL_JPEG_QUALITY = 5;

export const getThumbnailsName = (index: number): string => {
    return `thumbnails_${String(index).padStart(3, '0')}.jpg`;
};

export default class FFmpeg {
    private ffmpeg: string;
    private tmp: string;

    constructor(ffmpeg?: string) {
        this.ffmpeg = ffmpeg || getFFmpeg();
        this.tmp = getTmpDir();
    }

    public getMeta(path: string): VideoMeta {
        const command = `${this.ffmpeg} -i "${path}" 2>&1 | cat`;
        const results = execSync(command).toString();
        let metaDuration = {};
        let metaVideo = {};
        let metaAudio = {};
        results.split('\n').forEach((line) => {
            if (line.includes('  Duration: ')) {
                metaDuration = parseMetaDuration(line);
            } else if (line.includes(': Video: ')) {
                metaVideo = parseMetaVideo(line);
            } else if (line.includes(': Audio: ')) {
                metaAudio = parseMetaAudio(line);
            }
        });
        const name = basename(path);
        return { name, ...metaDuration, ...metaVideo, ...metaAudio };
    }

    public createThumbnails(path: string, meta: Required<VideoMeta>): Promise<boolean> {
        if (!meta.height || !meta.width || !meta.length) {
            return Promise.resolve(false);
        }
        const length = Math.floor(meta.length);
        const tmpDir = join(this.tmp, THUMBNAIL_TMP_DIR, Math.random().toString(32).substring(2));
        return new Promise((resolve) => {
            (async () => {
                await mkdir(tmpDir, { recursive: true });
                const scale = meta.width >= meta.height ? `${THUMBNAIL_SIZE}:-1` : `-1:${THUMBNAIL_SIZE}`;
                const outputPath = join(tmpDir, '%04d.png');
                const thumbnailsCommand = `${this.ffmpeg} -i "${path}" -vf scale=${scale},fps=1 "${outputPath}"`;
                await execPromise(thumbnailsCommand).catch((error) => {
                    console.error(error);
                });
                let rows = 0;
                const outputFiles: string[] = [];
                for (let i = 1; i < length; i += THUMBNAIL_ROW_SIZE) {
                    const inputPaths: string[] = [];
                    for (let r = 0; r < THUMBNAIL_ROW_SIZE; r++) {
                        const count = i + r;
                        if (count >= length) {
                            break;
                        }
                        const inputPath = join(tmpDir, `${String(count).padStart(4, '0')}.png`);
                        inputPaths.push(inputPath);
                    }
                    const inputPathsCommand = inputPaths.map((inputPath) => `-i "${inputPath}"`).join(' ');
                    const outputFile = getThumbnailsName(rows);
                    const outputPath = join(tmpDir, outputFile);
                    const hstackCommand = `${this.ffmpeg} ${inputPathsCommand} -filter_complex hstack=inputs=${inputPaths.length} -qscale ${THUMBNAIL_JPEG_QUALITY} ${outputPath}`;
                    await execPromise(hstackCommand).catch((error) => {
                        console.error(error);
                    });
                    outputFiles.push(outputFile);
                    rows++;
                }
                const { metaDir } = parsePath(path);
                await mkdir(metaDir, { recursive: true });
                for (const file of outputFiles) {
                    const srcPath = join(tmpDir, file);
                    const destPath = join(metaDir, file);
                    await copyFile(srcPath, destPath).catch((error) => {
                        console.error(error);
                    });
                }
                resolve(true);
            })();
        });
    }
}
