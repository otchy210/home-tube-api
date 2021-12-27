import { createHash } from 'crypto';

export const hash = (str: string): string => {
    return createHash('md5').update(str).digest('hex');
};
