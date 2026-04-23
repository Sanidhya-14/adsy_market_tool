'use server';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { createSession, deleteSession } from '@/lib/session';

export type AuthState = { error?: string } | undefined;

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  try {
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return { error: 'Invalid email or password.' };

    if (!user.password) {
      return { error: 'This account uses Google Sign-In. Please use the "Continue with Google" button.' };
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return { error: 'Invalid email or password.' };
    }

    await createSession({ id: user._id.toString(), email: user.email, name: user.name });
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }

  redirect('/');
}

export async function register(_state: AuthState, formData: FormData): Promise<AuthState> {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { error: 'All fields are required.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  try {
    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return { error: 'An account with this email already exists.' };
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });

    await createSession({ id: user._id.toString(), email: user.email, name: user.name });
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }

  redirect('/');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}
