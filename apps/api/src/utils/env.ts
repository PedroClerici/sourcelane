import { config } from 'dotenv'
import { z } from 'zod'

config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number(),
  ADDRESS: z.string(),
  SALT_ROUNDS: z.coerce.number(),
  JWT_SECRET: z.string(),
  JWT_TOKEN_EXPIRE_IN_DAYS: z.coerce.number(),

  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number(),
  DB_NAME: z.string(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (parsedEnv.success === false) {
  console.error(parsedEnv.error.format(), 'Invalid environment variables.')

  throw new Error('Invalid environment variables.')
}

export const env = Object.freeze(parsedEnv.data)
