import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  industryMode: string;
  expiresAt: string;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET not set in .env.local');
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: Omit<SessionPayload, 'expiresAt'> & { expiresAt: Date }) {
  return new SignJWT({ ...payload, expiresAt: payload.expiresAt.toISOString() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function decrypt(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(user: {
  id: string;
  email: string;
  name: string;
  industryMode?: string;
}) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await encrypt({
    userId: user.id,
    email: user.email,
    name: user.name,
    industryMode: user.industryMode ?? 'specialty-chem',
    expiresAt,
  });
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
