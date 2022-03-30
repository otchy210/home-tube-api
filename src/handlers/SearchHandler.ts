import { Query } from '@otchy/sim-doc-db/dist/types';
import { RequestHandler, RequestMethod } from '../types';
import { BAD_REQUEST } from '../utils/ServerResponseUtils';
import { useVideoCollection } from '../videos/VideoCollection';

const ALLOWED_SEARCH_PARAMS = new Set<string>(['names', 'length', 'size', 'stars', 'tags']);

export const searchHandler: RequestHandler & { get: RequestMethod } = {
    path: '/search',
    get: ({ params }) => {
        const videoCollection = useVideoCollection();
        if (!params) {
            return { body: Array.from(videoCollection.getAll()) };
        }
        delete params.page;
        if (Object.keys(params).length === 0) {
            return { body: Array.from(videoCollection.getAll()) };
        }
        for (const param of Object.keys(params)) {
            if (!ALLOWED_SEARCH_PARAMS.has(param)) {
                return { body: BAD_REQUEST };
            }
        }
        const results = videoCollection.find(params as Query);
        return { body: Array.from(results) };
    },
};
