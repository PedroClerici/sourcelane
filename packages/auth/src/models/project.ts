import { z } from 'zod/v4-mini'

export const projectSchema = z.object({
  __typename: z._default(z.literal('Project'), 'Project'),
  id: z.string(),
  ownerId: z.string(),
})

export type Project = z.infer<typeof projectSchema>
