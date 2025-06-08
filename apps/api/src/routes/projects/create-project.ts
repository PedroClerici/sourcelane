import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'
import { db, tables } from '@/lib/drizzle'
import { createSlug } from '@/utils/create-slug'
import { ForbiddenError } from '@/utils/errors'
import { getUserPermissions } from '@/utils/get-user-permissions'

export default function createProject(app: FastifyZodOpenApiInstance) {
  app.register(auth).post(
    '/organizations/:organizationSlug/projects',
    {
      schema: {
        tags: ['Project'],
        summary: 'Create a new project.',
        security: [{ bearerAuth: [] }],
        params: z.object({
          organizationSlug: z.string(),
        }),
        body: z.object({
          name: z.string(),
          description: z.string(),
        }),
        response: {
          201: z.object({
            projectId: z.string().uuid(),
          }),
        },
      },
    },
    async (request, replay) => {
      const { organizationSlug } = request.params
      const { membership, organization } =
        await request.getUserMembership(organizationSlug)
      const { name, description } = request.body

      const { cannot } = getUserPermissions(membership.userId, membership.role)

      if (cannot('create', 'Project')) {
        throw new ForbiddenError(`You're not allowed to create new projects`)
      }

      const [{ projectId }] = await db
        .insert(tables.projects)
        .values({
          name,
          description,
          slug: createSlug(name),
          organizationId: organization.id,
          ownerId: membership.userId,
        })
        .returning({ projectId: tables.projects.id })

      return replay.status(201).send({ projectId })
    },
  )
}
