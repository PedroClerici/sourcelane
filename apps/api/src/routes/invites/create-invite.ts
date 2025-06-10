import type { FastifyZodOpenApiInstance } from 'fastify-zod-openapi'
import { z } from 'zod'
import { auth } from '@/middlewares/auth'
import 'zod-openapi/extend'
import { and, eq } from 'drizzle-orm'
import { db, tables } from '@/lib/drizzle'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors'
import { getUserPermissions } from '@/utils/get-user-permissions'

export default function createInvite(app: FastifyZodOpenApiInstance) {
  app.register(auth).post(
    '/organizations/:organizationSlug/invites',
    {
      schema: {
        tags: ['Invites'],
        summary: 'Create a new invite',
        security: [{ bearerAuth: [] }],
        params: z.object({
          organizationSlug: z.string(),
        }),
        body: z.object({
          email: z.string().email(),
          role: z.enum(['ADMIN', 'MEMBER']),
        }),
        response: {
          201: z.object({
            inviteId: z.string().uuid(),
          }),
          [BadRequestError.status]: BadRequestError.schema,
          [UnauthorizedError.status]: UnauthorizedError.schema,
          [NotFoundError.status]: NotFoundError.schema,
          [ForbiddenError.status]: ForbiddenError.schema,
          [ConflictError.status]: ConflictError.schema,
        },
      },
    },
    async (request, replay) => {
      const { organizationSlug } = request.params
      const { membership, organization } =
        await request.getUserMembership(organizationSlug)
      const { email, role } = request.body

      const { cannot } = getUserPermissions(membership.userId, membership.role)

      if (cannot('create', 'Invite')) {
        throw new ForbiddenError(`You're not allowed to create new invites`)
      }

      const [, domain] = email.split('@')

      if (
        organization.shouldAttachUsersByDomain &&
        organization.domain === domain
      ) {
        throw new ConflictError(
          `Users with "${domain}" will join your organization automatically on login`,
        )
      }

      const inviteWithSameEmail = await db.query.invites.findFirst({
        where: and(
          eq(tables.invites.email, email),
          eq(tables.invites.organizationId, organization.id),
        ),
      })

      if (inviteWithSameEmail) {
        throw new ConflictError(
          'Another invite with the same e-mail for this organization already exists',
        )
      }

      const [memberWithSameEmail] = await db
        .select()
        .from(tables.members)
        .innerJoin(tables.users, eq(tables.members.userId, tables.users.id))
        .where(
          and(
            eq(tables.members.organizationId, organization.id),
            eq(tables.users.email, email),
          ),
        )

      if (memberWithSameEmail) {
        throw new ConflictError(
          'Another member with this e-mail already belongs to your organization',
        )
      }

      const [{ inviteId }] = await db
        .insert(tables.invites)
        .values({
          organizationId: organization.id,
          email,
          role,
          authorId: membership.userId,
        })
        .returning({ inviteId: tables.invites.id })

      return replay.status(201).send({ inviteId })
    },
  )
}
