// C:\Users\hp\Downloads\chap14\src\utils\context.store.ts
import { AsyncLocalStorage } from 'async_hooks';

// 1. Define exactly what we want to track across our async execution (a correlationId)
interface BackgroundContext {
    correlationId: string;
}

// 2. Create the storage container instance
export const jobLocalStorage = new AsyncLocalStorage<BackgroundContext>();

// 3. Create a clean helper function to read the active ID anywhere in our app
export const getJobCorrelationId = (): string | undefined => {
    return jobLocalStorage.getStore()?.correlationId ||  'unknown-error-while-correlation-id';
};