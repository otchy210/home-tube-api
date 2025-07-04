import { RequestHandler } from '../types';
import { allTagsHandler } from './AllTagsHandler';
import { appConfigHandler } from './AppConfigHandler';
import { convertHandler } from './ConvertHandler';
import { detailsHandler } from './DetailsHandler';
import { propertiesHandler } from './PropertiesHandler';
import { renameHandler } from './RenameHandler';
import { foldersHandler } from './FoldersHandler';
import { searchHandler } from './SearchHandler';
import { serverStatusHandler } from './ServerStatusHandler';
import { snapshotHandler } from './SnapshotHandler';
import { thumbnailsHandler } from './ThumbnailsHandler';
import { videoHandler } from './VideoHandler';

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
    foldersHandler,
];
