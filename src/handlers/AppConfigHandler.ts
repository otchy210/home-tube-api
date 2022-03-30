import { RequestHandler, RequestMethod } from '../types';
import { BAD_REQUEST } from '../utils/ServerResponseUtils';

export const appConfigHandler: RequestHandler & { get: RequestMethod; post: RequestMethod } = {
    path: '/appConfig',
    get: ({ appConfig }) => {
        return { body: appConfig };
    },
    post: ({ apiServer, appConfig, body }) => {
        if (!body) {
            return { body: BAD_REQUEST };
        }
        const updatedAppConfig = { ...appConfig, ...(body as object) };
        return { body: apiServer.saveAppConfig(updatedAppConfig) };
    },
};
