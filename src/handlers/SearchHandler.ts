import VideoCollection from '../storages/VideoCollection';
import { RequestHandler } from '../types';

export const searchHandler: RequestHandler = {
    path: '/search',
    get: ({ params }) => {
        if (!params) {
            return {};
        }
        const { names } = params as { names: string };
        const results = VideoCollection.find({ names });
        return Array.from(results);
    },
};
