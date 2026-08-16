'use client';
import React, { useState, useEffect } from 'react';
import OnboardingQA from './OnboardingQA';
import ContentTips  from './ContentTips';
import MemoryGame   from './MemoryGame';

type Activity = 'qa' | 'tips' | 'puzzle';

const LS_KEY = 'vc_last_activity';

export interface EngagementProfile {
  acquisition_source?: string | null;
  content_category?:   string | null;
}

interface Props {
  isClipping:  boolean;
  userId:      string;
  profile:     EngagementProfile | null;
  onDismiss:   () => void;
}

export default function EngagementPanel({ isClipping, userId, profile, onDismiss }: Props) {
  const [visible,  setVisible]  = useState(false);
  const [activity, setActivity] = useState<Activity | null>(null);
  // Local copy updated after QA completes so ContentTips renders with new category
  const [localCategory, setLocalCategory] = useState<string | null | undefined>(profile?.content_category);

  // Auto-close as soon as clipping finishes — this is the critical safety guarantee
  useEffect(() => {
    if (!isClipping) {
      setVisible(false);
      setActivity(null);
    }
  }, [isClipping]);

  // Decide activity when clipping starts
  useEffect(() => {
    if (!isClipping || !userId) return;

    const needsQA = !profile?.acquisition_source;
    if (needsQA) {
      setActivity('qa');
    } else {
      const last = localStorage.getItem(LS_KEY);
      const next: Activity = last === 'tips' ? 'puzzle' : 'tips';
      localStorage.setItem(LS_KEY, next);
      setActivity(next);
    }
    setLocalCategory(profile?.content_category);
    setVisible(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClipping, userId]);

  const dismiss = () => {
    setVisible(false);
    setActivity(null);
    onDismiss();
  };

  const handleQAComplete = async (answers: {
    acquisition_source: string;
    content_category:   string;
    main_goal:          string;
  }) => {
    // Fire-and-forget save; don't block the UI on it
    fetch('/api/user/onboarding', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(answers),
    }).catch(() => {});

    // Show tips for the rest of this clipping session
    setLocalCategory(answers.content_category);
    const next: Activity = 'tips';
    localStorage.setItem(LS_KEY, next);
    setActivity(next);
  };

  const handleQASkip = () => {
    // Mark as skipped so Q&A never shows again
    fetch('/api/user/onboarding', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ acquisition_source: 'skipped' }),
    }).catch(() => {});

    const next: Activity = 'tips';
    localStorage.setItem(LS_KEY, next);
    setActivity(next);
  };

  if (!visible || !activity) return null;

  return (
    <>
      {/* Backdrop — semi-transparent so progress is still visible underneath */}
      <div
        onClick={dismiss}
        style={{
          position:   'fixed',
          inset:       0,
          background: 'rgba(0,0,0,0.30)',
          zIndex:      400,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position:     'fixed',
          top:          '50%',
          left:         '50%',
          transform:    'translate(-50%, -50%)',
          zIndex:       401,
          width:        '100%',
          maxWidth:     460,
          margin:       '0 16px',
          background:   '#fff',
          borderRadius: 16,
          padding:      '28px 28px 24px',
          boxShadow:    '0 20px 60px rgba(0,0,0,0.22)',
          boxSizing:    'border-box',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 0 3px rgba(34,197,94,0.20)',
              animation: 'vc-pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6B6560' }}>
              Clipping in progress…
            </span>
          </div>
          <button
            onClick={dismiss}
            aria-label="Close"
            style={{
              background: 'none', border: 'none',
              color: '#6B6560', fontSize: 18, lineHeight: 1,
              cursor: 'pointer', padding: '2px 4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Active activity */}
        {activity === 'qa' && (
          <OnboardingQA
            onComplete={handleQAComplete}
            onSkip={handleQASkip}
          />
        )}
        {activity === 'tips' && (
          <ContentTips
            contentCategory={localCategory}
            onDismiss={dismiss}
          />
        )}
        {activity === 'puzzle' && (
          <MemoryGame onDismiss={dismiss} />
        )}
      </div>

      <style>{`
        @keyframes vc-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.20); }
          50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
        }
      `}</style>
    </>
  );
}
