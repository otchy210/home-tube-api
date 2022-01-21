import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { VideoProperties } from '../types';
import { parsePath } from '../utils/PathUtils';
import { useVideoCollection } from './VideoCollection';

const PROPERTIES_FILE = 'properties.json';

export const getPropertiesPath = (metaDir: string): string => {
    return join(metaDir, PROPERTIES_FILE);
};

class PropertiesManager {
    public get(path: string): VideoProperties {
        const { metaDir } = parsePath(path);
        const propertiesPath = getPropertiesPath(metaDir);
        if (!existsSync(propertiesPath)) {
            return {};
        }
        const properties = JSON.parse(readFileSync(propertiesPath).toString()) as VideoProperties;
        const videoCollection = useVideoCollection();
        videoCollection.updateProperties({ path }, properties);
        return properties;
    }
    public update(path: string, properties: VideoProperties): VideoProperties {
        const { metaDir } = parsePath(path);
        const propertiesPath = getPropertiesPath(metaDir);
        writeFileSync(propertiesPath, JSON.stringify(properties));
        const videoCollection = useVideoCollection();
        videoCollection.updateProperties({ path }, properties);
        return properties;
    }
}

const instance = new PropertiesManager();

export const usePropertiesManager = (): PropertiesManager => {
    return instance;
};
