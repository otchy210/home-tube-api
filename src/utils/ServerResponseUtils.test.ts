import { isErrorResponse } from './ServerResponseUtils';

describe('isErrorResponse', () => {
    it('returns false for empty object', () => {
        expect(isErrorResponse({})).toBe(false);
    });

    it('returns false for object which has no status', () => {
        expect(isErrorResponse({ a: 1, b: 2 })).toBe(false);
    });

    it('returns false for object which has status but not interger', () => {
        expect(isErrorResponse({ status: '404', message: 'error' })).toBe(false);
    });

    it('returns false for object which has status as number but 200', () => {
        expect(isErrorResponse({ status: 200, message: 'ok' })).toBe(false);
    });

    it('returns false for object which has error status but no message', () => {
        expect(isErrorResponse({ status: 400 })).toBe(false);
    });

    it('returns false for object which has error status but has empty message', () => {
        expect(isErrorResponse({ status: 400, message: '' })).toBe(false);
    });

    it('returns true for object which has error status and valid message', () => {
        expect(isErrorResponse({ status: 400, message: 'error' })).toBe(true);
    });
});
