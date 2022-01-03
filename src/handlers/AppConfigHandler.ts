import { BAD_REQUEST } from '../utils/ServerResponseUtils';
import { RequestHandler, RequestMethod } from '../types';

export const appConfigHandler: RequestHandler & { get: RequestMethod; post: RequestMethod } = {
    path: '/appConfig',
    get: ({ appConfig }) => {
        return appConfig;
    },
    post: ({ apiServer, appConfig, body }) => {
        if (body === undefined) {
            return BAD_REQUEST;
        }
        const updatedAppConfig = { ...appConfig, ...(body as object) };
        return apiServer.saveAppConfig(updatedAppConfig);
    },
};
