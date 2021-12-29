import { basename, dirname, join } from 'path';
import { createHash } from 'crypto';

const META_DIR = '.home-tube';

export const hash = (str: string): string => {
    return createHash('md5').update(str).digest('hex');
};

type ParsedPath = {
    name: string;
    hashedName: string;
    dir: string;
    metaDir: string;
};

export const parsePath = (path: string): ParsedPath => {
    const name = basename(path);
    const hashedName = hash(name);
    const dir = dirname(path);
    const metaDir = join(dir, META_DIR, hashedName);
    return {
        name,
        hashedName,
        dir,
        metaDir,
    };
};
