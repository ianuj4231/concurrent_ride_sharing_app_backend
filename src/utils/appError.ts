export class AppError extends Error {
    public statusCode: number;
    public name: string; 

    // 1. Make 'name' an optional 3rd argument, defaulting to "AppError"
    constructor(message: string, statusCode: number, name?: string) {
        super(message);
        
        this.statusCode = statusCode;
        
        // 2. Use the passed name if it exists, otherwise fall back to the class name
        this.name = name || this.constructor.name;

        Error.captureStackTrace(this, this.constructor);
    }
}