import 'zod-openapi/extend'
import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { db, tables } from '@/lib/drizzle'
import { auth } from '@/middlewares/auth'
import { env } from '@/utils/env'
import { BadRequestError, UnauthorizedError } from '@/utils/errors'

export default async function resetPassword(app: FastifyZodOpenApiInstance) {
  app.register(auth).post('/password/reset', {
    schema: {
      tags: ['Auth'],
      summary: 'Reset account password.',
      operationId: 'resetPassword',
      body: z.object({
        code: z.string().uuid(),
        password: z.string().min(6).openapi({ example: '123456' }),
      }),
      response: {
        204: z.null(),
        [BadRequestError.status]: BadRequestError.schema,
        [UnauthorizedError.status]: UnauthorizedError.schema,
      },
    },
    handler: async (request, reply) => {
      const { code, password } = request.body

      const tokenFromCode = await db.query.tokens.findFirst({
        where: eq(tables.tokens.id, code),
      })

      if (!tokenFromCode) {
        throw new UnauthorizedError('Invalid code')
      }

      const passwordHash = await hash(password, env.SALT_ROUNDS)

      await db
        .update(tables.users)
        .set({ passwordHash })
        .where(eq(tables.users.id, tokenFromCode.userId))

      return reply.status(204).send()
    },
  })
}
