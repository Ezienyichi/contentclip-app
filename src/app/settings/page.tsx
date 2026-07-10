'use client';
import { createClient } from '@/lib/supabase-browser';
import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors, gradients, radius, inputField } from '@/lib/tokens';

const supabase = createClient();

// Minute budgets per plan (1 credit = 1 minute)
const PLAN_INFO: Record<string, { label: string; minutes: number }> = {
  free:         { label: 'Free',    minutes: 30   },
  starter:      { label: 'Starter', minutes: 300  },
  solo:         { label: 'Starter', minutes: 300  },
  pro:          { label: 'Pro',     minutes: 750  },
  professional: { label: 'Pro',     minutes: 750  },
  agency:       { label: 'Agency',  minutes: 1500 },
};

const TOP_TIERS = new Set(['pro', 'professional', 'agency']);

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function SettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState('profile');

  // Profile state
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [memberSince, setMemberSince] = useState('');

  // Plan / usage state
  const [userPlan, setUserPlan] = useState('free');
  const [userCredits, setUserCredits] = useState(0);

  // Notifications
  const [notifs, setNotifs] = useState({ clips: true, weekly: true, published: false, templates: false });

  // UI state
  const [showCancel, setShowCancel] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setUserEmail(user.email ?? '');

      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, plan, credits, created_at, clip_ready_notify, weekly_digest')
        .eq('id', user.id)
        .single();

      if (p) {
        const parts = (p.full_name ?? '').split(' ');
        setFirstName(parts[0] ?? '');
        setLastName(parts.slice(1).join(' ') ?? '');
        setUserPlan(p.plan ?? 'free');
        setUserCredits(typeof p.credits === 'number' ? p.credits : 0);
        setMemberSince(p.created_at ?? '');
        setNotifs(n => ({
          ...n,
          clips: p.clip_ready_notify ?? true,
          weekly: p.weekly_digest ?? false,
        }));
      }
    })();
  }, []);

  // Derived usage values
  const planInfo   = PLAN_INFO[userPlan] ?? PLAN_INFO.free;
  const planLimit  = planInfo.minutes;
  const minutesRemaining = Math.min(userCredits, planLimit);
  const minutesUsed      = Math.max(0, planLimit - minutesRemaining);
  const usagePct         = planLimit > 0 ? Math.round((minutesUsed / planLimit) * 100) : 0;
  const isUpgradeable    = !TOP_TIERS.has(userPlan);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const sendEmail = async (type: string, data: Record<string, unknown> = {}) => {
    if (!userId) return;
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, userId, data }),
    });
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { const r = new FileReader(); r.onload = ev => setAvatar(ev.target?.result as string); r.readAsDataURL(f); }
  };

  const toggleNotif = async (key: keyof typeof notifs) => {
    const v = !notifs[key];
    setNotifs(p => ({ ...p, [key]: v }));
    if (userId) {
      await supabase.from('profiles').update({
        clip_ready_notify: key === 'clips' ? v : notifs.clips,
        weekly_digest: key === 'weekly' ? v : notifs.weekly,
      }).eq('id', userId);
      showToast('Preference saved');
    }
  };

  const integrations = [
    { name: 'YouTube',   icon: 'smart_display', connected: true,  color: '#FF0000', info: "Connect your YouTube channel to publish Shorts directly from VangelClip. You'll need to authorize with your Google account." },
    { name: 'TikTok',    icon: 'music_note',    connected: false, color: '#fff',    info: 'Link your TikTok account to schedule and auto-publish clips. Requires a TikTok Business or Creator account.' },
    { name: 'Instagram', icon: 'photo_camera',  connected: false, color: '#E1306C', info: 'Connect Instagram to publish Reels. Requires a Professional Instagram account linked to a Facebook Business page.' },
    { name: 'LinkedIn',  icon: '',              connected: false, color: '#0A66C2', info: 'Connect LinkedIn to share clips as posts or native video directly to your professional network. Requires a LinkedIn Business or Creator account.' },
  ];

  const tabs = [
    { id: 'profile',       label: 'Profile',       icon: 'person' },
    { id: 'billing',       label: 'Plan & Usage',  icon: 'credit_card' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'integrations',  label: 'Integrations',  icon: 'extension' },
  ];

  // ── Row helper for read-only account detail rows ──
  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${colors.outlineVariant}20` }}>
      <span style={{ fontSize: '13px', color: colors.onSurfaceVariant }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: colors.onSurface }}>{value || '—'}</span>
    </div>
  );

  return (
    <>
      <DashboardLayout title="Settings" subtitle="Manage your account, plan, and preferences.">

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200, padding: '12px 20px', borderRadius: radius.lg, background: toast.ok ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.ok ? 'rgba(74,222,128,0.35)' : 'rgba(239,68,68,0.35)'}`, color: toast.ok ? '#4ade80' : '#fca5a5', fontSize: '13px', fontWeight: 600 }}>
            {toast.msg}
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%', boxSizing: 'border-box' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 20px', borderRadius: radius.md, background: tab === t.id ? colors.surfaceContainerHighest : 'transparent', color: tab === t.id ? colors.onSurface : colors.onSurfaceVariant, border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap' }}>
              <Icon name={t.icon} size={16} />{t.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div style={{ maxWidth: '640px' }}>
            {/* Account details (read-only summary) */}
            <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '28px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Account Details</h3>
              <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, marginBottom: '20px' }}>Your account information from VangelClip.</p>
              <DetailRow label="Name"         value={`${firstName} ${lastName}`.trim()} />
              <DetailRow label="Email"        value={userEmail} />
              <DetailRow label="Member since" value={fmtDate(memberSince)} />
            </div>

            {/* Edit name */}
            <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '28px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Edit Name</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <div onClick={() => fileRef.current?.click()} style={{ width: 64, height: 64, borderRadius: '50%', background: avatar ? `url(${avatar}) center/cover` : gradients.cta, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: '#fff', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
                  {avatar ? <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (firstName?.[0] ?? 'V')}
                </div>
                <div>
                  <button onClick={() => fileRef.current?.click()} style={{ padding: '8px 14px', borderRadius: radius.md, background: colors.surfaceContainer, border: '1px solid ' + colors.outlineVariant, color: colors.onSurface, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Change Avatar</button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
                  <p style={{ fontSize: '11px', color: colors.onSurfaceVariant, marginTop: '4px' }}>JPG, PNG. Max 2MB.</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: '6px' }}>First Name</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inputField} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: '6px' }}>Last Name</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} style={inputField} />
                </div>
              </div>
              <button
                onClick={async () => {
                  setSaving(true);
                  const fullName = `${firstName} ${lastName}`.trim();
                  const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', userId);
                  if (error) { showToast('Save failed: ' + error.message, false); }
                  else { await supabase.auth.updateUser({ data: { full_name: fullName } }); showToast('Name saved'); }
                  setSaving(false);
                }}
                disabled={saving}
                style={{ background: gradients.primary, color: '#FAF7FF', fontWeight: 700, padding: '11px 24px', borderRadius: radius.md, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', marginTop: '20px', fontFamily: "'Inter',sans-serif", opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Saving…' : 'Save Name'}
              </button>
            </div>

            {/* Change password */}
            <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '28px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Change Password</h3>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: '6px' }}>New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters" style={inputField} />
                <p style={{ fontSize: '11px', color: colors.onSurfaceVariant, marginTop: '4px' }}>Use 8+ characters with uppercase, numbers, and symbols.</p>
              </div>
              <button
                onClick={async () => {
                  if (!newPassword || newPassword.length < 8) { showToast('Password must be at least 8 characters', false); return; }
                  setSaving(true);
                  const { error } = await supabase.auth.updateUser({ password: newPassword });
                  if (error) { showToast(error.message, false); }
                  else { setNewPassword(''); showToast('Password updated'); }
                  setSaving(false);
                }}
                style={{ background: colors.surfaceContainer, color: colors.onSurface, border: '1px solid ' + colors.outlineVariant, fontWeight: 600, padding: '10px 22px', borderRadius: radius.md, cursor: 'pointer', fontSize: '13px', marginTop: '16px', fontFamily: "'Inter',sans-serif" }}
              >
                Update Password
              </button>
            </div>

            {/* Danger zone */}
            <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '28px', border: '1px solid rgba(255,180,171,0.2)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', color: colors.error }}>Danger Zone</h3>
              <p style={{ fontSize: '13px', color: colors.onSurfaceVariant, marginBottom: '16px' }}>Deleting your account is permanent. All projects, clips, and data will be erased.</p>
              <button onClick={() => setShowDelete(true)} style={{ background: 'rgba(255,180,171,0.08)', color: colors.error, border: '1px solid rgba(255,180,171,0.3)', fontWeight: 600, padding: '10px 22px', borderRadius: radius.md, cursor: 'pointer', fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>Delete Account</button>
            </div>
          </div>
        )}

        {/* ── PLAN & USAGE TAB ── */}
        {tab === 'billing' && (
          <div style={{ maxWidth: '640px' }}>

            {/* Plan + minutes card */}
            <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '28px', marginBottom: '16px' }}>
              {/* Plan header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Current Plan</p>
                  <h3 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.01em' }}>{planInfo.label}</h3>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: colors.primary, background: colors.primary + '18', padding: '4px 12px', borderRadius: radius.full, border: '1px solid ' + colors.primary + '40', marginTop: '4px' }}>
                  {planInfo.label.toUpperCase()}
                </span>
              </div>

              {/* Minutes remaining */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: colors.onSurfaceVariant }}>Minutes remaining this month</p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: colors.onSurface }}>
                    <span style={{ fontSize: '22px' }}>{minutesRemaining}</span>
                    <span style={{ color: colors.onSurfaceVariant, fontWeight: 400 }}> / {planLimit} min</span>
                  </p>
                </div>
                {/* Progress bar — shows usage, not remaining */}
                <div style={{ height: '6px', background: colors.surfaceContainer, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${usagePct}%`,
                    background: usagePct > 85 ? '#ef4444' : gradients.primary,
                    borderRadius: '3px',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <p style={{ fontSize: '11px', color: colors.onSurfaceVariant }}>{minutesUsed} min used</p>
                  <p style={{ fontSize: '11px', color: colors.onSurfaceVariant }}>Resets at the start of each billing month</p>
                </div>
              </div>

              {/* Upgrade CTA */}
              {isUpgradeable && (
                <button
                  onClick={() => router.push('/pricing')}
                  style={{ background: gradients.primary, color: '#FAF7FF', fontWeight: 700, padding: '11px 24px', borderRadius: radius.md, border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: "'Inter',sans-serif", display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icon name="upgrade" size={16} /> Upgrade Plan
                </button>
              )}
            </div>

            {/* What's included */}
            <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '28px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>What&apos;s included</h3>
              {[
                { label: 'Processing minutes', value: `${planLimit} min / month` },
                { label: 'Export quality',      value: userPlan === 'free' ? '720p (watermark)' : userPlan === 'starter' || userPlan === 'solo' ? '2K, no watermark' : '4K, no watermark' },
                { label: 'Aspect ratios',       value: 'All 4 (9:16, 16:9, 1:1, 4:5)' },
                { label: 'Auto-captions',       value: 'Included' },
                { label: 'Post scheduling',     value: (userPlan === 'free') ? '—' : 'Included' },
              ].map(row => (
                <DetailRow key={row.label} label={row.label} value={row.value} />
              ))}
            </div>

            {/* Cancel (non-free plans only) */}
            {userPlan !== 'free' && (
              <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '20px', border: '1px solid rgba(255,180,171,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: colors.onSurface, marginBottom: '2px' }}>Cancel plan</p>
                    <p style={{ fontSize: '12px', color: colors.onSurfaceVariant }}>You&apos;ll keep access until the end of your billing period.</p>
                  </div>
                  <button onClick={() => setShowCancel(true)} style={{ padding: '8px 16px', borderRadius: radius.md, background: 'transparent', color: colors.error, border: '1px solid rgba(255,180,171,0.3)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter',sans-serif", flexShrink: 0 }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {tab === 'notifications' && (
          <div style={{ maxWidth: '640px' }}>
            <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '28px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Notification Preferences</h3>
              {([
                { key: 'clips'     as const, label: 'Clip generation complete',  desc: 'Get notified when your clips are ready' },
                { key: 'weekly'    as const, label: 'Weekly analytics report',   desc: 'Summary of your content performance' },
                { key: 'published' as const, label: 'Scheduled post published',  desc: 'Confirmation when posts go live' },
                { key: 'templates' as const, label: 'New template available',    desc: 'Discover trending clip formats' },
              ]).map((n, i) => (
                <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: i < 3 ? `1px solid ${colors.outlineVariant}20` : 'none' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{n.label}</p>
                    <p style={{ fontSize: '12px', color: colors.onSurfaceVariant }}>{n.desc}</p>
                  </div>
                  <button onClick={() => toggleNotif(n.key)} style={{ width: 44, height: 24, borderRadius: radius.full, background: notifs[n.key] ? colors.primary : colors.surfaceContainer, cursor: 'pointer', position: 'relative', border: 'none', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: notifs[n.key] ? 23 : 3, transition: 'left 0.2s' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── INTEGRATIONS TAB ── */}
        {tab === 'integrations' && (
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {integrations.map(int => (
                <div key={int.name} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: 44, height: 44, borderRadius: radius.md, background: int.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {int.name === 'LinkedIn'
                          ? <svg viewBox="0 0 24 24" width="22" height="22" fill={int.color}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                          : <Icon name={int.icon} size={22} style={{ color: int.color }} />
                        }
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>{int.name}</p>
                        <p style={{ fontSize: '12px', color: int.connected ? '#4ade80' : colors.onSurfaceVariant }}>{int.connected ? 'Connected' : 'Not connected'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(int.connected ? int.name + ' disconnected' : int.name + ' connection started — you will be redirected to authorize.')}
                      style={{ padding: '8px 16px', borderRadius: radius.md, background: int.connected ? 'transparent' : gradients.primary, color: int.connected ? colors.onSurfaceVariant : '#FAF7FF', border: int.connected ? '1px solid ' + colors.outlineVariant : 'none', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
                    >
                      {int.connected ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                  <div style={{ background: colors.surfaceContainer, borderRadius: radius.md, padding: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Icon name="info" size={15} style={{ color: colors.primary, flexShrink: 0, marginTop: '1px' }} />
                    <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, lineHeight: 1.6 }}>{int.info}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CANCEL MODAL ── */}
        {showCancel && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowCancel(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: '32px', width: '100%', maxWidth: '440px' }}>
              <Icon name="warning" size={40} style={{ color: '#fbbf24', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Cancel Your Plan?</h3>
              <p style={{ fontSize: '14px', color: colors.onSurfaceVariant, lineHeight: 1.7, marginBottom: '24px' }}>
                Your plan stays active until your current billing period ends. After that, you&apos;ll move to the Free plan (30 minutes/month).
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowCancel(false)} style={{ flex: 1, padding: '12px', borderRadius: radius.md, background: gradients.primary, color: '#FAF7FF', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Keep My Plan</button>
                <button
                  onClick={async () => {
                    setSaving(true);
                    await supabase.from('profiles').update({ plan: 'free', credits: 30 }).eq('id', userId);
                    await sendEmail('plan_cancelled', {});
                    setShowCancel(false);
                    setUserPlan('free');
                    setUserCredits(30);
                    showToast('Plan cancelled');
                    setSaving(false);
                  }}
                  style={{ flex: 1, padding: '12px', borderRadius: radius.md, background: 'transparent', color: colors.error, border: '1px solid rgba(255,180,171,0.3)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}
                >
                  Cancel Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DELETE MODAL ── */}
        {showDelete && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowDelete(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: '32px', width: '100%', maxWidth: '440px' }}>
              <Icon name="delete_forever" size={40} style={{ color: colors.error, marginBottom: '16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Delete Your Account?</h3>
              <p style={{ fontSize: '14px', color: colors.onSurfaceVariant, lineHeight: 1.7, marginBottom: '16px' }}>
                This is <strong style={{ color: '#fff' }}>permanent and irreversible</strong>. All your projects, clips, and data will be erased.
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: '6px' }}>Type DELETE to confirm</label>
                <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE" style={inputField} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setShowDelete(false); setDeleteConfirm(''); }} style={{ flex: 1, padding: '12px', borderRadius: radius.md, background: colors.surfaceContainer, color: colors.onSurface, border: '1px solid ' + colors.outlineVariant, fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Cancel</button>
                <button
                  disabled={deleteConfirm !== 'DELETE'}
                  onClick={async () => {
                    setSaving(true);
                    await sendEmail('account_deleted', {});
                    await supabase.from('profiles').delete().eq('id', userId);
                    await supabase.auth.signOut();
                    router.push('/auth');
                  }}
                  style={{ flex: 1, padding: '12px', borderRadius: radius.md, background: deleteConfirm === 'DELETE' ? colors.errorContainer : 'rgba(255,180,171,0.05)', color: deleteConfirm === 'DELETE' ? '#fff' : colors.onSurfaceVariant, border: 'none', fontWeight: 700, fontSize: '13px', cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed', fontFamily: "'Inter',sans-serif", opacity: deleteConfirm === 'DELETE' ? 1 : 0.4 }}
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

      </DashboardLayout>
    </>
  );
}
