#!/usr/bin/env node

"use strict";
const { ApiServer } = require('../dist');

const port = process.env.HOME_TUBE_API_PORT || 8210;
const apiServer = new ApiServer({port});
apiServer.start().then(() => {
    const appConfigPath = apiServer.getAppConfigPath();
    console.log('==== HomeTube API Server ======================================');
    console.log(`Running on http://localhost:${port}`);
    console.log(`appConfigPath: ${appConfigPath}`);
    console.log('Press Ctrl+C to stop the server');
    console.log('================================================================');
});
