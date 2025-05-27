import { relations, sql } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { invites } from './invites'
import { members } from './members'
import { users } from './users'

export const organizations = pgTable('organizations', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  domain: text().unique(),
  shouldAttachUsersByDomain: boolean('should_attach_users_by_domain')
    .notNull()
    .default(false),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),

  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id),
})

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    owner: one(users, {
      fields: [organizations.ownerId],
      references: [users.id],
    }),
    invites: many(invites),
    members: many(members),
  }),
)
