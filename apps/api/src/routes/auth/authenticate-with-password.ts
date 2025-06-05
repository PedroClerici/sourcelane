import 'zod-openapi/extend'
import { compare } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { db, tables } from '@/lib/drizzle'
import { env } from '@/utils/env'
import { UnauthorizedError } from '@/utils/errors'

export default async function authenticateWithPassword(
  app: FastifyZodOpenApiInstance,
) {
  app.post('/sessions/password', {
    schema: {
      tags: ['Auth'],
      summary: 'Authenticate with e-mail & password.',
      body: z.object({
        email: z.string().email().openapi({ example: 'john.doe@example.com' }),
        password: z.string().openapi({ example: '123456' }),
      }),
      response: {
        201: z.object({
          token: z.string().jwt(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { email, password } = request.body

      const userFromEmail = await db.query.users.findFirst({
        where: eq(tables.users.email, email),
      })

      if (!userFromEmail) {
        throw new UnauthorizedError('Invalid credentials')
      }

      if (userFromEmail.passwordHash === null) {
        throw new UnauthorizedError('Invalid credentials')
      }

      const isPasswordValid = await compare(
        password,
        userFromEmail.passwordHash,
      )

      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials')
      }

      const token = await reply.jwtSign(
        {
          sub: userFromEmail.id,
        },
        {
          sign: {
            expiresIn: `${env.JWT_TOKEN_EXPIRE_IN_DAYS}d`,
          },
        },
      )

      return reply.status(201).send({ token })
    },
  })
}
