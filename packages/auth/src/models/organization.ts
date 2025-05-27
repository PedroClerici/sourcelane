import { z } from 'zod/v4-mini'

export const organizationSchema = z.object({
  __typename: z._default(z.literal('Organization'), 'Organization'),
  id: z.string(),
  ownerId: z.string(),
})

export type Organization = z.infer<typeof organizationSchema>
