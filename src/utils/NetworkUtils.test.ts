import { getLocalIpv4Addresses } from './NetworkUtils';

describe('NetworkUtils', () => {
    it('getLocalIpv4Addresses', () => {
        console.log(getLocalIpv4Addresses());
    });
});
