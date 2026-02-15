import { cookies } from 'next/headers';

const SESSION_COOKIE = 'openclaw-session';
const SESSION_TOKEN = 'authenticated';

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_TOKEN;
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function getSessionToken(): string {
  return SESSION_TOKEN;
}
