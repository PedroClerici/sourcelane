import 'zod-openapi/extend'
import { hash } from 'bcryptjs'
import { and, eq } from 'drizzle-orm'
import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { db, tables } from '@/lib/drizzle'
import { env } from '@/utils/env'
import { BadRequestError, ConflictError } from '@/utils/errors'

export default async function createAccount(app: FastifyZodOpenApiInstance) {
  app.post('/users', {
    schema: {
      tags: ['Auth'],
      summary: 'Create a new account.',
      operationId: 'createNewAccount',
      body: z.object({
        name: z.string().openapi({ example: 'John Doe' }),
        email: z.string().email().openapi({ example: 'john.doe@example.com' }),
        password: z.string().min(6).openapi({ example: '123456' }),
      }),
      response: {
        201: z.null(),
        [BadRequestError.status]: BadRequestError.schema,
        [ConflictError.status]: ConflictError.schema,
      },
    },
    handler: async (request, reply) => {
      const { name, email, password } = request.body

      const userWithSameEmail = await db.query.users.findFirst({
        where: eq(tables.users.email, email),
      })

      if (userWithSameEmail) {
        throw new ConflictError('A user with the same email already exists')
      }

      const [, domain] = email.split('@')

      const autoJoinOrganization = await db.query.organizations.findFirst({
        where: and(
          eq(tables.organizations.domain, domain),
          eq(tables.organizations.shouldAttachUsersByDomain, true),
        ),
      })

      const passwordHash = await hash(password, env.SALT_ROUNDS)

      const [{ userId }] = await db
        .insert(tables.users)
        .values({ name, email, passwordHash })
        .returning({ userId: tables.users.id })

      if (autoJoinOrganization) {
        await db.insert(tables.members).values({
          organizationId: autoJoinOrganization.id,
          userId,
        })
      }

      return reply.status(201).send()
    },
  })
}
