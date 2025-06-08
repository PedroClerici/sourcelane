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

    authorId: uuid('author_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
  },
  table => [
    uniqueIndex().on(table.email, table.organizationId),
    index().on(table.email),
  ],
)

export const invitesRelations = relations(invites, ({ one }) => ({
  author: one(users, {
    fields: [invites.authorId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [invites.organizationId],
    references: [organizations.id],
  }),
}))
