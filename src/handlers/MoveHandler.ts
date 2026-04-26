import { basename, join } from 'path';
import { handleVideoPathUpdate, VideoPathUpdateHandler } from './VideoPathUpdateHandler';

export const moveHandler: VideoPathUpdateHandler = {
    path: '/move',
    post: (context) =>
        handleVideoPathUpdate(context, {
            operation: 'move',
            buildDestPath: (srcPath, params) => {
                return typeof params.dest === 'string' ? join(params.dest, basename(srcPath)) : undefined;
            },
        }),
};
