import { NetworkInterfaceInfoIPv4, networkInterfaces } from 'os';

export const getLocalIpv4Addresses = (): string[] => {
    const dict = networkInterfaces();
    return Object.values(dict)
        .filter((networkInterfaces) => networkInterfaces)
        .flat()
        .filter((networkInterface) => networkInterface?.family === 'IPv4')
        .map((networkInterface) => networkInterface as NetworkInterfaceInfoIPv4)
        .map((networkInterface) => networkInterface.address);
};
