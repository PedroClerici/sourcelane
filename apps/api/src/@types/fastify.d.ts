import 'fastify'

import type { InferSelectModel } from 'drizzle-orm'
import type { members, organizations } from '@/lib/drizzle/schemas'

type Organization = InferSelectModel<typeof organizations>
type Member = InferSelectModel<typeof members>

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentUserId(): Promise<string>
    getUserMembership(
      organizationSlug: string,
    ): Promise<{ organization: Organization; membership: Member }>
  }
}
