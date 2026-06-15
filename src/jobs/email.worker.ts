// C:\Users\hp\Downloads\chap14\src\jobs\email.worker.ts
import { v4 as uuidv4 } from 'uuid';
import { jobLocalStorage } from '../utils/context.store.js'; // 👈 Shared warehouse
import logger from '../config/logger.config.js';

export const startEmailWorkerJob = async (): Promise<void> => {
    // 1. Because there is no middleware, we manually create the ID here!
    const jobSpecificId = uuidv4();

    // 2. We manually call .run() to attach the ID for this background track
    await jobLocalStorage.run({ correlationId: jobSpecificId }, async () => {
        
        // 3. Now when this executes, the logger's getJobCorrelationId() pulls 'jobSpecificId'
        logger.info("Background job execution started!"); 
        
    });
};


/*
Step 5: Winston intercepts and reaches out to the Store
Before writing to your terminal console, your Winston configuration drops down into its printf formatter loop:

TypeScript
winston.format.printf(({ level, message, timestamp, ...data }) => {
    const output = { level, message, timestamp, correlationId: getJobCorrelationId(), data };
    return JSON.stringify(output)
})
    
Step 6: The Storage Warehouse Resolves the ID
Your helper function getJobCorrelationId() gets executed:

TypeScript
export const getJobCorrelationId = (): string | undefined => {
    return jobLocalStorage.getStore()?.correlationId || 'unknown-error-while-correlation-id';
};
Node.js looks at the currently executing asynchronous callback chain, identifies the active memory bubble, extracts the data store, and finds correlationId is "b184-9921-abc".

*/