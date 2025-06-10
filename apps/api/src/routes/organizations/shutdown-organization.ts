import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'
import { organizationSchema } from '@sourcelane/auth'
import { eq } from 'drizzle-orm'
import { db, tables } from '@/lib/drizzle'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors'
import { getUserPermissions } from '@/utils/get-user-permissions'

export default function updateOrganization(app: FastifyZodOpenApiInstance) {
  app.register(auth).delete(
    '/organizations/:organizationSlug',
    {
      schema: {
        tags: ['Organizations'],
        summary: 'Shutdown organization',
        security: [{ bearerAuth: [] }],
        params: z.object({
          organizationSlug: z.string(),
        }),
        response: {
          204: z.null(),
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

      const authOrganization = organizationSchema.parse(organization)

      const { cannot } = getUserPermissions(membership.userId, membership.role)

      if (cannot('delete', authOrganization)) {
        throw new ForbiddenError(
          `You're no allowed to shutdown this organization`,
        )
      }

      await db
        .delete(tables.organizations)
        .where(eq(tables.organizations.id, organization.id))

      return replay.status(204).send()
    },
  )
}
