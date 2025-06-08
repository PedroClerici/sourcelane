import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'
import { desc, eq } from 'drizzle-orm'
import { db, tables } from '@/lib/drizzle'
import { ForbiddenError } from '@/utils/errors'
import { getUserPermissions } from '@/utils/get-user-permissions'

export default function getInvites(app: FastifyZodOpenApiInstance) {
  app.register(auth).get(
    '/organizations/:organizationSlug/invites',
    {
      schema: {
        tags: ['Invite'],
        summary: 'Get all organization invites.',
        security: [{ bearerAuth: [] }],
        params: z.object({
          organizationSlug: z.string(),
        }),
        response: {
          200: z.object({
            invites: z.array(
              z.object({
                id: z.string().uuid(),
                role: z.enum(['ADMIN', 'MEMBER']),
                email: z.string().email(),
                createdAt: z.string().date(),
                organization: z.object({
                  name: z.string(),
                }),
                author: z
                  .object({
                    id: z.string().uuid(),
                    name: z.string().nullable(),
                    avatarUrl: z.string().url().nullable(),
                  })
                  .nullable(),
              }),
            ),
          }),
        },
      },
    },
    async (request, replay) => {
      const { organizationSlug } = request.params
      const { membership, organization } =
        await request.getUserMembership(organizationSlug)

      const { cannot } = getUserPermissions(membership.userId, membership.role)

      if (cannot('read', 'Invite')) {
        throw new ForbiddenError(
          `You're not allowed to read organization invites`,
        )
      }

      const invites = await db.query.invites.findMany({
        columns: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
        with: {
          organization: {
            columns: {
              name: true,
            },
          },
          author: {
            columns: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: desc(tables.invites.createdAt),
        where: eq(tables.invites.organizationId, organization.id),
      })

      return replay.status(201).send({ invites })
    },
  )
}
