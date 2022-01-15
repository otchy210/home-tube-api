import { BAD_REQUEST, isErrorResponse } from '../utils/ServerResponseUtils';
import { RequestHandler, RequestMethod } from '../types';
import { usePropertiesManager } from '../videos/PropertiesManager';
import { validateAndGetVideo } from '../utils/ServerRequestUtils';

export const propertiesHandler: RequestHandler & { post: RequestMethod } = {
    path: '/properties',
    post: ({ params, body }) => {
        const video = validateAndGetVideo(params);
        if (isErrorResponse(video)) {
            return video;
        }
        if (body === undefined) {
            return BAD_REQUEST;
        }
        const path = video.path as string;
        const propertiesManager = usePropertiesManager();
        const currentProperties = propertiesManager.get(path);
        const updatedProperties = { ...currentProperties, ...(body as object) };
        return propertiesManager.update(path, updatedProperties);
    },
};
