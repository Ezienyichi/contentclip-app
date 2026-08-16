'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

const TIMEOUT_MS = 3 * 60 * 60 * 1000;              // 3 hours
const WARN_MS    = (3 * 60 * 60 - 2 * 60) * 1000;   // show warning 2 min before logout

export function useInactivityLogout() {
  const router      = useRouter();
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [warning, setWarning] = useState(false);

  const signOutNow = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: 'global' });
    Object.keys(localStorage)
      .filter(k => k.startsWith('sb-'))
      .forEach(k => localStorage.removeItem(k));
    router.push('/auth');
  }, [router]);

  const reset = useCallback(() => {
    setWarning(false);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (warnTimer.current)   clearTimeout(warnTimer.current);
    warnTimer.current   = setTimeout(() => setWarning(true), WARN_MS);
    logoutTimer.current = setTimeout(signOutNow, TIMEOUT_MS);
  }, [signOutNow]);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      if (warnTimer.current)   clearTimeout(warnTimer.current);
    };
  }, [reset]);

  return { warning, stayLoggedIn: reset };
}
