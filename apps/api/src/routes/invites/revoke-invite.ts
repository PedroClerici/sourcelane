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

export default function revokeInvite(app: FastifyZodOpenApiInstance) {
  app.register(auth).delete(
    '/organizations/:organizationSlug/invites/:inviteId',
    {
      schema: {
        tags: ['Invites'],
        summary: 'Revoke an invite',
        security: [{ bearerAuth: [] }],
        params: z.object({
          organizationSlug: z.string(),
          inviteId: z.string().uuid(),
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
      const { membership, organization } =
        await request.getUserMembership(organizationSlug)
      const { inviteId } = request.params

      const { cannot } = getUserPermissions(membership.userId, membership.role)

      if (cannot('delete', 'Invite')) {
        throw new ForbiddenError(`You're not allowed to delete an invite`)
      }

      const invite = await db.query.invites.findFirst({
        where: and(
          eq(tables.invites.id, inviteId),
          eq(tables.invites.organizationId, organization.id),
        ),
      })

      if (!invite) {
        throw new NotFoundError('Invite not found or expired.')
      }

      await db
        .delete(tables.invites)
        .where(and(eq(tables.invites.id, invite.id)))

      return replay.status(204).send()
    },
  )
}
