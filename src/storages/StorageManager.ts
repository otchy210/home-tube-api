import logger from '../utils/logger';
import StorageMonitor, { StorageListener } from './StorageMonitor';

const MONITOR_INTERVAL = 10 * 60; // 10 mins

export class StorageManager {
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
}
