import { RequestHandler } from './types';

export const appConfigHandler: RequestHandler = {
    path: '/appConfig',
    get: ({ appConfig }) => {
        return appConfig;
    },
};
