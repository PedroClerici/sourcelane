import 'zod-openapi/extend'
import { eq } from 'drizzle-orm'
import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { db, tables } from '@/lib/drizzle'
import { auth } from '@/middlewares/auth'
import { env } from '@/utils/env'

export default async function requestPasswordRecovery(
  app: FastifyZodOpenApiInstance,
) {
  app.register(auth).post('/password/recovery', {
    schema: {
      tags: ['Auth'],
      summary: 'Request password recovery.',
      operationId: 'requestPasswordRecovery',
      body: z.object({
        email: z.string().email().openapi({ example: 'john.doe@example.com' }),
        password: z.string().min(6).openapi({ example: '123456' }),
      }),
      response: {
        201: z.null(),
      },
    },
    handler: async (request, reply) => {
      const { email } = request.body

      const userFromEmail = await db.query.users.findFirst({
        where: eq(tables.users.email, email),
      })

      if (!userFromEmail) {
        // We don't want people to know if user really exists
        return reply.status(201).send()
      }

      const [{ code }] = await db
        .insert(tables.tokens)
        .values({
          type: 'PASSWORD_RECOVER',
          userId: userFromEmail.id,
        })
        .returning({ code: tables.tokens.id })

      // TODO: Send e-mail with password recover link
      if (env.NODE_ENV === 'development') {
        console.log(`Recover password token: ${code}`)
      }

      return reply.status(201).send()
    },
  })
}
