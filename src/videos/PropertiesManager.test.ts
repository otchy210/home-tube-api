import { VideoProperties } from '../types';
import { usePropertiesManager } from './PropertiesManager';

describe('PropertiesManager', () => {
    const propertiesManager = usePropertiesManager();
    describe('get', () => {
        it('returns empty object if no properties file', () => {
            const properties = propertiesManager.get('test/storage1/test-movie.wmv');
            expect(properties).toEqual({});
        });
        it('reads properties file properly when it exists', () => {
            const properties = propertiesManager.get('test/storage1/test-movie.mp4');
            expect(properties).toStrictEqual({
                stars: 5,
                tags: ['tag1', 'tag2', 'tag3'],
            });
        });
    });
    describe('update', () => {
        it('update properties file properly', () => {
            const path = 'test/storage1/test-movie.mp4';
            const origProperties = propertiesManager.get(path);
            const updatedProperties = {
                stars: 1,
                tags: ['tagA', 'tagB', 'tagC'],
            } as VideoProperties;
            propertiesManager.update(path, updatedProperties);
            expect(propertiesManager.get(path)).toStrictEqual(updatedProperties);
            propertiesManager.update(path, origProperties);
        });
    });
});
