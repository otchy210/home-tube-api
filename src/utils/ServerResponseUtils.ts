import { ServerResponse } from 'http';
import { ErrorResponse, StaticFileResponse } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isErrorResponse = (candidate: any): candidate is ErrorResponse => {
    return (
        Number.isInteger(candidate?.status) &&
        [400, 404, 405, 500].includes(candidate?.status) &&
        typeof candidate?.message === 'string' &&
        candidate?.message?.length > 0
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isStaticFileResponse = (candidate: any): candidate is StaticFileResponse => {
    return Object.keys(candidate).length === 2 && typeof candidate?.path === 'string' && typeof candidate?.maxAge === 'number';
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

type ResponseHeaders = {
    'Content-Type': string;
    'Access-Control-Allow-Origin'?: string;
};

const buildResponseHeaders = (contentType: string, origin: string | undefined): ResponseHeaders => {
    const responseHeaders = {
        'Content-Type': contentType,
    } as ResponseHeaders;
    if (origin) {
        responseHeaders['Access-Control-Allow-Origin'] = origin;
    }
    return responseHeaders;
};

export const buildJsonResponseHeaders = (origin: string | undefined): ResponseHeaders => {
    return buildResponseHeaders('application/json; charset=UTF-8', origin);
};

const buildPlainTextResponseHeaders = (origin: string | undefined): ResponseHeaders => {
    return buildResponseHeaders('text/plain; charset=UTF-8', origin);
};

export const writeErrorResponse = (res: ServerResponse, errorResponse: ErrorResponse, origin: string | undefined): void => {
    res.writeHead(errorResponse.status, errorResponse.message, buildPlainTextResponseHeaders(origin));
    res.end();
};

export const writeBadRequest = (res: ServerResponse, origin: string | undefined): void => {
    writeErrorResponse(res, BAD_REQUEST, origin);
};

export const writeNotFound = (res: ServerResponse, origin: string | undefined): void => {
    writeErrorResponse(res, NOT_FOUND, origin);
};

export const writeMethodNotAllowed = (res: ServerResponse, origin: string | undefined): void => {
    writeErrorResponse(res, METHOD_NOT_ALLOWED, origin);
};

export const writeInternalServerError = (res: ServerResponse, origin: string | undefined): void => {
    writeErrorResponse(res, INTERNAL_SERVER_ERROR, origin);
};
