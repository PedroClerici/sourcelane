import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'

export default function getOrganization(app: FastifyZodOpenApiInstance) {
  app.register(auth).get(
    '/organizations/:organizationSlug',
    {
      schema: {
        tags: ['Organization'],
        summary: 'Get details from organization.',
        security: [{ bearerAuth: [] }],
        params: z.object({
          organizationSlug: z.string(),
        }),
        response: {
          200: z.object({
            organization: z.object({
              id: z.string().uuid(),
              name: z.string(),
              slug: z.string(),
              domain: z.string().nullable(),
              shouldAttachUsersByDomain: z.boolean(),
              avatarUrl: z.string().url().nullable(),
              createdAt: z.date(),
              updatedAt: z.date(),
              ownerId: z.string().uuid(),
            }),
          }),
        },
      },
    },
    async (request, replay) => {
      const { organizationSlug } = request.params
      const { organization } = await request.getUserMembership(organizationSlug)

      return replay.status(200).send({
        organization,
      })
    },
  )
}
