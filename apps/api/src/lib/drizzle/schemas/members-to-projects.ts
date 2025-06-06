import { relations } from 'drizzle-orm'
import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { members } from './members'
import { projects } from './projects'

export const membersToProjects = pgTable(
  'members_to_projects',
  {
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
  },
  table => [primaryKey({ columns: [table.memberId, table.projectId] })],
)

export const membersToProjectsRelations = relations(
  membersToProjects,
  ({ one }) => ({
    member: one(members, {
      fields: [membersToProjects.memberId],
      references: [members.id],
    }),
    projects: one(projects, {
      fields: [membersToProjects.projectId],
      references: [projects.id],
    }),
  }),
)
