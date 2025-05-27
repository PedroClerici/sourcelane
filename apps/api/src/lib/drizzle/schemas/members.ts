import { relations } from 'drizzle-orm'
import { pgEnum, pgTable, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { membersToProjects } from './members-to-projects'
import { organizations } from './organizations'
import { users } from './users'

export const role = pgEnum('role', ['ADMIN', 'MEMBER'])

export const members = pgTable(
  'members',
  {
    id: uuid().primaryKey().defaultRandom(),
    role: role().notNull().default('MEMBER'),

    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
  },
  table => [uniqueIndex().on(table.organizationId, table.userId)],
)

export const membersRelations = relations(members, ({ one, many }) => ({
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [members.organizationId],
    references: [organizations.id],
  }),
  projects: many(membersToProjects),
}))
