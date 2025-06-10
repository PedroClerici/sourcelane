import 'zod-openapi/extend'
import { type ZodIssue, z } from 'zod'

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
  static readonly status = 400
  static readonly message = 'Malformed request syntax'

  static readonly schema = z.object({
    status: z.literal(BadRequestError.status),
    message: z.literal(BadRequestError.message),
    details: z.string(),
    target: z.string(),
    issues: z
      .array(
        z.object({
          code: z.string(),
          message: z.string(),
          path: z.array(z.union([z.string(), z.number()])),
        }),
      )
      .optional(),
  })

  constructor(details: string) {
    super(BadRequestError.status, BadRequestError.message, details)
  }
}

export class UnauthorizedError extends ApiError {
  static readonly status = 401
  static readonly message = 'Authentication required or invalid'

  static readonly schema = z.object({
    status: z.literal(UnauthorizedError.status),
    message: z.literal(UnauthorizedError.message),
    details: z.string(),
    target: z.string(),
  })

  constructor(details: string) {
    super(UnauthorizedError.status, UnauthorizedError.message, details)
  }
}

export class ForbiddenError extends ApiError {
  static readonly status = 403
  static readonly message = 'You do not have permission to access this resource'

  static readonly schema = z.object({
    status: z.literal(ForbiddenError.status),
    message: z.literal(ForbiddenError.message),
    details: z.string(),
    target: z.string(),
  })

  constructor(details: string) {
    super(ForbiddenError.status, ForbiddenError.message, details)
  }
}

export class NotFoundError extends ApiError {
  static readonly status = 404
  static readonly message = 'The requested resource could not be found'

  static readonly schema = z.object({
    status: z.literal(NotFoundError.status),
    message: z.literal(NotFoundError.message),
    details: z.string(),
    target: z.string(),
  })

  constructor(details: string) {
    super(NotFoundError.status, NotFoundError.message, details)
  }
}

export class ConflictError extends ApiError {
  static readonly status = 409
  static readonly message =
    'The request could not be completed due to a conflict with the current state of the resource'

  static readonly schema = z.object({
    status: z.literal(ConflictError.status),
    message: z.literal(ConflictError.message),
    details: z.string(),
    target: z.string(),
  })

  constructor(details: string) {
    super(ConflictError.status, ConflictError.message, details)
  }
}

export class InternalServerError extends ApiError {
  static readonly status = 500
  static readonly message = 'An unexpected error occurred on the server'

  static readonly schema = z.object({
    status: z.literal(InternalServerError.status),
    message: z.literal(InternalServerError.message),
    details: z.string(),
    target: z.string(),
  })

  constructor(details: string) {
    super(InternalServerError.status, InternalServerError.message, details)
  }
}
