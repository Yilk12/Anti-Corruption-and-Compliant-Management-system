export type PasswordPolicy = {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireDigit: boolean
  requireAtSymbol: boolean
}

export const defaultPolicy: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireAtSymbol: true,
}

export function policyFromSettings(settings?: Record<string, string | undefined>): PasswordPolicy {
  const s = settings || {}
  const parseBool = (v: string | undefined, def: boolean) => {
    if (v == null) return def
    return v.toLowerCase() === 'true'
  }
  const parseIntSafe = (v: string | undefined, def: number) => {
    const n = v ? parseInt(v, 10) : NaN
    return Number.isFinite(n) && n > 0 ? n : def
  }
  return {
    minLength: parseIntSafe(s['password_min_length'], defaultPolicy.minLength),
    requireUppercase: parseBool(s['password_require_uppercase'], defaultPolicy.requireUppercase),
    requireLowercase: parseBool(s['password_require_lowercase'], defaultPolicy.requireLowercase),
    requireDigit: parseBool(s['password_require_digit'], defaultPolicy.requireDigit),
    requireAtSymbol: parseBool(s['password_require_at'], defaultPolicy.requireAtSymbol),
  }
}

export type PasswordValidationResult = {
  ok: boolean
  errors: string[]
}

export function validatePassword(pwd: string, policy: PasswordPolicy = defaultPolicy): PasswordValidationResult {
  const errors: string[] = []
  if (!pwd || pwd.length < policy.minLength) errors.push(`Must be at least ${policy.minLength} characters`)
  if (policy.requireUppercase && !/[A-Z]/.test(pwd)) errors.push('Must include an uppercase letter')
  if (policy.requireLowercase && !/[a-z]/.test(pwd)) errors.push('Must include a lowercase letter')
  if (policy.requireDigit && !/[0-9]/.test(pwd)) errors.push('Must include a number')
  if (policy.requireAtSymbol && !/@/.test(pwd)) errors.push("Must include '@'")
  return { ok: errors.length === 0, errors }
}
