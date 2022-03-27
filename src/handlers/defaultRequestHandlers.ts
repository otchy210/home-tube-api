import { RequestHandler } from '../types';
import { appConfigHandler } from './AppConfigHandler';
import { searchHandler } from './SearchHandler';
import { thumbnailsHandler } from './ThumbnailsHandler';
import { detailsHandler } from './DetailsHandler';
import { propertiesHandler } from './PropertiesHandler';
import { snapshotHandler } from './SnapshotHandler';
import { videoHandler } from './VideoHandler';
import { allTagsHandler } from './AllTagsHandler';
import { serverStatusHandler } from './ServerStatusHandler';
import { convertHandler } from './ConvertHandler';
import { renameHandler } from './RenameHandler';

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
    renameHandler,
];
