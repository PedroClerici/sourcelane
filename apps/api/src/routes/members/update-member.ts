import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'
import { and, eq } from 'drizzle-orm'
import { db, tables } from '@/lib/drizzle'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors'
import { getUserPermissions } from '@/utils/get-user-permissions'

export default function updateMember(app: FastifyZodOpenApiInstance) {
  app.register(auth).put(
    '/organizations/:organizationSlug/members/:memberId',
    {
      schema: {
        tags: ['Members'],
        summary: 'Update a member',
        security: [{ bearerAuth: [] }],
        params: z.object({
          memberId: z.string().uuid(),
          organizationSlug: z.string(),
        }),
        body: z.object({
          role: z.enum(['ADMIN', 'MEMBER']),
        }),
        response: {
          204: z.null(),
          [BadRequestError.status]: BadRequestError.schema,
          [UnauthorizedError.status]: UnauthorizedError.schema,
          [NotFoundError.status]: NotFoundError.schema,
          [ForbiddenError.status]: ForbiddenError.schema,
        },
      },
    },
    async (request, replay) => {
      const { organizationSlug } = request.params
      const { role } = request.body
      const { membership, organization } =
        await request.getUserMembership(organizationSlug)

      const member = db.query.members.findFirst({
        where: and(
          eq(tables.members.userId, membership.userId),
          eq(tables.members.organizationId, organization.id),
        ),
      })

      if (!member) {
        throw new NotFoundError(`Could'nt find member`)
      }

      const { cannot } = getUserPermissions(membership.userId, membership.role)

      if (cannot('read', 'User')) {
        throw new ForbiddenError(`You're not allowed to update this member`)
      }

      await db
        .update(tables.members)
        .set({ role })
        .where(
          and(
            eq(tables.members.userId, membership.userId),
            eq(tables.members.organizationId, organization.id),
          ),
        )

      return replay.status(204).send()
    },
  )
}
