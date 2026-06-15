import express from 'express';

import { loadEnv, serverConfig } from './config/index.js';

import pingRouter from './routers/ping.router.js';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import logger from './config/logger.config.js';

// 🚀 1. Import your correlation middleware
import { correlationMiddleware } from './middlewares/correlation.middleware.js';

const app = express();


app.use(express.json());

app.use(correlationMiddleware);


app.use(pingRouter );


app.use(globalErrorHandler);


app.listen(serverConfig.port ,() => {
    console.log(`⚡️[server]: Server is running safely at http://localhost:${serverConfig.port}`);
    logger.info(`press ctrl + c to stop the server` ,  {"env" : "dev" } );

});