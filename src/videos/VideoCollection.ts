import { Collection } from '@otchy/sim-doc-db';
import { Query, Document, Field } from '@otchy/sim-doc-db/dist/types';
import { basename } from 'path';
import { VideoMeta, VideoProperties } from '../types';

type LengthTag = {
    length: number;
    tag: string;
    label: string;
};
export const LENGTH_TAGS: LengthTag[] = [
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
export const SIZE_TAGS: SizeTag[] = [
    { size: 720, tag: 'sd', label: 'SD (~720x480)' },
    { size: 1280, tag: 'hd', label: 'HD (~1280x720)' },
    { size: 1920, tag: 'fhd', label: 'Full HD (~1920x1080)' },
    { size: 3840, tag: '4k', label: '4K (~3840x2160)' },
    { size: 7680, tag: '8k', label: '8K (~7680x4320)' },
];

const PATH_DELIM = /[/\\]+/;

export const getNames = (path: string): string[] => {
    return path
        .split(PATH_DELIM)
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
    { name: 'stars', type: 'number', indexed: true },
    { name: 'tags', type: 'tags', indexed: true },
];

class VideoCollection {
    private collection = new Collection(fields);

    public get(id: number): Document {
        return this.collection.get(id);
    }
    public getAll(): Set<Document> {
        return this.collection.getAll();
    }
    public add(path: string): void {
        const name = basename(path);
        const names = getNames(path);
        this.collection.add({
            values: { path, name, names },
        });
    }
    public updateMeta(path: string, meta: VideoMeta): Document | undefined {
        const results = this.collection.find({ path });
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
        return this.collection.update(doc);
    }
    public updateProperties(path: string, properties: VideoProperties): Document | undefined {
        const results = this.collection.find({ path });
        if (results.size === 0) {
            return;
        }
        const doc = results.values().next().value as Document;
        if (properties.stars !== undefined) {
            if (properties.stars === null) {
                delete doc.values.stars;
            } else {
                doc.values.stars = properties.stars;
            }
        }
        if (properties.tags !== undefined) {
            if (properties.tags === null) {
                delete doc.values.tags;
            } else {
                doc.values.tags = properties.tags;
            }
        }
        return this.collection.update(doc);
    }
    public remove(path: string): void {
        this.collection.removeMatched({ path });
    }
    public find(query: Query): Set<Document> {
        return this.collection.find(query);
    }
    public size(): number {
        return this.collection.size;
    }
}

const instance = new VideoCollection();

export const useVideoCollection = (): VideoCollection => {
    return instance;
};
