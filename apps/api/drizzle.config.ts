import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/drizzle/schemas/*',
  out: './drizzle',
  dbCredentials: {
    url: 'postgresql://docker:docker@localhost:5432/sourcelane',
  },
  // verbose: true,
  strict: true,
})
