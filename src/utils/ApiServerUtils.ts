import { ServerResponse } from 'http';
import send = require('send');
import * as yargs from 'yargs';
import { DEFAULT_API_PORT } from '../const';
import { ApiServerConfig, Json, RequestContext, RequestHandler, RequestHandlerResponse, RequestParams } from '../types';
import { getDefaultAppConfigPath } from './AppConfigUtils';
import logger from './logger';
import {
    buildJsonResponseHeaders,
    isErrorResponse,
    isStaticFileResponse,
    writeBadRequest,
    writeErrorResponse,
    writeInternalServerError,
    writeMethodNotAllowed,
    writeNotFound,
} from './ServerResponseUtils';

export const parseArgv = (): ApiServerConfig => {
    const defaultAppConfig = getDefaultAppConfigPath();
    return yargs
        .option('port', {
            type: 'number',
            description: `API server port [default: ${DEFAULT_API_PORT}]`,
        })
        .option('appConfig', {
            type: 'string',
            description: `HomeTube config file path [default: ${defaultAppConfig}]`,
        })
        .help().argv as ApiServerConfig;
};

const supportedMethods = ['GET', 'POST', 'DELETE', 'OPTIONS'];

export const parseUrl = (url: string): { urlPath: string; params?: RequestParams } => {
    const charIndex = url.indexOf('?');
    if (charIndex < 0) {
        return { urlPath: url };
    }
    const urlPath = url.substring(0, charIndex);
    const params = url
        .substring(charIndex + 1)
        .split('&')
        .map((pairStr) => pairStr.split('='))
        .reduce<RequestParams>((map, [key, value]) => {
            const decodedValue = decodeURIComponent(value.replace(/\+/g, ' '));
            if (map[key] !== undefined) {
                console.warn(`Duplicate param name is not allowed: "${key}" has "${map[key]}" already / skipped "${decodedValue}"`);
                return map;
            }
            try {
                map[key] = JSON.parse(decodedValue);
            } catch {
                // treat all parse errors as string value
                map[key] = decodedValue;
            }
            return map;
        }, {});
    return { urlPath, params };
};

export const handleRequestEnd = (context: RequestContext, response: ServerResponse, handler: RequestHandler) => {
    let handlerResponse: RequestHandlerResponse | undefined;
    const origin = context.request?.headers?.origin;
    try {
        switch (context.request.method) {
            case 'GET':
                if (handler?.get === undefined) {
                    writeMethodNotAllowed(response, origin);
                    return;
                }
                handlerResponse = handler.get(context);
                break;
            case 'POST':
                if (handler?.post === undefined) {
                    writeMethodNotAllowed(response, origin);
                    return;
                }
                handlerResponse = handler.post(context);
                break;
            case 'DELETE':
                if (handler?.delete === undefined) {
                    writeMethodNotAllowed(response, origin);
                    return;
                }
                handlerResponse = handler.delete(context);
                break;
        }
        if (handlerResponse === undefined) {
            writeBadRequest(response, origin);
        } else {
            const { maxAge, body } = handlerResponse;
            if (isErrorResponse(body)) {
                writeErrorResponse(response, body, origin);
            } else if (isStaticFileResponse(body)) {
                const options: send.SendOptions = {};
                if (maxAge && maxAge > 0) {
                    options.cacheControl = true;
                    options.maxAge = maxAge * 1000;
                    options.immutable = true;
                }
                send(context.request, body.path, options)
                    .on('headers', (res) => {
                        res.setHeader('Access-Control-Allow-Origin', '*');
                    })
                    .pipe(response);
            } else {
                response.writeHead(200, buildJsonResponseHeaders(origin, maxAge));
                response.write(JSON.stringify(body));
                response.end();
            }
        }
    } catch (e) {
        logger.error(e);
        writeInternalServerError(response, origin);
    }
};

export const handleRequest = (context: RequestContext, response: ServerResponse, requestHandlers: Map<string, RequestHandler>) => {
    const { method, url } = context.request;
    const origin = context.request?.headers?.origin;
    if (method === undefined) {
        writeBadRequest(response, origin);
        return;
    }
    if (!supportedMethods.includes(method)) {
        writeMethodNotAllowed(response, origin);
        return;
    }
    if (method === 'OPTIONS') {
        const responseHeaders = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': supportedMethods.join(', '),
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': 7200,
        };
        response.writeHead(204, responseHeaders);
        response.end();
        return;
    }
    if (url === undefined) {
        writeNotFound(response, origin);
        return;
    }

    const urlParams = parseUrl(url);
    const handler = requestHandlers.get(urlParams.urlPath);
    if (!handler) {
        writeNotFound(response, origin);
        return;
    }
    if (urlParams.params) {
        context.params = urlParams.params;
    }

    const bodyChunks = new Array<Uint8Array>();
    context.request.on('data', (chunk) => {
        bodyChunks.push(chunk);
    });
    context.request.on('end', () => {
        if (bodyChunks.length > 0) {
            const bodyBuffer = Buffer.concat(bodyChunks);
            context.body = JSON.parse(bodyBuffer.toString()) as Json;
        }
        handleRequestEnd(context, response, handler);
    });
};
