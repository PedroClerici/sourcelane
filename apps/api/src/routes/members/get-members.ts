import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'
import { asc, eq } from 'drizzle-orm'
import { db, tables } from '@/lib/drizzle'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors'
import { getUserPermissions } from '@/utils/get-user-permissions'

export default function getMembers(app: FastifyZodOpenApiInstance) {
  app.register(auth).get(
    '/organizations/:organizationSlug/members',
    {
      schema: {
        tags: ['Member'],
        summary: 'Get organization members.',
        operationId: 'getMembers',
        security: [{ bearerAuth: [] }],
        params: z.object({
          organizationSlug: z.string(),
        }),
        response: {
          200: z.object({
            members: z.array(
              z.object({
                memberId: z.string().uuid(),
                userId: z.string().uuid(),
                name: z.string().nullable(),
                email: z.string().nullable(),
                avatarUrl: z.string().url().nullable(),
                role: z.enum(['ADMIN', 'MEMBER']),
              }),
            ),
          }),
          [UnauthorizedError.status]: UnauthorizedError.schema,
          [NotFoundError.status]: NotFoundError.schema,
          [ForbiddenError.status]: ForbiddenError.schema,
        },
      },
    },
    async (request, replay) => {
      const { organizationSlug } = request.params
      const { membership, organization } =
        await request.getUserMembership(organizationSlug)

      const { cannot } = getUserPermissions(membership.userId, membership.role)

      if (cannot('read', 'User')) {
        throw new ForbiddenError(
          `You're not allowed to see organization members`,
        )
      }

      const members = await db
        .select({
          memberId: tables.members.id,
          userId: tables.users.id,
          name: tables.users.name,
          email: tables.users.email,
          avatarUrl: tables.users.avatarUrl,
          role: tables.members.role,
        })
        .from(tables.members)
        .innerJoin(tables.users, eq(tables.users.id, tables.members.userId))
        .where(eq(tables.members.organizationId, organization.id))
        .orderBy(asc(tables.members.role))

      return replay.status(200).send({ members })
    },
  )
}
