import { Collection } from '@otchy/sim-doc-db';
import { Query, Document, Field } from '@otchy/sim-doc-db/dist/types';
import { basename } from 'path';
import { VideoMeta } from '../types';

const DELIM = /[/\\]+/;

type LengthTag = {
    length: number;
    tag: string;
    label: string;
};
const LENGTH_TAGS: LengthTag[] = [
    { length: 30, tag: 'moment', label: 'Moment (<=30s)' },
    { length: 60 * 5, tag: 'short', label: 'Short (<=5m)' },
    { length: 60 * 20, tag: 'middle', label: 'Middle (<=20m)' },
    { length: 60 * 60, tag: 'long', label: 'Long (<=1h)' },
    { length: 60 * 60 * 24, tag: 'movie', label: 'Movie (1h+)' },
];

type SizeTag = {
    size: number;
    tag: string;
    label: string;
};
const SIZE_TAGS: SizeTag[] = [
    { size: 720, tag: 'sd', label: 'SD (~720×480)' },
    { size: 1280, tag: 'hd', label: 'HD (~1280×720)' },
    { size: 1920, tag: 'fhd', label: 'Full HD (~1920×1080)' },
    { size: 3840, tag: '4k', label: '4K (~3840×2160)' },
    { size: 7680, tag: '8k', label: '8K (~7680×4320)' },
];

export const parsePath = (path: string): string[] => {
    return path
        .split(DELIM)
        .filter((name) => {
            return !(name.length === 0 || name === '.' || name === '..');
        })
        .map((name, i, array) => {
            if (i !== array.length - 1) {
                return name;
            }
            const dotIndex = name.lastIndexOf('.');
            return name.substring(0, dotIndex);
        });
};

const fields: Field[] = [
    { name: 'path', type: 'tag', indexed: true },
    { name: 'name', type: 'string', indexed: false },
    { name: 'names', type: 'string[]', indexed: true },
    { name: 'duration', type: 'string', indexed: false },
    { name: 'length', type: 'tag', indexed: true },
    { name: 'width', type: 'number', indexed: false },
    { name: 'height', type: 'number', indexed: false },
    { name: 'size', type: 'tag', indexed: true },
];

const collection = new Collection(fields);

const VideoCollection = {
    add: (path: string) => {
        const name = basename(path);
        const names = parsePath(path);
        collection.add({
            values: { path, name, names },
        });
    },
    updateMeta: (path: string, meta: VideoMeta) => {
        const results = collection.find({ path });
        if (results.size === 0) {
            return;
        }
        const doc = results.values().next().value as Document;
        if (meta.duration) {
            doc.values.duration = meta.duration;
        }
        if (meta.length) {
            for (const lengthTag of LENGTH_TAGS) {
                if (meta.length <= lengthTag.length) {
                    doc.values.length = lengthTag.tag;
                    break;
                }
            }
        }
        if (meta.width && meta.height) {
            doc.values.width = meta.width;
            doc.values.height = meta.height;
            const size = Math.max(meta.width, meta.height);
            for (const sizeTag of SIZE_TAGS) {
                if (size <= sizeTag.size) {
                    doc.values.size = sizeTag.tag;
                    break;
                }
            }
        }
        collection.update(doc);
    },
    remove: (path: string) => {
        collection.removeMatched({ path });
    },
    find: (query: Query): Set<Document> => {
        return collection.find(query);
    },
    size: (): number => {
        return collection.size;
    },
};

export default VideoCollection;
