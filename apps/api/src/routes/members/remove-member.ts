import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'
import { and, eq } from 'drizzle-orm'
import { db, tables } from '@/lib/drizzle'
import { ForbiddenError, NotFoundError } from '@/utils/errors'
import { getUserPermissions } from '@/utils/get-user-permissions'

export default function updateMember(app: FastifyZodOpenApiInstance) {
  app.register(auth).delete(
    '/organizations/:organizationSlug/members/:memberId',
    {
      schema: {
        tags: ['Member'],
        summary: 'Remove a member from the organization.',
        security: [{ bearerAuth: [] }],
        params: z.object({
          memberId: z.string().uuid(),
          organizationSlug: z.string(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, replay) => {
      const { organizationSlug } = request.params
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

      if (cannot('delete', 'User')) {
        throw new ForbiddenError(
          `You're not allowed to remove this member from the organization`,
        )
      }

      await db
        .delete(tables.members)
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
