import { createServerSupabase } from '@/lib/supabase-server';

export const ADMIN_EMAILS = ['chiemerieama29@gmail.com'];

export async function checkAdminAuth() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { isAdmin: false, user: null };

    const isAdmin = ADMIN_EMAILS.includes((user.email ?? '').toLowerCase());
    return { isAdmin, user };
  } catch {
    return { isAdmin: false, user: null };
  }
}
