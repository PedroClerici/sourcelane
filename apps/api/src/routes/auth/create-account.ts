import 'zod-openapi/extend'
import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { db, tables } from '@/lib/drizzle'
import { ConflictError } from '@/utils/errors'

export default async function createAccount(app: FastifyZodOpenApiInstance) {
  app.post('/users', {
    schema: {
      tags: ['Auth'],
      summary: 'Create a new account.',
      body: z.object({
        name: z.string().openapi({ example: 'John Doe' }),
        email: z.string().openapi({ example: 'john.doe@example.com' }),
        password: z.string().min(6).openapi({ example: '123456' }),
      }),
    },
    handler: async (request, reply) => {
      const { name, email, password } = request.body

      const userWithSameEmail = await db.query.users.findFirst({
        where: eq(tables.users.email, email),
      })

      if (userWithSameEmail) {
        throw new ConflictError(
          'User already exists.',
          'A user with the same email already exists.',
        )
      }

      const passwordHash = await hash(password, 6)

      await db.insert(tables.users).values({ name, email, passwordHash })

      return reply.status(201).send()
    },
  })
}
