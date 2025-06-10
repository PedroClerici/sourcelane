import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'
import { and, eq } from 'drizzle-orm'
import { db, tables } from '@/lib/drizzle'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors'
import { getUserPermissions } from '@/utils/get-user-permissions'

export default function getProjects(app: FastifyZodOpenApiInstance) {
  app.register(auth).get(
    '/organizations/:organizationSlug/projects',
    {
      schema: {
        tags: ['Projects'],
        summary: 'Get organization projects',
        security: [{ bearerAuth: [] }],
        params: z.object({
          organizationSlug: z.string(),
        }),
        response: {
          200: z.object({
            projects: z.array(
              z.object({
                id: z.string().uuid(),
                slug: z.string(),
                name: z.string().nullable(),
                description: z.string().nullable(),
                avatarUrl: z.string().url().nullable(),
                ownerId: z.string().uuid(),
                organizationId: z.string().uuid(),
                createdAt: z.date(),
                updatedAt: z.date(),
                owner: z.object({
                  id: z.string().uuid(),
                  name: z.string().nullable(),
                  avatarUrl: z.string().url().nullable(),
                }),
              }),
            ),
          }),
          [UnauthorizedError.status]: UnauthorizedError.schema,
          [NotFoundError.status]: NotFoundError.schema,
          [ForbiddenError.status]: ForbiddenError.schema,
        },
      },
    },
    async (request, replay) => {
      const { organizationSlug } = request.params
      const { membership, organization } =
        await request.getUserMembership(organizationSlug)

      const { cannot } = getUserPermissions(membership.userId, membership.role)

      if (cannot('read', 'Project')) {
        throw new ForbiddenError(`You're not allowed to see those projects`)
      }

      const projects = await db.query.projects.findMany({
        columns: {
          id: true,
          slug: true,
          name: true,
          description: true,
          avatarUrl: true,
          organizationId: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
        where: and(eq(tables.projects.organizationId, organization.id)),
        with: {
          owner: {
            columns: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      })

      return replay.status(200).send({ projects })
    },
  )
}
