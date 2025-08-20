import { listFolders } from './FolderUtils';

describe('listFolders', () => {
    it('returns nested folder structure', () => {
        const tree = listFolders('test/storage2');
        expect(tree).toStrictEqual({
            path: 'test/storage2',
            name: 'storage2',
            folders: [
                {
                    path: 'test/storage2/a',
                    name: 'a',
                    folders: [
                        {
                            path: 'test/storage2/a/b',
                            name: 'b',
                            folders: [
                                {
                                    path: 'test/storage2/a/b/a',
                                    name: 'a',
                                    folders: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    path: 'test/storage2/b',
                    name: 'b',
                    folders: [],
                },
            ],
        });
    });
});
