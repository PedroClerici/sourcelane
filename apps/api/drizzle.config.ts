import { defineConfig } from 'drizzle-kit'
import { env } from './src/utils/env'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/drizzle/schemas/*',
  out: './drizzle/migrations',
  dbCredentials: {
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: env.DB_PORT,
    ssl: false,
  },
  // verbose: true,
  strict: true,
})
