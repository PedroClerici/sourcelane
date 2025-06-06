import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'
import { organizationSchema } from '@sourcelane/auth'
import { and, eq, ne } from 'drizzle-orm'
import { db, tables } from '@/lib/drizzle'
import { ConflictError, ForbiddenError } from '@/utils/errors'
import { getUserPermissions } from '@/utils/get-user-permissions'

export default function updateOrganization(app: FastifyZodOpenApiInstance) {
  app.register(auth).post(
    '/organizations/:organizationSlug',
    {
      schema: {
        tags: ['Organization'],
        summary: 'Update organization details.',
        security: [{ bearerAuth: [] }],
        params: z.object({
          organizationSlug: z.string(),
        }),
        body: z.object({
          name: z.string().openapi({ example: 'acme' }),
          domain: z.string().toLowerCase().nullish(),
          shouldAttachUsersByDomain: z.boolean().optional(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, replay) => {
      const { organizationSlug } = request.params
      const { name, domain, shouldAttachUsersByDomain } = request.body

      const { membership, organization } =
        await request.getUserMembership(organizationSlug)

      const authOrganization = organizationSchema.parse(organization)

      const { cannot } = getUserPermissions(membership.userId, membership.role)

      if (cannot('update', authOrganization)) {
        throw new ForbiddenError(
          `You're no allowed to update this organization`,
        )
      }

      if (domain) {
        const organizationByDomain = await db.query.organizations.findFirst({
          where: and(
            eq(tables.organizations.domain, domain),
            ne(tables.organizations.id, organization.id),
          ),
        })

        if (organizationByDomain) {
          throw new ConflictError(
            'Organization with the same domain already exists',
          )
        }
      }

      await db
        .update(tables.organizations)
        .set({
          name,
          domain,
          shouldAttachUsersByDomain,
        })
        .where(eq(tables.organizations.id, organization.id))

      return replay.status(204).send()
    },
  )
}
