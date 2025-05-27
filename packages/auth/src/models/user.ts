import { z } from 'zod/v4-mini'
import { roleSchema } from '../roles'

export const userSchema = z.object({
  __typename: z._default(z.literal('User'), 'User'),
  id: z.string(),
  role: roleSchema,
})

export type User = z.infer<typeof userSchema>
