import { LengthTag, SizeTag, Stars } from './types';

export const DEFAULT_API_PORT = 8210;

export const DEFAULT_APP_CONFIG_FILE = '.home-tube-config.json';

export const META_DIR = '.home-tube';

export const THUMBNAIL = {
    SIZE: 240,
    ROW_SIZE: 60,
    JPEG_QUALITY: 5,
};

export const SNAPSHOT = {
    FILE: 'snapshot.jpg',
    SIZE: 720,
    JPEG_QUALITY: 1,
    TMP_PNG_FILE: 'snapshot.png',
};

export const CONVERTED_MP4 = 'converted.mp4';

export const POSSIBLE_STARS: Stars[] = [1, 2, 3, 4, 5];

export const LENGTH_TAGS: LengthTag[] = [
    { length: 30, tag: 'moment', label: 'Moment (<=30s)' },
    { length: 60 * 5, tag: 'short', label: 'Short (<=5m)' },
    { length: 60 * 20, tag: 'middle', label: 'Middle (<=20m)' },
    { length: 60 * 60, tag: 'long', label: 'Long (<=1h)' },
    { length: 60 * 60 * 24, tag: 'movie', label: 'Movie (1h+)' },
];

export const SIZE_TAGS: SizeTag[] = [
    { size: 720, tag: 'sd', label: 'SD (~720x480)' },
    { size: 1280, tag: 'hd', label: 'HD (~1280x720)' },
    { size: 1920, tag: 'fhd', label: 'Full HD (~1920x1080)' },
    { size: 3840, tag: '4k', label: '4K (~3840x2160)' },
    { size: 7680, tag: '8k', label: '8K (~7680x4320)' },
];
