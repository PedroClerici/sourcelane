import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '@/utils/env'
import * as schema from './schemas'

export * as tables from './schemas'

const pool = new Pool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  application_name: env.DB_NAME,
  port: env.DB_PORT,
})

export const db = drizzle({ client: pool, schema })
