import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

export const ADMIN_SESSION_COOKIE = 'rezoomed_admin_session'

const ADMIN_SESSION_ISSUER = 'rezoomed-admin'
const ADMIN_SESSION_AUDIENCE = 'rezoomed-admin'

export interface AdminSession {
  adminUserId: string
  username: string
}

function getAdminSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET

  if (!secret) {
    throw new Error('Missing ADMIN_SESSION_SECRET')
  }

  return new TextEncoder().encode(secret)
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  }
}

export async function createAdminSessionToken(session: AdminSession) {
  return await new SignJWT({
    username: session.username,
    role: 'admin',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.adminUserId)
    .setIssuer(ADMIN_SESSION_ISSUER)
    .setAudience(ADMIN_SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(getAdminSecret())
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getAdminSecret(), {
      issuer: ADMIN_SESSION_ISSUER,
      audience: ADMIN_SESSION_AUDIENCE,
    })

    const adminUserId = typeof payload.sub === 'string' ? payload.sub : null
    const username = typeof payload.username === 'string' ? payload.username : null

    if (!adminUserId || !username) {
      return null
    }

    return {
      adminUserId,
      username,
    }
  } catch {
    return null
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (!token) {
    return null
  }

  return await verifyAdminSessionToken(token)
}
