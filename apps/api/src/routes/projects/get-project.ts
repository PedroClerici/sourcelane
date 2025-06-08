import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'
import { and, eq } from 'drizzle-orm'
import { db, tables } from '@/lib/drizzle'
import { ForbiddenError, NotFoundError } from '@/utils/errors'
import { getUserPermissions } from '@/utils/get-user-permissions'

export default function getProject(app: FastifyZodOpenApiInstance) {
  app.register(auth).get(
    '/organizations/:organizationSlug/projects/:projectSlug',
    {
      schema: {
        tags: ['Project'],
        summary: 'Get project details.',
        security: [{ bearerAuth: [] }],
        params: z.object({
          organizationSlug: z.string(),
          projectSlug: z.string(),
        }),
        response: {
          200: z.object({
            project: z.object({
              id: z.string().uuid(),
              slug: z.string(),
              name: z.string().nullable(),
              description: z.string().nullable(),
              avatarUrl: z.string().url().nullable(),
              ownerId: z.string().uuid(),
              organizationId: z.string().uuid(),
              owner: z.object({
                id: z.string().uuid(),
                name: z.string().nullable(),
                avatarUrl: z.string().url().nullable(),
              }),
            }),
          }),
        },
      },
    },
    async (request, replay) => {
      const { organizationSlug, projectSlug } = request.params
      const { membership, organization } =
        await request.getUserMembership(organizationSlug)

      const { cannot } = getUserPermissions(membership.userId, membership.role)

      if (cannot('read', 'Project')) {
        throw new ForbiddenError(`You're not allowed to see this project`)
      }

      const project = await db.query.projects.findFirst({
        columns: {
          id: true,
          slug: true,
          name: true,
          description: true,
          avatarUrl: true,
          organizationId: true,
          ownerId: true,
        },
        where: and(
          eq(tables.projects.slug, projectSlug),
          eq(tables.projects.organizationId, organization.id),
        ),
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

      if (!project) {
        throw new NotFoundError(`Could'nt find project`)
      }

      return replay.status(200).send({ project })
    },
  )
}
