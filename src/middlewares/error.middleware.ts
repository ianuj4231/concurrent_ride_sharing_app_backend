import type { Request, Response, NextFunction } from 'express';

export const globalErrorHandler = (
    err: any, 
    req: Request, 
    res: Response, 
    next: NextFunction
): void => {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
// 🚀 DYNAMIC STATUS: 4xx becomes "fail", 5xx stays "error"
        status: statusCode >= 400 && statusCode < 500 ? "fail" : "error",
        errorName: err.name || "InternalServerError", // Optional: includes your custom error name!
        message: err.message || "Something went wrong on our end",
        ...(err.errors && { errors: err.errors }),
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined    });
};