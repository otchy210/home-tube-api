import { execSync } from 'child_process';
import { VideoMeta } from '../types';

const getFFmpeg = (): string => {
    return execSync('which ffmpeg').toString().trim();
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

export default class FFmpeg {
    private ffmpeg: string;

    constructor(ffmpeg = '') {
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
        return { ...metaDuration, ...metaVideo, ...metaAudio };
    }
}
