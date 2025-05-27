import 'fastify'

import type {
  FastifyBaseLogger,
  FastifyInstance,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from 'fastify'
import type { FastifyZodOpenApiTypeProvider } from 'fastify-zod-openapi'

declare module 'fastify-zod-openapi' {
  export type FastifyZodOpenApiInstance = FastifyInstance<
    RawServerDefault,
    RawRequestDefaultExpression<RawServerDefault>,
    RawReplyDefaultExpression<RawServerDefault>,
    FastifyBaseLogger,
    FastifyZodOpenApiTypeProvider
  >
}
