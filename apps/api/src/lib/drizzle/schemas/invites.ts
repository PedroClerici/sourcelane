import { relations } from 'drizzle-orm'
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { role } from './members'
import { organizations } from './organizations'
import { users } from './users'

export const invites = pgTable(
  'invites',
  {
    id: uuid().primaryKey().defaultRandom(),
    email: text().notNull(),
    role: role().notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),

    userId: uuid('user_id').references(() => users.id),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
  },
  table => [
    uniqueIndex().on(table.email, table.organizationId),
    index().on(table.email),
  ],
)

export const invitesRelations = relations(invites, ({ one }) => ({
  author: one(users, {
    fields: [invites.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [invites.organizationId],
    references: [organizations.id],
  }),
}))
