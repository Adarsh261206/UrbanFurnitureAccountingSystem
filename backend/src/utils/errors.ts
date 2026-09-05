export class AppError extends Error {
  public code: string;
  public statusCode: number;
  public field?: string;
  public details?: any;

  constructor(
    code: string,
    message: string,
    statusCode: number = 400,
    field?: string,
    details?: any
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.field = field;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}
