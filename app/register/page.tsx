'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { register } from '@/app/actions/auth';
import { Loader2, UserPlus, BarChart2, Mail } from 'lucide-react';

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

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image src="/adsy_logo.png" alt="Adsy Global" width={56} height={56} className="rounded-xl object-contain" />
          <h1 className="mt-3 text-lg font-bold text-teal-400 uppercase tracking-widest">Adsy Global</h1>
          <p className="text-xs text-slate-500 mt-0.5">Procurement Intelligence Platform</p>
        </div>

        {/* Value prop banner */}
        <div className="mb-5 flex items-start gap-3 px-4 py-3.5 bg-teal-950/40 border border-teal-800/40 rounded-xl">
          <div className="flex gap-2 mt-0.5 shrink-0">
            <BarChart2 size={14} className="text-teal-400" />
            <Mail size={14} className="text-teal-400" />
          </div>
          <p className="text-xs text-teal-300/80 leading-relaxed">
            Sign up to access live procurement data and receive market updates.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl shadow-black/40">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-100">Create account</h2>
            <p className="text-sm text-slate-500 mt-1">Free access to chemical & energy intelligence</p>
          </div>

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
            <span className="text-xs text-slate-600 font-medium">or register with email</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {state?.error && (
            <div className="mb-5 px-4 py-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-sm text-rose-400">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-400 mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Jane Smith"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/30 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 mb-1.5">
                Work Email
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
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/30 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors mt-2"
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {pending ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-6">
          © 2026 Adsy Global · Your data is secure and never shared.
        </p>
      </div>
    </div>
  );
}
