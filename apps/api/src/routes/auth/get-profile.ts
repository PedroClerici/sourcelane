import 'zod-openapi/extend'
import { eq } from 'drizzle-orm'
import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { db, tables } from '@/lib/drizzle'
import { auth } from '@/middlewares/auth'
import { NotFoundError } from '@/utils/errors'

export default async function getProfile(app: FastifyZodOpenApiInstance) {
  app.register(auth).get('/profile', {
    schema: {
      tags: ['Auth'],
      summary: 'Get authenticated user profile.',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          user: z.object({
            id: z.string().uuid(),
            name: z.string().nullable().openapi({ example: 'John Doe' }),
            email: z
              .string()
              .nullable()
              .openapi({ example: 'john.doe@example.com' }),
            avatarUrl: z.string().url().nullable(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const userId = await request.getCurrentUserId()

      const user = await db.query.users.findFirst({
        columns: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
        where: eq(tables.users.id, userId),
      })

      if (!user) {
        throw new NotFoundError('User not found')
      }

      return reply.status(200).send({ user })
    },
  })
}
