import { faker } from '@faker-js/faker'
import { hash } from 'bcryptjs'
import { sql } from 'drizzle-orm'
import { db, tables } from '@/lib/drizzle'

async function seed() {
  console.log('Emptying the entire database.')
  for (const table of Object.values(tables)) {
    const query = sql`TRUNCATE TABLE ${table} CASCADE;`
    await db.execute(query)
  }

  const passwordHash = await hash('masterKey', 1)

  const [user, ...otherUsers] = await db
    .insert(tables.users)
    .values([
      {
        name: 'John Doe',
        email: 'john.doe@acme.com',
        avatarUrl: faker.image.avatarGitHub(),
        passwordHash,
      },
      {
        name: faker.internet.username(),
        email: faker.internet.email(),
        avatarUrl: faker.image.avatarGitHub(),
        passwordHash,
      },
      {
        name: faker.internet.username(),
        email: faker.internet.email(),
        avatarUrl: faker.image.avatarGitHub(),
        passwordHash,
      },
    ])
    .returning()

  await db.transaction(async tx => {
    const [acmeAdmin] = await tx
      .insert(tables.organizations)
      .values({
        name: 'Acme Inc (Admin)',
        domain: 'acme.com',
        slug: 'acme-admin',
        avatarUrl: faker.image.avatarGitHub(),
        shouldAttachUsersByDomain: true,
        ownerId: user.id,
      })
      .returning()

    await tx.insert(tables.members).values([
      { organizationId: acmeAdmin.id, userId: user.id, role: 'ADMIN' },
      {
        organizationId: acmeAdmin.id,
        userId: otherUsers[0].id,
        role: 'MEMBER',
      },
      {
        organizationId: acmeAdmin.id,
        userId: otherUsers[1].id,
        role: 'MEMBER',
      },
    ])

    await tx.insert(tables.projects).values([
      {
        organizationId: acmeAdmin.id,
        name: faker.lorem.words(5),
        slug: faker.lorem.slug(5),
        description: faker.lorem.paragraph(),
        avatarUrl: faker.image.avatarGitHub(),
        ownerId: faker.helpers.arrayElement([
          user.id,
          otherUsers[0].id,
          otherUsers[1].id,
        ]),
      },
    ])
  })

  await db.transaction(async tx => {
    const [acmeMember] = await tx
      .insert(tables.organizations)
      .values({
        name: 'Acme Inc (Member)',
        slug: 'acme-member',
        avatarUrl: faker.image.avatarGitHub(),
        ownerId: user.id,
      })
      .returning()

    await tx.insert(tables.members).values([
      {
        organizationId: acmeMember.id,
        userId: user.id,
        role: 'MEMBER',
      },
      {
        organizationId: acmeMember.id,
        userId: otherUsers[0].id,
        role: 'ADMIN',
      },
      {
        organizationId: acmeMember.id,
        userId: otherUsers[1].id,
        role: 'MEMBER',
      },
    ])

    await tx.insert(tables.projects).values([
      {
        organizationId: acmeMember.id,
        name: faker.lorem.words(5),
        slug: faker.lorem.slug(5),
        description: faker.lorem.paragraph(),
        avatarUrl: faker.image.avatarGitHub(),
        ownerId: faker.helpers.arrayElement([
          user.id,
          otherUsers[0].id,
          otherUsers[1].id,
        ]),
      },
      {
        organizationId: acmeMember.id,
        name: faker.lorem.words(5),
        slug: faker.lorem.slug(5),
        description: faker.lorem.paragraph(),
        avatarUrl: faker.image.avatarGitHub(),
        ownerId: faker.helpers.arrayElement([
          user.id,
          otherUsers[0].id,
          otherUsers[1].id,
        ]),
      },
      {
        organizationId: acmeMember.id,
        name: faker.lorem.words(5),
        slug: faker.lorem.slug(5),
        description: faker.lorem.paragraph(),
        avatarUrl: faker.image.avatarGitHub(),
        ownerId: faker.helpers.arrayElement([
          user.id,
          otherUsers[0].id,
          otherUsers[1].id,
        ]),
      },
    ])
  })
}

seed().then(() => {
  console.log('Database seeded!')
})
