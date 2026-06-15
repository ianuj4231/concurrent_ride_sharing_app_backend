import type { Request, Response, NextFunction } from 'express';
import { NotFoundError, AuthError } from '../utils/customErrors.js'; // Import your new errors
import logger from '../config/logger.config.js';

export const pingHandler = (req: Request, res: Response, next: NextFunction): void => {
    try {
        
        /*
        // Simulation 1: Imagine a user isn't logged in
        const isAuthenticated = false;
        if (!isAuthenticated) {
            return next(new AuthError("You must be logged in to access this route"));
        }

        // Simulation 2: Imagine looking for an item in a database that doesn't exist
        const itemFound = false; 
        if (!itemFound) {
            return next(new NotFoundError("The requested item could not be found"));
        }
        */

        logger.info("inside controller handler ");
        res.send('Everything is working from scratch! TypeScript + Express is live.');
    } catch (error) {
        next(error);
    }
};