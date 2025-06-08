import { readdirSync, Dirent } from 'fs';
import { basename, join } from 'path';
import { META_DIR } from '../const';
import { Folder } from '../types';

export const listFolders = (path: string): Folder => {
    const name = basename(path);
    const folders: Folder[] = [];
    try {
        const dirents = readdirSync(path, { withFileTypes: true });
        dirents.forEach((dirent: Dirent) => {
            if (!dirent.isDirectory()) {
                return;
            }
            if (dirent.name === META_DIR) {
                return;
            }
            const childPath = join(path, dirent.name);
            folders.push(listFolders(childPath));
        });
    } catch {
        // ignore unreadable directories
    }
    return { path, name, folders };
};
