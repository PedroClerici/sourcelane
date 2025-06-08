import { eq } from 'drizzle-orm'
import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { db, tables } from '@/lib/drizzle'
import 'zod-openapi/extend'
import { auth } from '@/middlewares/auth'
import { ForbiddenError, NotFoundError } from '@/utils/errors'

export default function rejectInvite(app: FastifyZodOpenApiInstance) {
  app.register(auth).post(
    '/invites/:inviteId/reject',
    {
      schema: {
        tags: ['Invite'],
        summary: 'Reject an invite.',
        security: [{ bearerAuth: [] }],
        params: z.object({
          inviteId: z.string().uuid(),
        }),
        response: {
          204: z.null(),
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

      await db.delete(tables.invites).where(eq(tables.invites.id, invite.id))

      return replay.status(204).send()
    },
  )
}
