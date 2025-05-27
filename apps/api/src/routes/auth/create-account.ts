import 'zod-openapi/extend'
import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'

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
      response: {
        200: z.object({
          id: z.string().uuid(),
          name: z.string().openapi({ example: 'John Doe' }),
          email: z.string().openapi({ example: 'john.doe@example.com' }),
        }),
      },
    },
    handler: async (request, reply) => {
      const { name, email } = request.body

      const users = {
        id: crypto.randomUUID(),
        name,
        email,
      }

      return reply.status(200).send(users)
    },
  })
}
