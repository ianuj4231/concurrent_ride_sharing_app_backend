import { AppError } from './appError.js';

// 1. Dedicated error for missing resources (404)
export class NotFoundError extends AppError {
    constructor(message: string) {
        // We pass the message, the hardcoded 404 status, and the category name to the parent
        super(message, 404, 'NotFoundError');
    }
}

// 2. Dedicated error for authentication failures (401)
export class AuthError extends AppError {
    constructor(message: string) {
        super(message, 401, 'AuthError');
    }
}