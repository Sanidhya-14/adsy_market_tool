'use server';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { verifySession } from '@/lib/dal';
import { createSession } from '@/lib/session';
import type { IndustryMode } from '@/lib/commodities';

const VALID_MODES: IndustryMode[] = ['specialty-chem', 'life-sciences', 'energy'];

export async function updateIndustryMode(
  mode: IndustryMode
): Promise<{ success: boolean; error?: string }> {
  if (!VALID_MODES.includes(mode)) {
    return { success: false, error: 'Invalid mode.' };
  }

  // verifySession redirects to /login if unauthenticated — intentionally outside try/catch
  const session = await verifySession();

  try {
    await connectDB();
    await User.findByIdAndUpdate(session.userId, { industryMode: mode });
    await createSession({
      id: session.userId,
      email: session.email,
      name: session.name,
      industryMode: mode,
    });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update mode.' };
  }
}
