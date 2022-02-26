import { createHash } from 'crypto';

export const md5 = (str: string | Buffer): string => {
    return createHash('md5').update(str).digest('hex');
};

export const sha256 = (str: string | Buffer): string => {
    return createHash('sha256').update(str).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};
