import { relations } from 'drizzle-orm'
import { pgEnum, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const accountProvider = pgEnum('account_provider', ['GITHUB'])

export const accounts = pgTable(
  'accounts',
  {
    id: uuid().primaryKey().defaultRandom(),
    provider: accountProvider().notNull(),
    providerAccountId: text('provider_account_id').notNull().unique(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  table => [uniqueIndex().on(table.provider, table.userId)],
)

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))
