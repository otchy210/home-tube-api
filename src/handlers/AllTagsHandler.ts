import { RequestHandler, RequestMethod } from '../types';
import { useVideoCollection } from '../videos/VideoCollection';

export const allTagsHandler: RequestHandler & { get: RequestMethod } = {
    path: '/allTags',
    get: () => {
        const collection = useVideoCollection();
        return collection.getAllTags();
    },
};
