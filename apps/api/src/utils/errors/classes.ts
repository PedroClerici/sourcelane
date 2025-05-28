import type { ZodIssue } from 'zod'

export abstract class ApiError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail: string,
  ) {
    super(title)
  }

  format(url: string, issues?: ZodIssue[]) {
    return {
      status: this.status,
      title: this.title,
      detail: this.detail,
      instance: url,
      issues,
    }
  }
}

export class BadRequestError extends ApiError {
  constructor(title?: string, detail?: string) {
    super(400, title ?? 'Bad Request.', detail ?? 'Malformed request syntax.')
  }
}

export class UnauthorizedError extends ApiError {
  constructor(title?: string, detail?: string) {
    super(
      401,
      title ?? 'Unauthorized.',
      detail ?? 'Authentication required or invalid.',
    )
  }
}

export class ForbiddenError extends ApiError {
  constructor(title?: string, detail?: string) {
    super(
      403,
      title ?? 'Forbidden.',
      detail ?? 'You do not have permission to access this resource.',
    )
  }
}

export class NotFoundError extends ApiError {
  constructor(title?: string, detail?: string) {
    super(
      404,
      title ?? 'Not Found.',
      detail ?? 'The requested resource could not be found.',
    )
  }
}

export class ConflictError extends ApiError {
  constructor(title?: string, detail?: string) {
    super(
      409,
      title ?? 'Conflict.',
      detail ??
        'The request could not be completed due to a conflict with the current state of the resource.',
    )
  }
}

export class InternalServerError extends ApiError {
  constructor(title?: string, detail?: string) {
    super(
      500,
      title ?? 'Internal Server Error.',
      detail ?? 'An unexpected error occurred on the server.',
    )
  }
}
