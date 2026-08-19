'use client';
import { useState, useEffect, useCallback } from 'react';

const LS_KEY = 'vc_tours_seen';

function getSeenMap(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}'); } catch { return {}; }
}

function markSeen(pageKey: string) {
  try {
    const m = getSeenMap();
    m[pageKey] = true;
    localStorage.setItem(LS_KEY, JSON.stringify(m));
  } catch {}
}

export function useTour(pageKey: string, totalSteps: number) {
  const [isOpen, setIsOpen] = useState(false);
  const [step,   setStep]   = useState(0);

  // Auto-start once per page, after a short delay so the page renders first
  useEffect(() => {
    const t = setTimeout(() => {
      if (!getSeenMap()[pageKey]) {
        setStep(0);
        setIsOpen(true);
      }
    }, 900);
    return () => clearTimeout(t);
  }, [pageKey]);

  const finish = useCallback(() => {
    setIsOpen(false);
    markSeen(pageKey);
  }, [pageKey]);

  const next = useCallback(() => {
    if (step >= totalSteps - 1) {
      finish();
    } else {
      setStep(s => s + 1);
    }
  }, [step, totalSteps, finish]);

  const back    = useCallback(() => setStep(s => Math.max(0, s - 1)), []);
  const skip    = useCallback(() => finish(), [finish]);
  const restart = useCallback(() => { setStep(0); setIsOpen(true); }, []);

  return { isOpen, step, next, back, skip, restart };
}
