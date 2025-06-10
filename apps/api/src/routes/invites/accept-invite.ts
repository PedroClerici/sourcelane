import { eq } from 'drizzle-orm'
import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { db, tables } from '@/lib/drizzle'
import 'zod-openapi/extend'
import { auth } from '@/middlewares/auth'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors'

export default function acceptInvite(app: FastifyZodOpenApiInstance) {
  app.register(auth).post(
    '/invites/:inviteId/accept',
    {
      schema: {
        tags: ['Invites'],
        summary: 'Accept an invite',
        security: [{ bearerAuth: [] }],
        params: z.object({
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
      const userId = await request.getCurrentUserId()
      const { inviteId } = request.params

      const invite = await db.query.invites.findFirst({
        where: eq(tables.invites.id, inviteId),
      })

      if (!invite) {
        throw new NotFoundError('Invite not found or expired.')
      }

      const user = await db.query.users.findFirst({
        where: eq(tables.users.id, userId),
      })

      if (!user) {
        throw new NotFoundError('User not found.')
      }

      if (invite.email !== user.email) {
        throw new ForbiddenError('This invite belongs to another user.')
      }

      await db.transaction(async tx => {
        await tx.insert(tables.members).values({
          userId,
          organizationId: invite.organizationId,
          role: invite.role,
        })

        await tx.delete(tables.invites).where(eq(tables.invites.id, invite.id))
      })

      return replay.status(204).send()
    },
  )
}
