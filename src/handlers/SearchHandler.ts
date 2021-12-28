import VideoCollection from '../videos/VideoCollection';
import { RequestHandler } from '../types';
import { Query, ValueType } from '@otchy/sim-doc-db/dist/types';

const ALLOWED_SEARCH_PARAMS = ['names', 'length', 'size'];

export const searchHandler: RequestHandler = {
    path: '/search',
    get: ({ params }) => {
        if (!params) {
            return {};
        }
        const searchParams: Query = {};
        for (const allowedParam of ALLOWED_SEARCH_PARAMS) {
            if (params[allowedParam]) {
                searchParams[allowedParam] = params[allowedParam] as ValueType;
            }
        }
        const results = VideoCollection.find(searchParams);
        return Array.from(results);
    },
};
