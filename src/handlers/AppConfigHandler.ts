import { RequestHandler, RequestMethod } from '../types';
import { validateAppConfig } from '../utils/AppConfigUtils';
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

        const errors = validateAppConfig(updatedAppConfig);
        if (errors.length > 0) {
            return { body: errors };
        }
        return { body: apiServer.saveAppConfig(updatedAppConfig) };
    },
};
