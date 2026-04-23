import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

const PUBLIC_ROUTES = ['/login', '/register'];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC_ROUTES.includes(path);

  const cookie = req.cookies.get('session')?.value;
  const session = await decrypt(cookie);
  const isAuthed = Boolean(session?.userId);

  if (!isPublic && !isAuthed) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (isPublic && isAuthed) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.(?:png|svg|jpg|jpeg|ico|webp)$).*)'],
};
