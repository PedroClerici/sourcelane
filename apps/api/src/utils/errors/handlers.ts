import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  type FastifyZodOpenApiInstance,
  RequestValidationError,
} from 'fastify-zod-openapi'
import {
  ApiError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
} from '.'

type FastifyErrorHandler = FastifyZodOpenApiInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  if (error.validation) {
    const zodValidationErrors = error.validation.filter(
      err => err instanceof RequestValidationError,
    )
    const zodIssues = zodValidationErrors.map(err => err.params.issue)

    return reply
      .status(400)
      .send(
        new BadRequestError(
          'Validation error.',
          'One or more fields in your request are invalid. Please check the `issues` array for details.',
        ).format(request.url, zodIssues),
      )
  }

  if (error instanceof ApiError) {
    return reply.status(error.status).send(error.format(request.url))
  }

  request.log.error(
    {
      requestId: request.id,
      url: request.raw.url,
      method: request.raw.method,
      type: 'Unhandled Error',
      err: error,
    },
    'An unexpected error occurred.',
  )

  return reply.status(500).send(new InternalServerError().format(request.url))
}

export const notFoundHandler = (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  return reply
    .status(404)
    .send(
      new NotFoundError(
        'Not found.',
        `The requested resource '${request.raw.url}' could not be found on this server.`,
      ).format(request.url),
    )
}
