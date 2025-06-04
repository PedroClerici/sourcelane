import type { ZodIssue } from 'zod'

export abstract class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details: string,
  ) {
    super(message)
  }

  format(url: string, issues?: ZodIssue[]) {
    return {
      status: this.status,
      message: this.message,
      details: this.details,
      target: url,
      issues,
    }
  }
}

export class BadRequestError extends ApiError {
  constructor(message?: string, details?: string) {
    super(400, message ?? 'Bad Request', details ?? 'Malformed request syntax')
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message?: string, details?: string) {
    super(
      401,
      message ?? 'Unauthorized',
      details ?? 'Authentication required or invalid',
    )
  }
}

export class ForbiddenError extends ApiError {
  constructor(message?: string, details?: string) {
    super(
      403,
      message ?? 'Forbidden',
      details ?? 'You do not have permission to access this resource',
    )
  }
}

export class NotFoundError extends ApiError {
  constructor(message?: string, details?: string) {
    super(
      404,
      message ?? 'Not Found',
      details ?? 'The requested resource could not be found',
    )
  }
}

export class ConflictError extends ApiError {
  constructor(message?: string, details?: string) {
    super(
      409,
      message ?? 'Conflict',
      details ??
        'The request could not be completed due to a conflict with the current state of the resource',
    )
  }
}

export class InternalServerError extends ApiError {
  constructor(message?: string, details?: string) {
    super(
      500,
      message ?? 'Internal Server Error',
      details ?? 'An unexpected error occurred on the server',
    )
  }
}
