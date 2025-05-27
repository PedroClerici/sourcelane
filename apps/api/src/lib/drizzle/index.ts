import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schemas'

export * as tables from './schemas'

const pool = new Pool({
  connectionString: 'postgresql://docker:docker@localhost:5432/sourcelane',
})

export const db = drizzle({ client: pool, schema })
