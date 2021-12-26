import { Collection } from '@otchy/sim-doc-db';
import { Query, Document, Field } from '@otchy/sim-doc-db/dist/types';

const DELIM = /[/\\]+/;

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
    { name: 'names', type: 'string[]', indexed: true },
];

const collection = new Collection(fields);

const VideoCollection = {
    add: (path: string) => {
        const names = parsePath(path);
        collection.add({
            values: { path, names },
        });
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
