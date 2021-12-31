import VideoCollection from '../videos/VideoCollection';
import { RequestHandler } from '../types';
import { Query } from '@otchy/sim-doc-db/dist/types';
import { BAD_REQUEST } from '../utils/ServerResponseUtils';

const ALLOWED_SEARCH_PARAMS = ['names', 'length', 'size'];

export const searchHandler: RequestHandler = {
    path: '/search',
    get: ({ params }) => {
        if (!params) {
            return BAD_REQUEST;
        }
        for (const allowedParam of ALLOWED_SEARCH_PARAMS) {
            if (!params[allowedParam]) {
                return BAD_REQUEST;
            }
        }
        const results = VideoCollection.find(params as Query);
        return Array.from(results);
    },
};
