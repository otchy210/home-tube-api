import { StorageStatus } from '../types';
import logger from '../utils/logger';
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
}

const instance = new StorageManager();

export const useStorageManager = () => {
    return instance;
};
