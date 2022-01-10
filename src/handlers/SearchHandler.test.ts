import { RequestContext, RequestParams, VideoDocument } from '../types';
import { BAD_REQUEST } from '../utils/ServerResponseUtils';
import { useVideoCollection } from '../videos/VideoCollection';
import { searchHandler } from './SearchHandler';
import { Document } from '@otchy/sim-doc-db/dist/types';

describe('SearchHandler', () => {
    describe('get', () => {
        const videoCollection = useVideoCollection();
        jest.spyOn(videoCollection, 'getAll');
        jest.spyOn(videoCollection, 'find');
        const mockedGetAll = videoCollection.getAll as jest.Mock;
        mockedGetAll.mockReturnValue(
            new Set<Document>([
                { id: 1, values: { name: 'test-movie1.mp4' } },
                { id: 2, values: { name: 'test-movie2.mp4' } },
                { id: 3, values: { name: 'test-movie3.mp4' } },
                { id: 4, values: { name: 'test-movie4.mp4' } },
            ] as Document[])
        );
        const mockedFind = videoCollection.find as jest.Mock;
        mockedFind.mockReturnValue(
            new Set<Document>([
                { id: 2, values: { name: 'test-movie2.mp4' } },
                { id: 4, values: { name: 'test-movie4.mp4' } },
            ] as Document[])
        );

        it('returns all videos when no params', () => {
            const mockedContext = {} as RequestContext;
            const searchResults = searchHandler.get(mockedContext) as VideoDocument[];
            expect(searchResults.length).toBe(4);
        });
        it('returns all videos when params has no keys', () => {
            const mockedContext = { params: {} } as RequestContext;
            const searchResults = searchHandler.get(mockedContext) as VideoDocument[];
            expect(searchResults.length).toBe(4);
        });
        it('returns BAD_REQUEST when params has invalid param', () => {
            const mockedContext = {
                params: {
                    invalid: 'dummy',
                } as RequestParams,
            } as RequestContext;
            expect(searchHandler.get(mockedContext)).toBe(BAD_REQUEST);
        });
        it('returns proper results when params has all valid parameters', () => {
            const mockedContext = {
                params: {
                    names: 'dummy',
                    length: 'moment',
                    size: 'sd',
                } as RequestParams,
            } as RequestContext;
            const searchResults = searchHandler.get(mockedContext) as VideoDocument[];
            expect(searchResults.length).toBe(2);
        });
    });
});
