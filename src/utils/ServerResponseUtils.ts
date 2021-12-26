import { ServerResponse } from 'http';
import { ErrorResponse } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isErrorResponse = (candidate: any): candidate is ErrorResponse => {
    return (
        Number.isInteger(candidate?.status) &&
        [400, 404, 405].includes(candidate?.status) &&
        typeof candidate?.message === 'string' &&
        candidate?.message?.length > 0
    );
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

export const INTERNAL_SERVER_ERROR = {
    status: 500,
    message: 'Internal Server Error',
} as ErrorResponse;

export const writeErrorResponse = (res: ServerResponse, errorResponse: ErrorResponse): void => {
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

export const writeInternalServerError = (res: ServerResponse): void => {
    writeErrorResponse(res, INTERNAL_SERVER_ERROR);
};
