import { desc, eq } from 'drizzle-orm'
import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { db, tables } from '@/lib/drizzle'
import 'zod-openapi/extend'
import { auth } from '@/middlewares/auth'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors'

export default function getPendingInvites(app: FastifyZodOpenApiInstance) {
  app.register(auth).get(
    '/pending-invites',
    {
      schema: {
        tags: ['Invite'],
        summary: 'Get all user pending invites.',
        operationId: 'getPendingInvites',
        security: [{ bearerAuth: [] }],
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
          [BadRequestError.status]: BadRequestError.schema,
          [UnauthorizedError.status]: UnauthorizedError.schema,
          [NotFoundError.status]: NotFoundError.schema,
          [ConflictError.status]: ConflictError.schema,
        },
      },
    },
    async (request, replay) => {
      const userId = await request.getCurrentUserId()

      const user = await db.query.users.findFirst({
        where: eq(tables.users.id, userId),
      })

      if (!user) {
        throw new NotFoundError('User not found.')
      }

      if (!user.email) {
        throw new ConflictError(
          'The user does not have an email address associated with their account, which is required to retrieve pending invites.',
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
        where: eq(tables.invites.email, user.email),
      })

      return replay.status(204).send({ invites })
    },
  )
}
