import { RequestHandler } from '../types';
import { appConfigHandler } from '../handlers/AppConfigHandler';
import { searchHandler } from '../handlers/SearchHandler';
import { thumbnailsHandler } from '../handlers/ThumbnailsHandler';
import { detailsHandler } from '../handlers/DetailsHandler';
import { propertiesHandler } from '../handlers/PropertiesHandler';
import { snapshotHandler } from '../handlers/SnapshotHandler';
import { videoHandler } from '../handlers/VideoHandler';
import { allTagsHandler } from '../handlers/AllTagsHandler';
import { serverStatusHandler } from '../handlers/ServerStatusHandler';
import { convertHandler } from '../handlers/ConvertHandler';

export const defaultRequestHandlers: RequestHandler[] = [
    appConfigHandler,
    searchHandler,
    detailsHandler,
    snapshotHandler,
    propertiesHandler,
    convertHandler,
    videoHandler,
    thumbnailsHandler,
    allTagsHandler,
    serverStatusHandler,
];
