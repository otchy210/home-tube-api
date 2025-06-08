import { RequestContext } from '../types';
import { listFolders } from '../utils/FolderUtils';
import { foldersHandler } from './FoldersHandler';

describe('foldersHandler', () => {
    it('returns folders of enabled storages', () => {
        const appConfig = {
            storages: [
                { path: 'test/storage2', enabled: true },
                { path: 'test/storage1', enabled: false },
            ],
        };
        const context = { appConfig } as RequestContext;
        const response = foldersHandler.get(context);
        expect(response.body).toStrictEqual([listFolders('test/storage2')]);
    });
});
