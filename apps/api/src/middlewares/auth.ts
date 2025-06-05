import { and, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { fastifyPlugin } from 'fastify-plugin'
import { db, tables } from '@/lib/drizzle'
import { NotFoundError, UnauthorizedError } from '@/utils/errors'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async request => {
    request.getCurrentUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()

        return sub
      } catch {
        throw new UnauthorizedError('Invalid auth token')
      }
    }

    request.getUserMembership = async (organizationSlug: string) => {
      const userId = await request.getCurrentUserId()

      const organization = await db.query.organizations.findFirst({
        where: eq(tables.organizations.slug, organizationSlug),
      })

      if (!organization) {
        throw new NotFoundError(`Couldn't find organization`)
      }

      const membership = await db.query.members.findFirst({
        where: and(
          eq(tables.members.userId, userId),
          eq(tables.members.organizationId, organization.id),
        ),
      })

      if (!membership) {
        throw new UnauthorizedError(`You're not a member of this organization`)
      }

      return {
        organization,
        membership,
      }
    }
  })
})
