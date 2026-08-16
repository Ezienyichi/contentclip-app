import { createServerSupabase } from '@/lib/supabase-server';
import { ADMIN_EMAILS } from '@/lib/adminEmails';

export { ADMIN_EMAILS };

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
