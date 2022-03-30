import { execSync } from 'child_process';
import { statSync } from 'fs';
import { basename, join } from 'path';
import { CONVERTED_MP4, SNAPSHOT, THUMBNAIL } from '../const';
import { VideoMeta } from '../types';
import { execPromise } from '../utils/ChildProcessUtils';
import { copyFile, mkdir, writeFile } from '../utils/fsPromises';
import logger from '../utils/logger';
import { parsePath } from '../utils/PathUtils';
import { formatTimeInSecond } from '../utils/TimeUtils';

const getFFmpeg = (): string => {
    return execSync('which ffmpeg').toString().trim();
};

const getRandomTmpDir = (): Promise<string> => {
    const envTmp = process.env.TMPDIR ?? process.env.TMP ?? process.env.TEMP ?? '/tmp';
    const timeStr = Date.now().toString(32);
    const randStr = Math.random().toString(32).substring(2);
    const tmpDirPath = join(envTmp, 'home-tube', `${timeStr}-${randStr}`);
    return new Promise<string>((resolve) => {
        mkdir(tmpDirPath, { recursive: true }).then(() => {
            resolve(tmpDirPath);
        });
    });
};

const parseMetaDuration = (line: string): { duration: string; length: number } => {
    const duration = line.trim().split(' ')[1].split(',')[0];
    const [hours, mins, secs] = duration.split(':');
    const length = parseInt(hours) * 3600 + parseInt(mins) * 60 + parseFloat(secs);
    return { duration: formatTimeInSecond(length), length };
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

const getMetaStats = (path: string) => {
    const stats = statSync(path);
    const fileSize = stats.size;
    const mtime = stats.mtime.getTime();
    return {
        fileSize,
        mtime,
    };
};

export const formatSeekTime = (positoin: number): string => {
    let sec = positoin;
    let min = 0;
    let hour = 0;
    while (sec >= 60 * 60) {
        hour++;
        sec -= 60 * 60;
    }
    while (sec >= 60) {
        min++;
        sec -= 60;
    }
    return [hour, min, sec]
        .map((num) => {
            return String(num).padStart(2, '0');
        })
        .join(':');
};

export const getThumbnailsName = (index: number): string => {
    return `thumbnails_${String(index).padStart(3, '0')}.jpg`;
};

const SUPPORTED_HEADER = 'data:image/png;base64,';
const saveDataURL = (path: string, dataURL: string) => {
    if (!dataURL.startsWith(SUPPORTED_HEADER)) {
        throw new Error('Only base64 image/png is supported');
    }
    const base64 = dataURL.slice(SUPPORTED_HEADER.length);
    return writeFile(path, base64, 'base64');
};

export default class FFmpeg {
    private ffmpeg: string;

    constructor(ffmpeg?: string) {
        this.ffmpeg = ffmpeg || getFFmpeg();
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
        const metaStats = getMetaStats(path);
        const name = basename(path);
        return { name, ...metaDuration, ...metaVideo, ...metaAudio, ...metaStats };
    }

    public createThumbnails(path: string, meta: Required<VideoMeta>): Promise<boolean> {
        if (!meta.height || !meta.width || !meta.length) {
            return Promise.resolve(false);
        }
        const length = Math.floor(meta.length);
        return new Promise((resolve) => {
            (async () => {
                const tmpDir = await getRandomTmpDir();
                const scale = meta.width >= meta.height ? `${THUMBNAIL.SIZE}:-1` : `-1:${THUMBNAIL.SIZE}`;
                const outputPath = join(tmpDir, '%04d.png');
                const thumbnailsCommand = [this.ffmpeg, `-i "${path}"`, `-vf scale=${scale},fps=1`, `"${outputPath}"`].join(' ');
                await execPromise(thumbnailsCommand).catch((error) => {
                    logger.error(error);
                });
                let rows = 0;
                const outputFiles: string[] = [];
                for (let i = 1; i < length; i += THUMBNAIL.ROW_SIZE) {
                    const inputPaths: string[] = [];
                    for (let r = 0; r < THUMBNAIL.ROW_SIZE; r++) {
                        const count = i + r;
                        if (count >= length) {
                            break;
                        }
                        const inputPath = join(tmpDir, `${String(count).padStart(4, '0')}.png`);
                        inputPaths.push(inputPath);
                    }
                    const outputFile = getThumbnailsName(rows);
                    const outputPath = join(tmpDir, outputFile);
                    const hstackCommand = [
                        this.ffmpeg,
                        ...inputPaths.map((inputPath) => `-i "${inputPath}"`),
                        '-filter_complex',
                        `hstack=inputs=${inputPaths.length}`,
                        `-qscale ${THUMBNAIL.JPEG_QUALITY}`,
                        `"${outputPath}"`,
                    ].join(' ');
                    await execPromise(hstackCommand).catch((error) => {
                        logger.error(error);
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
                        logger.error(error);
                    });
                }
                resolve(true);
            })();
        });
    }

    private async handleSnapshot(
        path: string,
        meta: Required<VideoMeta>,
        tmpDir: string,
        resolve: (resolve: boolean) => void,
        options: { seekTime?: number; inputImagePath?: string; skipNoKeyFrame?: boolean }
    ) {
        const { seekTime, inputImagePath, skipNoKeyFrame } = options;
        const scale = meta.width >= meta.height ? `${SNAPSHOT.SIZE}:-1` : `-1:${SNAPSHOT.SIZE}`;
        const srcPath = join(tmpDir, SNAPSHOT.FILE);
        const snapshotCommand = [
            this.ffmpeg,
            skipNoKeyFrame ? `-skip_frame nokey` : undefined,
            `-i "${inputImagePath ?? path}"`,
            `-vf scale=${scale}`,
            seekTime ? `-ss ${formatSeekTime(seekTime)}` : undefined,
            seekTime ? '-frames:v 1' : undefined,
            `-qscale ${SNAPSHOT.JPEG_QUALITY}`,
            `"${srcPath}"`,
        ]
            .filter((option) => option)
            .join(' ');
        await execPromise(snapshotCommand).catch((error) => {
            logger.error(error);
        });
        const { metaDir } = parsePath(path);
        await mkdir(metaDir, { recursive: true });
        const destPath = join(metaDir, SNAPSHOT.FILE);
        await copyFile(srcPath, destPath).catch((error) => {
            logger.error(error);
        });
        resolve(true);
    }

    public createSnapshot(path: string, meta: Required<VideoMeta>, position?: number): Promise<boolean> {
        if (!meta.height || !meta.width || !meta.length) {
            return Promise.resolve(false);
        }
        const seekTime = position ?? Math.floor(meta.length / 2);
        return new Promise((resolve) => {
            (async () => {
                const tmpDir = await getRandomTmpDir();
                this.handleSnapshot(path, meta, tmpDir, resolve, { seekTime, skipNoKeyFrame: true });
            })();
        });
    }

    public updateSnapshot(path: string, meta: Required<VideoMeta>, dataURL: string): Promise<boolean> {
        return new Promise((resolve) => {
            (async () => {
                const tmpDir = await getRandomTmpDir();
                const inputImagePath = join(tmpDir, SNAPSHOT.TMP_PNG_FILE);
                await saveDataURL(inputImagePath, dataURL);
                this.handleSnapshot(path, meta, tmpDir, resolve, { inputImagePath });
            })();
        });
    }

    public convertToMp4(path: string): Promise<boolean> {
        return new Promise((resolve) => {
            (async () => {
                const tmpDir = await getRandomTmpDir();
                const outputPath = join(tmpDir, CONVERTED_MP4);
                const convertCommand = [this.ffmpeg, `-i "${path}"`, '-vf bwdif=0:-1:1', '-c:v libx264', '-pix_fmt yuv420p', `"${outputPath}"`].join(' ');
                await execPromise(convertCommand).catch((error) => {
                    logger.error(error);
                });
                const { metaDir } = parsePath(path);
                await mkdir(metaDir, { recursive: true });
                const destPath = join(metaDir, CONVERTED_MP4);
                await copyFile(outputPath, destPath).catch((error) => {
                    logger.error(error);
                });
                resolve(true);
            })();
        });
    }
}
