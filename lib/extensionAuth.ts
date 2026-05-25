// HS256 JWT for the Chrome extension. Self-contained so we don't pull in a JWT
// library — claims are simple and the verify path stays edge-friendly.

const ENCODER = new TextEncoder()
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

export interface ExtensionJwtClaims {
  sub: string
  email: string
  plan: 'free' | 'pro'
  iat: number
  exp: number
}

export interface MintInput {
  userId: string
  email: string
  plan: 'free' | 'pro'
}

function getSecret(): string {
  const secret = process.env.EXTENSION_JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('EXTENSION_JWT_SECRET must be set and at least 32 chars')
  }
  return secret
}

function base64UrlEncode(input: ArrayBuffer | Uint8Array | string): string {
  const bytes =
    typeof input === 'string'
      ? ENCODER.encode(input)
      : input instanceof Uint8Array
        ? input
        : new Uint8Array(input)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64UrlDecodeToString(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4)
  return atob(padded)
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    ENCODER.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function signExtensionJwt(input: MintInput): Promise<{ token: string; expiresAt: number }> {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + TOKEN_TTL_SECONDS
  const claims: ExtensionJwtClaims = {
    sub: input.userId,
    email: input.email,
    plan: input.plan,
    iat,
    exp,
  }
  const header = { alg: 'HS256', typ: 'JWT' }
  const headerB64 = base64UrlEncode(JSON.stringify(header))
  const payloadB64 = base64UrlEncode(JSON.stringify(claims))
  const signingInput = `${headerB64}.${payloadB64}`
  const key = await importKey(getSecret())
  const sig = await crypto.subtle.sign('HMAC', key, ENCODER.encode(signingInput))
  const sigB64 = base64UrlEncode(sig)
  return { token: `${signingInput}.${sigB64}`, expiresAt: exp }
}

export async function verifyExtensionJwt(token: string): Promise<ExtensionJwtClaims | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerB64, payloadB64, sigB64] = parts

  // Verify signature first to make this constant-time-ish against forged claims.
  const key = await importKey(getSecret())
  const sigBytes = Uint8Array.from(base64UrlDecodeToString(sigB64), (c) => c.charCodeAt(0))
  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes,
    ENCODER.encode(`${headerB64}.${payloadB64}`)
  )
  if (!ok) return null

  let claims: ExtensionJwtClaims
  try {
    claims = JSON.parse(base64UrlDecodeToString(payloadB64)) as ExtensionJwtClaims
  } catch {
    return null
  }

  if (typeof claims.exp !== 'number' || claims.exp < Math.floor(Date.now() / 1000)) return null
  if (typeof claims.sub !== 'string' || !claims.sub) return null
  return claims
}

export async function readBearerClaims(request: Request): Promise<ExtensionJwtClaims | null> {
  const auth = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!auth) return null
  const [scheme, token] = auth.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return verifyExtensionJwt(token)
}
