import { relations } from 'drizzle-orm'
import { pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const tokenType = pgEnum('token_type', ['PASSWORD_RECOVER'])

export const tokens = pgTable('tokens', {
  id: uuid().primaryKey().defaultRandom(),
  type: tokenType().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),

  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
})

export const tokensRelations = relations(tokens, ({ one }) => ({
  user: one(users, {
    fields: [tokens.userId],
    references: [users.id],
  }),
}))
