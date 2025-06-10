import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'
import { organizationSchema } from '@sourcelane/auth'
import { eq } from 'drizzle-orm'
import { db, tables } from '@/lib/drizzle'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors'
import { getUserPermissions } from '@/utils/get-user-permissions'

export default function transferOrganization(app: FastifyZodOpenApiInstance) {
  app.register(auth).patch(
    '/organizations/:organizationSlug/owner',
    {
      schema: {
        tags: ['Organizations'],
        summary: 'Update organization details',
        security: [{ bearerAuth: [] }],
        params: z.object({
          organizationSlug: z.string(),
        }),
        body: z.object({
          transferToUserId: z.string().uuid(),
        }),
        response: {
          204: z.null(),
          [BadRequestError.status]: BadRequestError.schema,
          [UnauthorizedError.status]: UnauthorizedError.schema,
          [NotFoundError.status]: NotFoundError.schema,
          [ConflictError.status]: ConflictError.schema,
        },
      },
    },
    async (request, replay) => {
      const { organizationSlug } = request.params
      const { transferToUserId } = request.body

      const { membership, organization } =
        await request.getUserMembership(organizationSlug)

      const authOrganization = organizationSchema.parse(organization)

      const { cannot } = getUserPermissions(membership.userId, membership.role)

      if (cannot('transfer_ownership', authOrganization)) {
        throw new ForbiddenError(
          `You're no allowed to transfer this organization ownership`,
        )
      }

      const transferToMembership = await db.query.members.findFirst({
        where: eq(tables.members.userId, transferToUserId),
      })

      if (!transferToMembership) {
        throw new ConflictError(
          'Target user is not member of this organization',
        )
      }

      await db.transaction(async tx => {
        await tx
          .update(tables.members)
          .set({ role: 'ADMIN' })
          .where(eq(tables.members.userId, transferToUserId))

        await tx
          .update(tables.organizations)
          .set({
            ownerId: transferToUserId,
          })
          .where(eq(tables.organizations.id, organization.id))
      })

      return replay.status(204).send()
    },
  )
}
