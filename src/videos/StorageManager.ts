import { existsSync, mkdirSync, readdirSync, renameSync, rmdirSync } from 'fs';
import { join } from 'path';
import { StorageStatus } from '../types';
import logger from '../utils/logger';
import { parsePath } from '../utils/PathUtils';
import { useMetaManager } from './MetaManager';
import StorageMonitor, { StorageListener } from './StorageMonitor';

const MONITOR_INTERVAL = 10 * 60; // 10 mins

class StorageManager {
    private monitorMap = new Map<string, StorageMonitor>();

    public add(path: string, storageListener: StorageListener): void {
        logger.debug('StorageManager.add', path);
        if (this.monitorMap.has(path)) {
            return;
        }
        const monitor = new StorageMonitor(path, MONITOR_INTERVAL, storageListener);
        this.monitorMap.set(path, monitor);
        monitor.start();
    }

    public remove(path: string) {
        logger.debug('StorageManager.remove', path);
        if (!this.monitorMap.has(path)) {
            return;
        }
        this.monitorMap.get(path)?.stop();
        this.monitorMap.delete(path);
    }

    public getStatus(): StorageStatus {
        return Array.from(this.monitorMap.entries())
            .sort(([leftPath], [rightPath]) => {
                return leftPath.localeCompare(rightPath);
            })
            .reduce((status, [path, storageMonitor]) => {
                status[path] = storageMonitor.getStatus();
                return status;
            }, {} as StorageStatus);
    }

    public async rename(srcPath: string, destPath: string): Promise<void> {
        if (!existsSync(srcPath)) {
            return Promise.reject(`${srcPath} does't exist`);
        }
        if (existsSync(destPath)) {
            return Promise.reject(`${destPath} exists already`);
        }
        const srcMonitor = this.getMonitor(srcPath);
        const destMonitor = this.getMonitor(destPath);
        if (!srcMonitor) {
            return Promise.reject(`srcMonitor not found: ${srcPath}`);
        }
        if (!destMonitor) {
            return Promise.reject(`destMonitor not found: ${destPath}`);
        }
        if (srcMonitor !== destMonitor) {
            return Promise.reject(`srcPath and destPath should belong to the same storage: ${srcPath}, ${destPath}`);
        }

        this.renameFileAndMetaDir(srcPath, destPath);

        return destMonitor.rename(srcPath, destPath);
    }

    private getMonitor(videoPath: string): StorageMonitor | undefined {
        const monitors = Array.from(this.monitorMap.entries())
            .filter(([path]) => {
                return videoPath.startsWith(path);
            })
            .map((entry) => entry[1]);
        if (monitors.length === 0) {
            return undefined;
        } else if (monitors.length > 1) {
            console.warn(`Found multiple StorageMonitors: ${videoPath}`);
        }
        return monitors[0];
    }

    public renameFileAndMetaDir(srcPath: string, destPath: string) {
        const { metaDir: srcMetaDir } = parsePath(srcPath);
        const { metaDir: destMetaDir } = parsePath(destPath);

        // rename meta dir
        if (existsSync(srcMetaDir)) {
            if (!existsSync(destMetaDir)) {
                mkdirSync(destMetaDir);
            }
            readdirSync(srcMetaDir).forEach((file) => {
                if (file.startsWith('.')) {
                    return;
                }
                const srcFile = join(srcMetaDir, file);
                const destFile = join(destMetaDir, file);
                if (!existsSync(destFile)) {
                    renameSync(srcFile, destFile);
                }
            });
            rmdirSync(srcMetaDir, { recursive: true });
        }

        // update name in meta data
        useMetaManager().rename(destPath);

        // rename video file
        renameSync(srcPath, destPath);
    }

    public stopAllMonitors() {
        Array.from(this.monitorMap.entries()).forEach((entry) => {
            entry[1].stop();
        });
    }
}

const instance = new StorageManager();

export const useStorageManager = () => {
    return instance;
};
