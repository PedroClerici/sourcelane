import { relations, sql } from 'drizzle-orm'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { accounts } from './accounts'
import { invites } from './invites'
import { members } from './members'
import { organizations } from './organizations'
import { projects } from './projects'
import { tokens } from './tokens'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text(),
  email: text().unique(),
  passwordHash: text('password_hash'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
})

export const usersRelations = relations(users, ({ many }) => ({
  tokens: many(tokens),
  accounts: many(accounts),
  invites: many(invites),
  memberOn: many(members),
  ownsOrganizations: many(organizations),
  ownsProjects: many(projects),
}))
