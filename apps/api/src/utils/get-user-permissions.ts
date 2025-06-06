import { defineAbilityFor, userSchema } from '@sourcelane/auth'

export function getUserPermissions(userId: string, role: 'MEMBER' | 'ADMIN') {
  const authUser = userSchema.parse({
    id: userId,
    role,
  })

  const ability = defineAbilityFor(authUser)

  return ability
}
