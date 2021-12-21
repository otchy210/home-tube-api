import { saveAppConfig } from './AppConfigUtils';
import { BAD_REQUEST } from './ServerResponseUtils';
import { RequestHandler } from './types';

export const appConfigHandler: RequestHandler = {
    path: '/appConfig',
    get: ({ appConfig }) => {
        return appConfig;
    },
    post: ({ apiServer, appConfig, body }) => {
        if (body === undefined) {
            return BAD_REQUEST;
        }
        const updatedAppConfig = { ...appConfig, ...(body as object) };
        saveAppConfig(apiServer.getAppConfigPath(), updatedAppConfig);
        return updatedAppConfig;
    },
};
