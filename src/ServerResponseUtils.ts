import { ServerResponse } from 'http';

export type ErrorResponse = {
    status: number;
    message: string;
};

export const BAD_REQUEST = {
    status: 400,
    message: 'Bad Request',
} as ErrorResponse;

export const NOT_FOUND = {
    status: 404,
    message: 'Not Found',
} as ErrorResponse;

export const METHOD_NOT_ALLOWED = {
    status: 405,
    message: 'Method Not Allowed',
} as ErrorResponse;

const writeErrorResponse = (res: ServerResponse, errorResponse: ErrorResponse): void => {
    res.writeHead(errorResponse.status, errorResponse.message);
    res.end();
};

export const writeBadRequest = (res: ServerResponse): void => {
    writeErrorResponse(res, BAD_REQUEST);
};

export const writeNotFound = (res: ServerResponse): void => {
    writeErrorResponse(res, NOT_FOUND);
};

export const writeMethodNotAllowed = (res: ServerResponse): void => {
    writeErrorResponse(res, METHOD_NOT_ALLOWED);
};
