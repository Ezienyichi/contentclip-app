'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { colors, radius } from '@/lib/tokens';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

const TYPE_ICON: Record<string, string> = {
  clip_ready: '🎬',
  credits_low: '⚡',
  upgrade: '🔒',
  warning: '⚠️',
  info: 'ℹ️',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      fetchNotifications(user.id);
    });
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open && userId) fetchNotifications(userId);
  };

  const markAllRead = async () => {
    if (!userId) return;
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotifClick = async (n: AppNotification) => {
    if (!n.read && userId) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationId: n.id }),
      });
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          width: 38,
          height: 38,
          borderRadius: radius.md,
          border: `1px solid ${open ? colors.primary : colors.outlineVariant}`,
          background: open ? `${colors.primary}15` : colors.surfaceContainerHigh,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={open ? colors.primary : colors.onSurfaceVariant} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: colors.primary,
              color: '#000',
              fontSize: 9,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 320,
            maxHeight: 420,
            background: colors.surfaceContainerLowest,
            border: `1px solid ${colors.outlineVariant}`,
            borderRadius: radius.xl,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            zIndex: 200,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${colors.outlineVariant}`,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.onSurface }}>
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    color: colors.primary,
                    background: `${colors.primary}20`,
                    padding: '1px 6px',
                    borderRadius: 8,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: 11,
                  color: colors.primary,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && notifications.length === 0 ? (
              <p
                style={{
                  fontSize: 13,
                  color: colors.onSurfaceVariant,
                  textAlign: 'center',
                  padding: '32px 16px',
                  margin: 0,
                }}
              >
                Loading…
              </p>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 28, margin: '0 0 8px' }}>🔔</p>
                <p style={{ fontSize: 13, color: colors.onSurfaceVariant, margin: 0 }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '12px 16px',
                    borderBottom: `1px solid ${colors.outlineVariant}`,
                    background: n.read ? 'transparent' : `${colors.primary}08`,
                    border: 'none',
                    borderBottomColor: colors.outlineVariant,
                    borderBottomStyle: 'solid' as const,
                    borderBottomWidth: 1,
                    cursor: n.link ? 'pointer' : 'default',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                    {TYPE_ICON[n.type] ?? 'ℹ️'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: n.read ? 500 : 700,
                        color: colors.onSurface,
                        lineHeight: 1.4,
                      }}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: 12,
                          color: colors.onSurfaceVariant,
                          lineHeight: 1.4,
                        }}
                      >
                        {n.body}
                      </p>
                    )}
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 11,
                        color: colors.onSurfaceVariant,
                        opacity: 0.7,
                      }}
                    >
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                  {!n.read && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: colors.primary,
                        flexShrink: 0,
                        marginTop: 5,
                      }}
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
