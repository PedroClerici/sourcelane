import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, tables } from '@/lib/drizzle'
import { NotFoundError, UnauthorizedError } from '@/utils/errors'

export default function getOrganizations(app: FastifyZodOpenApiInstance) {
  app.register(auth).get(
    '/organizations',
    {
      schema: {
        tags: ['Organization'],
        summary: 'Get organizations where user is member.',
        operationId: 'getOrganizations',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            organizations: z.array(
              z.object({
                id: z.string().uuid(),
                name: z.string(),
                slug: z.string(),
                avatarUrl: z.string().url().nullable(),
                role: z.enum(['ADMIN', 'MEMBER']),
              }),
            ),
          }),
          [UnauthorizedError.status]: UnauthorizedError.schema,
          [NotFoundError.status]: NotFoundError.schema,
        },
      },
    },
    async (request, replay) => {
      const userId = await request.getCurrentUserId()

      const organizationsWithUserRole = await db
        .select({
          id: tables.organizations.id,
          name: tables.organizations.name,
          slug: tables.organizations.slug,
          avatarUrl: tables.organizations.avatarUrl,
          role: tables.members.role,
        })
        .from(tables.organizations)
        .innerJoin(
          tables.members,
          eq(tables.members.organizationId, tables.organizations.id),
        )
        .where(eq(tables.members.userId, userId))

      return replay.status(200).send({
        organizations: organizationsWithUserRole,
      })
    },
  )
}
