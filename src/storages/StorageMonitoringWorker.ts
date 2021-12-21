import { readdir } from 'fs/promises';
import { join } from 'path';

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
                    promises.push(readDir(currentPath, set));
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

type Listener = (added: Set<string>, removed: Set<string>) => void;

export default class StorageMonitoringWorker {
    private path: string;
    private intervalInSecond: number;
    private current = new Set<string>();
    private listener: Listener;
    private tid: NodeJS.Timeout | undefined;
    private stopped = false;

    public constructor(path: string, intervalInSecond: number, listener: Listener) {
        this.path = path;
        this.intervalInSecond = intervalInSecond;
        this.listener = listener;
    }

    public retrieve(): Promise<Set<string>> {
        return new Promise((resolve) => {
            const set = new Set<string>();
            readDir(this.path, set).then(() => {
                resolve(set);
            });
        });
    }

    public monitor() {
        if (this.stopped) {
            return;
        }
        this.tid = global.setTimeout(async () => {
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
                if (result.size > 0) {
                    this.listener(result, new Set());
                }
                this.monitor();
                resolve(result);
            });
        });
    }

    public stop(): void {
        if (this.tid !== undefined) {
            clearTimeout(this.tid);
        }
        this.stopped = true;
    }
}
