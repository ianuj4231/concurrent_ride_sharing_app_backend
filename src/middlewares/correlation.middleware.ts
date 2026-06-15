import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { jobLocalStorage } from '../utils/context.store.js';

// 🚀 Extend Express's Request interface so TypeScript allows 'req.correlationId'
declare global {
    namespace Express {
        interface Request {
            correlationId?: string;
        }
    }
}

export const correlationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // 1. Check if the incoming request already has a correlation ID header (e.g., from a gateway/frontend)
    // 2. If it doesn't exist, generate a brand new unique UUID v4 string
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

    // 3. Attach it to the Request object so your controllers and loggers can read it
    req.correlationId = correlationId;

    // 4. Set it in the Response headers so the client/Postman can see it too
    res.setHeader('X-Correlation-ID', correlationId);

// 🚀 WRAP IT: We pass the ID into the async store, then call next() inside it!
    // Every function called further down this request track will now automatically see this ID.
    jobLocalStorage.run({ correlationId }, () => {
        next();
    });
};