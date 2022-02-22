#!/usr/bin/env node

"use strict";
const { ApiServer } = require('../dist');
const { DEFAULT_API_PORT } = require('../dist/const');
const { getDefaultAppConfigPath } = require('../dist/utils/AppConfigUtils');

const parseArgv = () => {
    const defaultAppConfig = getDefaultAppConfigPath();
    return require('yargs/yargs')(process.argv.slice(2))
        .option('port', {
            type: 'number',
            description: `API server port [default: ${DEFAULT_API_PORT}]`,
        })
        .option('appConfig', {
            type: 'string',
            description: `HomeTube config file path [default: ${defaultAppConfig}]`,
        })
        .help().argv;
};

const argv = parseArgv();

const port = argv.port || DEFAULT_API_PORT;
const appConfigPath = argv.appConfig || getDefaultAppConfigPath();
const apiServer = new ApiServer({port, appConfigPath});
apiServer.start().then(() => {
    apiServer.showInitialMessages();
});
