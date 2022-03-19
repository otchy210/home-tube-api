import { promises } from 'fs';
// Proxy to allow easy imports in Node v12 which doesn't support `from 'fs/promises'` syntax

const { copyFile, mkdir, readdir, readFile, writeFile } = promises;

export { copyFile, mkdir, readdir, readFile, writeFile };
