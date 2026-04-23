'use client';
import { Suspense } from 'react';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { login } from '@/app/actions/auth';
import { Loader2, LogIn } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const oauthErrors: Record<string, string> = {
  oauth_failed: 'Google sign-in failed. Please try again.',
  no_email: 'Could not retrieve email from Google. Please try again.',
};

function OAuthError() {
  const params = useSearchParams();
  const error = params.get('error');
  if (!error) return null;
  return (
    <div className="mb-5 px-4 py-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-sm text-rose-400">
      {oauthErrors[error] ?? 'Authentication failed. Please try again.'}
    </div>
  );
}

function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image src="/adsy_logo.png" alt="Adsy Global" width={56} height={56} className="rounded-xl object-contain" />
          <h1 className="mt-3 text-lg font-bold text-teal-400 uppercase tracking-widest">Adsy Global</h1>
          <p className="text-xs text-slate-500 mt-0.5">Procurement Intelligence Platform</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl shadow-black/40">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-100">Sign in</h2>
            <p className="text-sm text-slate-500 mt-1">Access live procurement intelligence</p>
          </div>

          <Suspense fallback={null}>
            <OAuthError />
          </Suspense>

          {/* Google button */}
          <a
            href="/api/auth/google"
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-semibold py-3 px-4 rounded-xl transition-colors mb-5"
          >
            <GoogleIcon />
            Continue with Google
          </a>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {state?.error && (
            <div className="mb-5 px-4 py-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-sm text-rose-400">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/30 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/30 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors mt-2"
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {pending ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            No account?{' '}
            <Link href="/register" className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-6">
          © 2026 Adsy Global · Procurement Intelligence
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
