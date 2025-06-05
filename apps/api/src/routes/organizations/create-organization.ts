import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'
import { eq } from 'drizzle-orm'
import { db, tables } from '@/lib/drizzle'
import { createSlug } from '@/utils/create-slug'
import { ConflictError } from '@/utils/errors'

export default function createOrganization(app: FastifyZodOpenApiInstance) {
  app.register(auth).post(
    '/organizations',
    {
      schema: {
        tags: ['Organization'],
        summary: 'Create a new organization.',
        security: [{ bearerAuth: [] }],
        body: z.object({
          name: z.string().openapi({ example: 'acme' }),
          domain: z.string().toLowerCase().nullish(),
          shouldAttachUsersByDomain: z.boolean().optional(),
        }),
        response: {
          201: z.object({
            organizationId: z.string().uuid(),
          }),
        },
      },
    },
    async (request, replay) => {
      const userId = await request.getCurrentUserId()
      const { name, domain, shouldAttachUsersByDomain } = request.body

      if (domain) {
        const organizationByDomain = await db.query.organizations.findFirst({
          where: eq(tables.organizations.domain, domain),
        })

        if (organizationByDomain) {
          throw new ConflictError(
            'Organization with the same domain already exists',
          )
        }
      }

      const organizationId = await db.transaction(async tx => {
        const [{ organizationId }] = await tx
          .insert(tables.organizations)
          .values({
            name,
            slug: createSlug(name),
            domain,
            shouldAttachUsersByDomain,
            ownerId: userId,
          })
          .returning({ organizationId: tables.organizations.id })

        await tx.insert(tables.members).values({
          organizationId,
          userId,
          role: 'ADMIN',
        })

        return organizationId
      })

      return replay.status(201).send({ organizationId })
    },
  )
}
