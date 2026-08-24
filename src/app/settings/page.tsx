'use client';
import { createClient } from '@/lib/supabase-browser';
import { clearClipStorage } from '@/lib/clearClipStorage';
import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors as _colors, gradients, radius, inputField as _inputField } from '@/lib/tokens';
import { useTour } from '@/lib/useTour';
import Tour from '@/components/tour/Tour';
import TourInfoIcon from '@/components/tour/TourInfoIcon';
import { SETTINGS_STEPS } from '@/components/tour/tourSteps';

const colors = {
  ..._colors,
  background: '#E4E2DD',
  surfaceContainer: '#EFECEA',
  surfaceContainerHigh: '#EFECEA',
  surfaceContainerHighest: '#E8E5DF',
  surfaceContainerLowest: '#F5F3EF',
  onSurface: '#1A1714',
  onSurfaceVariant: '#6B6560',
  outlineVariant: 'rgba(0,0,0,0.12)',
};
const inputField: React.CSSProperties = { ..._inputField, background: '#F5F3EF', color: '#1A1714', border: '1px solid rgba(0,0,0,0.12)' };

const supabase = createClient();

// Minute budgets per plan (1 credit = 1 minute)
const PLAN_INFO: Record<string, { label: string; minutes: number }> = {
  free:         { label: 'Free',    minutes: 30  },
  starter:      { label: 'Starter', minutes: 180 },
  solo:         { label: 'Starter', minutes: 180 },
  pro:          { label: 'Pro',     minutes: 400 },
  professional: { label: 'Pro',     minutes: 400 },
  agency:       { label: 'Agency',  minutes: 900 },
};

const TOP_TIERS = new Set(['pro', 'professional', 'agency']);

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function SettingsPage() {
  const router = useRouter();
  const tour = useTour('settings', SETTINGS_STEPS.length);
  const [tab, setTab] = useState('profile');

  // Profile state
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
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

  // Load connected social accounts from the same DB source as the Scheduler
  React.useEffect(() => {
    fetch('/api/social/connections')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.connections) setSettingsConnections(d.connections); })
      .catch(() => {})
      .finally(() => setSettingsLoadingConns(false));
  }, []);

  const handleSettingsConnect = async (platformId: string) => {
    setSettingsConnecting(platformId);
    try {
      const res  = await fetch('/api/social/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: platformId }) });
      const data = await res.json();
      if (!res.ok || !data.authUrl) { showToast(data.error ?? 'Failed to start connection.', false); setSettingsConnecting(null); return; }
      window.location.href = data.authUrl;
    } catch { showToast('Network error. Please try again.', false); setSettingsConnecting(null); }
  };

  const handleSettingsDisconnect = async (connectionId: string, platformLabel: string) => {
    setSettingsDisconnecting(connectionId);
    try {
      const res = await fetch(`/api/social/connections/${connectionId}`, { method: 'DELETE' });
      if (res.ok) { setSettingsConnections(prev => prev.filter(c => c.id !== connectionId)); showToast(`${platformLabel} disconnected.`); }
      else { const d = await res.json(); showToast(d.error ?? 'Failed to disconnect.', false); }
    } catch { showToast('Network error. Please try again.', false); }
    finally { setSettingsDisconnecting(null); }
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

  // Connection state (integrations tab)
  const [settingsConnections,   setSettingsConnections]   = React.useState<{ id: string; platform: string; account_name: string | null }[]>([]);
  const [settingsLoadingConns,  setSettingsLoadingConns]  = React.useState(true);
  const [settingsConnecting,    setSettingsConnecting]    = React.useState<string | null>(null);
  const [settingsDisconnecting, setSettingsDisconnecting] = React.useState<string | null>(null);

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
      <DashboardLayout title="Settings" subtitle="Manage your account, plan, and preferences." bg="#E4E2DD" titleColor="#1A1714" subtitleColor="#6B6560" actions={<TourInfoIcon onClick={tour.restart} />}>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200, padding: '12px 20px', borderRadius: radius.lg, background: toast.ok ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.ok ? 'rgba(74,222,128,0.35)' : 'rgba(239,68,68,0.35)'}`, color: toast.ok ? '#4ade80' : '#fca5a5', fontSize: '13px', fontWeight: 600 }}>
            {toast.msg}
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%', boxSizing: 'border-box' }}>
          {tabs.map(t => (
            <button key={t.id} data-tour={`settings-tab-${t.id}`} onClick={() => setTab(t.id)} style={{ padding: '10px 20px', borderRadius: radius.md, background: tab === t.id ? colors.surfaceContainerHighest : 'transparent', color: tab === t.id ? colors.onSurface : colors.onSurfaceVariant, border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap' }}>
              <Icon name={t.icon} size={16} />{t.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div style={{ maxWidth: '640px' }}>
            {/* Account details (read-only summary) */}
            <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '28px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px', color: '#1A1714' }}>Account Details</h3>
              <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, marginBottom: '20px' }}>Your account information from VangelClip.</p>
              <DetailRow label="Name"         value={`${firstName} ${lastName}`.trim()} />
              <DetailRow label="Email"        value={userEmail} />
              <DetailRow label="Member since" value={fmtDate(memberSince)} />
            </div>

            {/* Edit name */}
            <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '28px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px', color: '#1A1714' }}>Edit Name</h3>
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
              <div className="settings-name-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px', color: '#1A1714' }}>Change Password</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: '6px' }}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setPwError(''); setPwSuccess(false); }}
                    placeholder="Min 8 characters"
                    style={inputField}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: '6px' }}>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setPwError(''); setPwSuccess(false); }}
                    placeholder="Re-enter new password"
                    style={inputField}
                  />
                </div>
                {pwError && (
                  <div style={{ padding: '10px 14px', borderRadius: radius.md, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '13px', lineHeight: 1.5 }}>
                    {pwError}
                  </div>
                )}
                {pwSuccess && (
                  <div style={{ padding: '10px 14px', borderRadius: radius.md, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', fontSize: '13px', fontWeight: 600 }}>
                    Password updated successfully!
                  </div>
                )}
              </div>
              <button
                disabled={savingPw}
                onClick={async () => {
                  setPwError('');
                  setPwSuccess(false);
                  if (!newPassword || newPassword.length < 8) {
                    setPwError('Password must be at least 8 characters.');
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setPwError('Passwords do not match.');
                    return;
                  }
                  setSavingPw(true);
                  try {
                    const { error } = await supabase.auth.updateUser({ password: newPassword });
                    if (error) {
                      setPwError(error.message);
                    } else {
                      setNewPassword('');
                      setConfirmPassword('');
                      setPwSuccess(true);
                    }
                  } catch (e: unknown) {
                    setPwError(e instanceof Error ? e.message : 'Failed to update password. Please try again.');
                  } finally {
                    setSavingPw(false);
                  }
                }}
                style={{ background: savingPw ? colors.surfaceContainer : gradients.primary, color: savingPw ? colors.onSurfaceVariant : '#FAF7FF', border: 'none', fontWeight: 700, padding: '11px 24px', borderRadius: radius.md, cursor: savingPw ? 'not-allowed' : 'pointer', fontSize: '13px', marginTop: '20px', fontFamily: "'Inter',sans-serif", opacity: savingPw ? 0.7 : 1 }}
              >
                {savingPw ? 'Updating…' : 'Update Password'}
              </button>
            </div>

            {/* Danger zone */}
            <div style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '28px', border: '1px solid rgba(220,38,38,0.25)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '6px', color: '#DC2626' }}>Danger Zone</h3>
              <p style={{ fontSize: '13px', color: '#4A4540', marginBottom: '16px' }}>Deleting your account is permanent. All projects, clips, and data will be erased.</p>
              <button onClick={() => setShowDelete(true)} style={{ background: 'rgba(220,38,38,0.1)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.35)', fontWeight: 700, padding: '10px 22px', borderRadius: radius.md, cursor: 'pointer', fontSize: '13px', fontFamily: "'Inter',sans-serif" }}>Delete Account</button>
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
                  <h3 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.01em', color: '#1A1714' }}>{planInfo.label}</h3>
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
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#1A1714' }}>What&apos;s included</h3>
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
              <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '20px', color: '#1A1714' }}>Notification Preferences</h3>
              {([
                { key: 'clips'     as const, label: 'Clip generation complete',  desc: 'Get notified when your clips are ready' },
                { key: 'weekly'    as const, label: 'Weekly analytics report',   desc: 'Summary of your content performance' },
                { key: 'published' as const, label: 'Scheduled post published',  desc: 'Confirmation when posts go live' },
                { key: 'templates' as const, label: 'New template available',    desc: 'Discover trending clip formats' },
              ]).map((n, i) => (
                <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: i < 3 ? `1px solid ${colors.outlineVariant}20` : 'none' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px', color: '#1A1714' }}>{n.label}</p>
                    <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, fontWeight: 500 }}>{n.desc}</p>
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
        {tab === 'integrations' && (() => {
          const PLATFORMS = [
            { id: 'tiktok',    label: 'TikTok',           bgColor: 'rgba(1,1,1,0.08)',      info: 'Link your TikTok account to schedule and auto-publish clips. Requires a TikTok Business or Creator account.',
              icon: <svg viewBox="0 0 24 24" width={22} height={22} fill="none"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.88a8.28 8.28 0 0 0 4.84 1.55V7a4.85 4.85 0 0 1-1.07-.31z" fill="#010101"/></svg> },
            { id: 'instagram', label: 'Instagram Reels',  bgColor: 'rgba(214,36,159,0.10)', info: 'Connect Instagram to publish Reels. Requires a Professional Instagram account linked to a Facebook Business page.',
              icon: <svg viewBox="0 0 24 24" width={22} height={22}><defs><radialGradient id="ig-set" cx="30%" cy="107%" r="150%"><stop offset="0%" stopColor="#fdf497"/><stop offset="5%" stopColor="#fdf497"/><stop offset="45%" stopColor="#fd5949"/><stop offset="60%" stopColor="#d6249f"/><stop offset="90%" stopColor="#285AEB"/></radialGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="url(#ig-set)"/></svg> },
            { id: 'youtube',   label: 'YouTube Shorts',  bgColor: 'rgba(255,0,0,0.08)',    info: "Connect your YouTube channel to publish Shorts directly from VangelClip. You'll need to authorize with your Google account.",
              icon: <svg viewBox="0 0 24 24" width={22} height={22}><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" fill="#FF0000"/></svg> },
            { id: 'facebook',  label: 'Facebook',        bgColor: 'rgba(24,119,242,0.10)', info: 'Connect Facebook to publish Reels and feed videos. Requires a Facebook Page (personal profiles are not supported).',
              icon: <svg viewBox="0 0 24 24" width={22} height={22}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/></svg> },
            { id: 'twitter',   label: 'X (Twitter)',     bgColor: 'rgba(0,0,0,0.07)',      info: 'Link your X account to post video clips. Requires a standard X (Twitter) account.',
              icon: <svg viewBox="0 0 24 24" width={22} height={22}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.857L1.261 2.25H8.08l4.261 5.638L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" fill="#000"/></svg> },
          ];
          return (
            <div style={{ maxWidth: '640px' }}>
              <p style={{ fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 16 }}>
                Accounts connected here are shared with the Scheduler — connect once, use everywhere.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {PLATFORMS.map(p => {
                  const conn          = settingsConnections.find(c => c.platform === p.id);
                  const isConnected   = !!conn;
                  const isConnecting  = settingsConnecting === p.id;
                  const isDisconn     = conn ? settingsDisconnecting === conn.id : false;
                  const busy          = isConnecting || isDisconn || settingsLoadingConns;
                  return (
                    <div key={p.id} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.lg, padding: '20px', border: isConnected ? '1px solid rgba(5,150,105,0.25)' : '1px solid transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: 44, height: 44, borderRadius: radius.md, background: p.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {p.icon}
                          </div>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1714', margin: 0 }}>{p.label}</p>
                            <p style={{ fontSize: '12px', color: isConnected ? '#059669' : colors.onSurfaceVariant, margin: '2px 0 0', fontWeight: isConnected ? 600 : 400 }}>
                              {settingsLoadingConns ? '...' : isConnected ? (conn.account_name ?? 'Connected') : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => isConnected ? handleSettingsDisconnect(conn.id, p.label) : handleSettingsConnect(p.id)}
                          disabled={busy}
                          style={{ padding: '8px 16px', borderRadius: radius.md, background: isConnected ? 'transparent' : gradients.primary, color: isConnected ? colors.onSurfaceVariant : '#FAF7FF', border: isConnected ? '1px solid ' + colors.outlineVariant : 'none', fontWeight: 600, fontSize: '12px', cursor: busy ? 'default' : 'pointer', fontFamily: "'Inter',sans-serif", opacity: busy ? 0.5 : 1, flexShrink: 0 }}
                        >
                          {isConnecting ? 'Opening...' : isDisconn ? 'Disconnecting...' : isConnected ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                      <div style={{ background: colors.surfaceContainer, borderRadius: radius.md, padding: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <Icon name="info" size={15} style={{ color: colors.primary, flexShrink: 0, marginTop: '1px' }} />
                        <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, lineHeight: 1.6, margin: 0 }}>{p.info}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <Tour steps={SETTINGS_STEPS} isOpen={tour.isOpen} step={tour.step} onNext={tour.next} onBack={tour.back} onSkip={tour.skip} />

        {/* ── CANCEL MODAL ── */}
        {showCancel && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowCancel(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: '32px', width: '100%', maxWidth: '440px' }}>
              <Icon name="warning" size={40} style={{ color: '#fbbf24', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#1A1714' }}>Cancel Your Plan?</h3>
              <p style={{ fontSize: '14px', color: '#4A4540', lineHeight: 1.7, marginBottom: '24px' }}>
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
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#1A1714' }}>Delete Your Account?</h3>
              <p style={{ fontSize: '14px', color: '#4A4540', lineHeight: 1.7, marginBottom: '16px' }}>
                This is <strong style={{ color: '#DC2626' }}>permanent and irreversible</strong>. All your projects, clips, and data will be erased.
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
                    clearClipStorage();
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

      <style>{`@media(max-width:640px){.settings-name-grid{grid-template-columns:1fr!important}}`}</style>
      </DashboardLayout>
    </>
  );
}
