import { z } from 'zod/v4-mini'

export const roleSchema = z.union([z.literal('ADMIN'), z.literal('MEMBER')])

export type Role = z.infer<typeof roleSchema>
