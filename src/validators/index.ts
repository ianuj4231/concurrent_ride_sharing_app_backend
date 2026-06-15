import type { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import logger from '../config/logger.config.js';

// 1. Define your basic schema layout
export const userBodySchema =  z.object({ 
  name : z.string(),
  age : z.number()
});


// 2. Create the reusable validation middleware
export const validateRequestBody = (schema: z.ZodSchema) => {
    // logger.info("validating req body" )

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        logger.info("validating req body");
        try {
            // .parse() validates data; if it fails, it throws a ZodError automatically
            req.body = await schema.parseAsync(req.body);
            next(); // Data is safe! Proceed to your router/handler.
        } catch (error) {
            // 1. Check if the error actually came from Zod
            if (error instanceof ZodError) {
                    // 1. Format the Zod issues into your clean array structure
                    const formattedErrors = error.issues.map((err) => ({
                        field: err.path.join('.'),
                        error: err.message,
                    }));

                    // 2. Create a generic object or use your AppError class
                    // We attach statusCode and name so the global handler knows what to do!
                    const validationError: any = new Error("Validation failed");
                    validationError.statusCode = 400;
                    validationError.name = "ValidationError";
                    validationError.errors = formattedErrors;

                    return next(validationError);
                }
                
                next(error);

        }
    };
};