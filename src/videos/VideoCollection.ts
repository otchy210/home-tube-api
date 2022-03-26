import { Collection } from '@otchy/sim-doc-db';
import { Query, Document, Field } from '@otchy/sim-doc-db/dist/types';
import { basename } from 'path';
import { LENGTH_TAGS, SIZE_TAGS } from '../const';
import { AllTags, VideoMeta, VideoProperties } from '../types';
import { sha256 } from '../utils/StringUtils';

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
    { name: 'key', type: 'tag', indexed: true },
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
    { name: 'mtime', type: 'number', indexed: false },
];

class VideoCollection {
    private collection = new Collection(fields);

    public get(key: string): Document {
        const set = this.collection.find({ key });
        if (set.size === 0) {
            throw new Error(`Document not found: key = ${key}`);
        }
        return set.values().next().value;
    }
    public getAll(): Set<Document> {
        return this.collection.getAll();
    }
    public add(path: string): void {
        const normalizedPath = path.normalize();
        const key = sha256(normalizedPath);
        const name = basename(normalizedPath);
        const names = getNames(normalizedPath);
        this.collection.add({
            values: { key, path, name, names },
        });
    }
    public updateMeta(query: Query, meta: VideoMeta): Document | undefined {
        const results = this.collection.find(query);
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
        if (meta.mtime) {
            doc.values.mtime = meta.mtime;
        }
        return this.collection.update(doc);
    }
    public updateProperties(query: Query, properties: VideoProperties): Document | undefined {
        const results = this.collection.find(query);
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
    public getAllTags(): AllTags {
        const keys = this.collection.getKeys('tags') as Map<string, number>;
        return Array.from(keys.entries())
            .filter((entry) => entry[1] > 0)
            .reduce((map, [key, count]) => {
                map[key] = count;
                return map;
            }, {} as AllTags);
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
