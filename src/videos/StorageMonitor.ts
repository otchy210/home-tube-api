import { join } from 'path';
import { META_DIR } from '../const';
import { StorageMonitorStatus } from '../types';
import { readdir } from '../utils/fsPromises';

// https://en.wikipedia.org/wiki/Video_file_format
const MOVIE_EXTENSIONS = new Set(['webm', 'mkv', 'flv', 'avi', 'mov', 'wmv', 'rm', 'mp4', 'm4v', 'mpg', 'mpg2', 'mpeg', 'mpeg2', '3gp']);

export const getExtension = (name: string): string => {
    const dotIndex = name.lastIndexOf('.');
    return name.substring(dotIndex + 1).toLowerCase();
};

export const readDir = (path: string, set: Set<string>): Promise<boolean> => {
    return new Promise((resolve) => {
        readdir(path, { withFileTypes: true }).then((dirents) => {
            const promises: Promise<boolean>[] = [];
            for (const dirent of dirents) {
                const currentPath = join(path, dirent.name);
                if (dirent.isDirectory()) {
                    if (dirent.name !== META_DIR) {
                        promises.push(readDir(currentPath, set));
                    }
                } else if (dirent.isFile()) {
                    const extension = getExtension(dirent.name);
                    if (MOVIE_EXTENSIONS.has(extension)) {
                        set.add(currentPath);
                    }
                }
            }
            Promise.all(promises).then(() => {
                resolve(true);
            });
        });
    });
};

export type StorageListener = (added: Set<string>, removed: Set<string>) => Promise<void>;

export default class StorageMonitor {
    private path: string;
    private intervalInSecond: number;
    private current = new Set<string>();
    private listener: StorageListener;
    private tid: NodeJS.Timeout | undefined;
    private status: StorageMonitorStatus = 'initialized';

    public constructor(path: string, intervalInSecond: number, listener: StorageListener) {
        this.path = path;
        this.intervalInSecond = intervalInSecond;
        this.listener = listener;
    }

    public retrieve(): Promise<Set<string>> {
        this.status = 'reading';
        return new Promise((resolve) => {
            const set = new Set<string>();
            readDir(this.path, set).then(() => {
                resolve(set);
            });
        });
    }

    public monitor() {
        if (this.status === 'stopped') {
            return;
        }
        this.status = 'waiting';
        this.tid = setTimeout(async () => {
            const previous = this.current;
            const current = await this.retrieve();
            const added = new Set(Array.from(current).filter((path) => !previous.has(path)));
            const removed = new Set(Array.from(previous).filter((path) => !current.has(path)));
            if (added.size > 0 || removed.size > 0) {
                this.listener(added, removed);
            }
            this.current = current;
            this.monitor();
        }, this.intervalInSecond * 1000);
    }

    public start(): Promise<Set<string>> {
        return new Promise((resolve) => {
            this.retrieve().then((result) => {
                this.current = result;
                this.listener(result, new Set());
                this.monitor();
                resolve(result);
            });
        });
    }

    public stop(): void {
        if (this.tid !== undefined) {
            clearTimeout(this.tid);
        }
        this.listener(new Set(), this.current);
        this.status = 'stopped';
    }

    public rename(srcPath: string, destPath: string): Promise<void> {
        const added = new Set<string>([destPath]);
        const removed = new Set<string>([srcPath]);
        return this.listener(added, removed);
    }

    public getStatus() {
        return {
            size: this.current.size,
            status: this.status,
        };
    }
}
