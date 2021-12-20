import { ServerResponse } from 'http';

export const writeBadRequest = (res: ServerResponse): void => {
    res.writeHead(400, 'Bad Request');
    res.end();
};

export const writeNotFound = (res: ServerResponse): void => {
    res.writeHead(404, 'Not Found');
    res.end();
};

export const writeMethodNotAllowed = (res: ServerResponse): void => {
    res.writeHead(405, 'Method Not Allowed');
    res.end();
};
