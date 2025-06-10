import { RequestHandler, RequestMethod } from '../types';
import { listFolders } from '../utils/FolderUtils';

export const foldersHandler: RequestHandler & { get: RequestMethod } = {
    path: '/folders',
    get: ({ appConfig }) => {
        const result = appConfig.storages.filter((s) => s.enabled).map((s) => listFolders(s.path));
        return { body: result };
    },
};
