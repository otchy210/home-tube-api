import { dirname, join } from 'path';
import { handleVideoPathUpdate, VideoPathUpdateHandler } from './VideoPathUpdateHandler';

export const renameHandler: VideoPathUpdateHandler = {
    path: '/rename',
    post: (context) =>
        handleVideoPathUpdate(context, {
            operation: 'rename',
            buildDestPath: (srcPath, params) => {
                return typeof params.name === 'string' && params.name ? join(dirname(srcPath), params.name) : undefined;
            },
        }),
};
