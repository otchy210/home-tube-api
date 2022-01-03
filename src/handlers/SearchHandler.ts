import { RequestHandler, RequestMethod } from '../types';
import { Query } from '@otchy/sim-doc-db/dist/types';
import { BAD_REQUEST } from '../utils/ServerResponseUtils';
import { useVideoCollection } from '../videos/VideoCollection';

const ALLOWED_SEARCH_PARAMS = new Set<string>(['names', 'length', 'size']);

export const searchHandler: RequestHandler & { get: RequestMethod } = {
    path: '/search',
    get: ({ params }) => {
        if (!params) {
            return BAD_REQUEST;
        }
        for (const param of Object.keys(params)) {
            if (!ALLOWED_SEARCH_PARAMS.has(param)) {
                return BAD_REQUEST;
            }
        }
        const videoCollection = useVideoCollection();
        const results = videoCollection.find(params as Query);
        return Array.from(results);
    },
};
