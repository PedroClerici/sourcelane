import { eq } from 'drizzle-orm'
import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { db, tables } from '@/lib/drizzle'
import 'zod-openapi/extend'
import { BadRequestError, NotFoundError } from '@/utils/errors'

export default function getInvite(app: FastifyZodOpenApiInstance) {
  app.get(
    '/invites/:inviteId',
    {
      schema: {
        tags: ['Invites'],
        summary: 'Get an invite',
        params: z.object({
          inviteId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            invite: z.object({
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
          }),
          [BadRequestError.status]: BadRequestError.schema,
          [NotFoundError.status]: NotFoundError.schema,
        },
      },
    },
    async (request, replay) => {
      const { inviteId } = request.params

      const invite = await db.query.invites.findFirst({
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
        where: eq(tables.invites.id, inviteId),
      })

      if (!invite) {
        throw new NotFoundError(`Invite not found or expired.`)
      }

      return replay.status(200).send({ invite })
    },
  )
}
