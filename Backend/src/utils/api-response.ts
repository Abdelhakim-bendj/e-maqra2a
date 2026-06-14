import { Response } from 'express';
import { ZodError } from 'zod';

export type FieldError = {
  field: string;
  message: string;
};

export class ApiError extends Error {
  statusCode: number;
  errors?: FieldError[];

  constructor(statusCode: number, message: string, errors?: FieldError[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors?: FieldError[]
): void {
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

export function zodToFieldErrors(error: ZodError): FieldError[] {
  return error.errors.map((issue) => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
  }));
}
