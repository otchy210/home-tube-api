import { propertiesHandler } from './PropertiesHandler';
import { RequestContext, RequestParams, Json } from '../types';
import * as dh from './DetailsHandler';
import { BAD_REQUEST } from '../utils/ServerResponseUtils';
import { usePropertiesManager } from '../videos/PropertiesManager';

describe('PropertiesHandler', () => {
    const path = 'test/test-movie.mp4';
    jest.spyOn(dh, 'validateAndGetVideo').mockReturnValue({
        path,
    });
    const propertiesManager = usePropertiesManager();
    describe('post', () => {
        it('returns BAD_REQUEST when no body', () => {
            const mockedContext = {} as RequestContext;
            expect(propertiesHandler.post(mockedContext)).toBe(BAD_REQUEST);
        });
        it('updates only stars property', () => {
            const mockedContext = {
                body: { stars: 1 } as Json,
            } as RequestContext;
            const origProperties = propertiesManager.get(path);
            expect(propertiesHandler.post(mockedContext)).toStrictEqual({
                stars: 1,
                tags: ['tag1', 'tag2', 'tag3'],
            });
            propertiesManager.update(path, origProperties);
        });
        it('updates both stars and tags properties', () => {
            const mockedContext = {
                params: {} as RequestParams,
                body: { stars: 1, tags: ['tag4', 'tag5'] } as Json,
            } as RequestContext;
            const origProperties = propertiesManager.get(path);
            expect(propertiesHandler.post(mockedContext)).toStrictEqual({
                stars: 1,
                tags: ['tag4', 'tag5'],
            });
            propertiesManager.update(path, origProperties);
        });
    });
});
