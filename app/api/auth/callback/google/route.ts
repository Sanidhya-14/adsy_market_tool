import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { createSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}`, appUrl));

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const savedState = req.cookies.get('oauth_state')?.value;

  if (!code || !state || state !== savedState) {
    return fail('oauth_failed');
  }

  try {
    // Exchange code → tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appUrl}/api/auth/callback/google`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) return fail('oauth_failed');

    // Fetch Google profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profile.email) return fail('no_email');

    // Upsert user in MongoDB — captures email for mailing list
    await connectDB();
    let user = await User.findOne({ email: profile.email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email.toLowerCase(),
        password: '',
      });
    }

    await createSession({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      industryMode: user.industryMode ?? 'specialty-chem',
    });

    // Clear the state cookie
    const res = NextResponse.redirect(new URL('/', appUrl));
    res.cookies.delete('oauth_state');
    return res;
  } catch {
    return fail('oauth_failed');
  }
}
