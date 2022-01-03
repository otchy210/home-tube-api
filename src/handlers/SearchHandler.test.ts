import { RequestContext, RequestParams } from '../types';
import { BAD_REQUEST } from '../utils/ServerResponseUtils';
import { searchHandler } from './SearchHandler';

describe('SearchHandler', () => {
    describe('get', () => {
        it('returns BAD_REQUEST when no params', () => {
            const mockedContext = {} as RequestContext;
            expect(searchHandler.get(mockedContext)).toBe(BAD_REQUEST);
        });
        it('returns BAD_REQUEST when params has invalid param', () => {
            const mockedContext = {
                params: {
                    invalid: 'dummy',
                } as RequestParams,
            } as RequestContext;
            expect(searchHandler.get(mockedContext)).toBe(BAD_REQUEST);
        });
        it('returns empty results when params has all valid parameters', () => {
            const mockedContext = {
                params: {
                    names: 'dummy',
                    length: 'moment',
                    size: 'sd',
                } as RequestParams,
            } as RequestContext;
            expect(searchHandler.get(mockedContext)).toEqual([]);
        });
    });
});
