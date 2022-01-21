import { basename, dirname, join } from 'path';
import { md5 } from './StringUtils';

const META_DIR = '.home-tube';

type ParsedPath = {
    name: string;
    hashedName: string;
    dir: string;
    metaDir: string;
};

export const parsePath = (path: string): ParsedPath => {
    const name = basename(path);
    const hashedName = md5(name);
    const dir = dirname(path);
    const metaDir = join(dir, META_DIR, hashedName);
    return {
        name,
        hashedName,
        dir,
        metaDir,
    };
};
