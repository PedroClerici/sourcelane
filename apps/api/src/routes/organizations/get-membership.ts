import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors'

export default async function (app: FastifyZodOpenApiInstance) {
  app.register(auth).get(
    'organizations/:organizationSlug/membership',
    {
      schema: {
        tags: ['Organization'],
        summary: 'Get user membership on organization.',
        operationId: 'getMembership',
        security: [{ bearerAuth: [] }],
        params: z.object({
          organizationSlug: z.string(),
        }),
        response: {
          200: z.object({
            membership: z.object({
              id: z.string().uuid(),
              role: z.enum(['ADMIN', 'MEMBER']),
              organizationId: z.string().uuid(),
            }),
          }),
          [BadRequestError.status]: BadRequestError.schema,
          [UnauthorizedError.status]: UnauthorizedError.schema,
          [NotFoundError.status]: NotFoundError.schema,
        },
      },
    },
    async (request, reply) => {
      const { organizationSlug } = request.params
      const { membership } = await request.getUserMembership(organizationSlug)

      return reply.status(200).send({
        membership: {
          id: membership.id,
          role: membership.role,
          organizationId: membership.organizationId,
        },
      })
    },
  )
}
