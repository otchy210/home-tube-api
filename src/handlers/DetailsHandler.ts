import { RequestHandler, RequestMethod } from '../types';
import { validateAndGetVideo } from '../utils/ServerRequestUtils';
import { isErrorResponse } from '../utils/ServerResponseUtils';
import { useMetaManager } from '../videos/MetaManager';
import { usePropertiesManager } from '../videos/PropertiesManager';

export const detailsHandler: RequestHandler & { get: RequestMethod } = {
    path: '/details',
    get: ({ params }) => {
        const video = validateAndGetVideo(params);
        if (isErrorResponse(video)) {
            return { body: video };
        }
        const path = video.path as string;
        const metaManager = useMetaManager();
        const meta = metaManager.getRequiredMeta(path);
        const propertiesManager = usePropertiesManager();
        const properties = propertiesManager.get(path);
        return { body: { ...video, ...meta, ...properties }, maxAge: 60 };
    },
};
