import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'
import { projectSchema } from '@sourcelane/auth'
import { eq } from 'drizzle-orm'
import { db, tables } from '@/lib/drizzle'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors'
import { getUserPermissions } from '@/utils/get-user-permissions'

export default function deleteProject(app: FastifyZodOpenApiInstance) {
  app.register(auth).delete(
    '/organizations/:organizationSlug/projects/:projectId',
    {
      schema: {
        tags: ['Project'],
        summary: 'Delete a project.',
        operationId: 'deleteProject',
        security: [{ bearerAuth: [] }],
        params: z.object({
          organizationSlug: z.string(),
          projectId: z.string().uuid(),
        }),
        response: {
          204: z.null(),
          [BadRequestError.status]: BadRequestError.schema,
          [UnauthorizedError.status]: UnauthorizedError.schema,
          [NotFoundError.status]: NotFoundError.schema,
          [ForbiddenError.status]: ForbiddenError.schema,
        },
      },
    },
    async (request, replay) => {
      const { organizationSlug, projectId } = request.params
      const { membership } = await request.getUserMembership(organizationSlug)

      const project = await db.query.projects.findFirst({
        where: eq(tables.projects.id, projectId),
      })

      if (!project) {
        throw new NotFoundError(`Could'nt find project`)
      }

      const authProject = projectSchema.parse(project)

      const { cannot } = getUserPermissions(membership.userId, membership.role)

      if (cannot('delete', authProject)) {
        throw new ForbiddenError(`You're not allowed to delete this project`)
      }

      await db.delete(tables.projects).where(eq(tables.projects.id, project.id))

      return replay.status(204).send()
    },
  )
}
