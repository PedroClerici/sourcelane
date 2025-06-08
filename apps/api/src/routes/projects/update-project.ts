import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'
import { eq } from 'drizzle-orm'
import { db, tables } from '@/lib/drizzle'
import { ForbiddenError, NotFoundError } from '@/utils/errors'
import { getUserPermissions } from '@/utils/get-user-permissions'

export default function updateProject(app: FastifyZodOpenApiInstance) {
  app.register(auth).put(
    '/organizations/:organizationSlug/projects/:projectId',
    {
      schema: {
        tags: ['Project'],
        summary: 'Update Project details.',
        security: [{ bearerAuth: [] }],
        params: z.object({
          organizationSlug: z.string(),
          projectId: z.string().uuid(),
        }),
        body: z.object({
          name: z.string(),
          description: z.string(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, replay) => {
      const { organizationSlug, projectId } = request.params
      const { membership } = await request.getUserMembership(organizationSlug)
      const { name, description } = request.body

      const project = await db.query.projects.findFirst({
        where: eq(tables.projects.id, projectId),
      })

      if (!project) {
        throw new NotFoundError(`Could'nt find project`)
      }

      const { cannot } = getUserPermissions(membership.userId, membership.role)

      if (cannot('update', 'Project')) {
        throw new ForbiddenError(`You're not allowed to update this project`)
      }

      await db.update(tables.projects).set({
        name,
        description,
      })

      return replay.status(204).send()
    },
  )
}
