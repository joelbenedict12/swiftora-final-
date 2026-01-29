import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      stack: err.stack,
    });
  }

  // Include full error details for debugging
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    name: err.name,
    stack: err.stack,
  });
};
