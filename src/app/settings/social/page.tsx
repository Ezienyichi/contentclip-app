'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import UpgradeModal from '@/components/UpgradeModal';
import ComingSoonModal from '@/components/ComingSoonModal';
import { colors, radius } from '@/lib/tokens';
import Icon from '@/components/Icon';

const PLATFORMS = [
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: '#000000',
    bg: 'rgba(0,0,0,0.8)',
    description: 'Publish short clips directly to TikTok',
    plans: ['starter', 'pro', 'agency'],
  },
  {
    id: 'instagram',
    name: 'Instagram Reels',
    icon: '📸',
    color: '#E1306C',
    bg: 'rgba(225,48,108,0.15)',
    description: 'Post Reels to your Instagram account',
    plans: ['starter', 'pro', 'agency'],
  },
  {
    id: 'youtube',
    name: 'YouTube Shorts',
    icon: '▶',
    color: '#FF0000',
    bg: 'rgba(255,0,0,0.1)',
    description: 'Upload Shorts to your YouTube channel',
    plans: ['starter', 'pro', 'agency'],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: '#1877F2',
    bg: 'rgba(24,119,242,0.1)',
    description: 'Share clips to your Facebook page',
    plans: ['pro', 'agency'],
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '𝕏',
    color: '#ffffff',
    bg: 'rgba(255,255,255,0.08)',
    description: 'Post clips to your X account',
    plans: ['pro', 'agency'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    bg: 'rgba(10,102,194,0.1)',
    description: 'Share professional clips on LinkedIn',
    plans: ['agency'],
  },
];

export default function SocialConnectionsPage() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [connections, setConnections] = useState<Record<string, any>>({});
  const [userPlan, setUserPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showCsm, setShowCsm] = useState(false);
  const [showUsernameInput, setShowUsernameInput] = useState<string | null>(null);
  const [usernameValue, setUsernameValue] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single();

      setUserPlan(profile?.plan || 'free');

      const res = await fetch('/api/social/setup', { credentials: 'include' });
      const data = await res.json();

      const map: Record<string, any> = {};
      (data.connections || []).forEach((c: any) => { map[c.platform] = c; });
      setConnections(map);
      setLoading(false);
    };

    load();
  }, []);

  const handleConnect = (platformId: string) => {
    setShowUsernameInput(platformId);
    setUsernameValue('');
  };

  const confirmConnect = async (platformId: string) => {
    if (!usernameValue.trim()) return;
    setConnecting(platformId);
    try {
      const res = await fetch('/api/social/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ platform: platformId, username: usernameValue.trim() }),
      });
      if (res.ok) {
        setConnections(prev => ({
          ...prev,
          [platformId]: { platform: platformId, username: usernameValue.trim(), connected: true },
        }));
        setShowUsernameInput(null);
        setUsernameValue('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      await fetch('/api/social/setup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ platform: platformId }),
      });
      setConnections(prev => {
        const updated = { ...prev };
        delete updated[platformId];
        return updated;
      });
    } catch (e) {
      console.error(e);
    }
  };

  const connectedCount = Object.values(connections).filter(c => c.connected).length;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px' }}>
        {/* Coming-soon banner */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px 18px', borderRadius: radius.lg, background: colors.primary + '10', border: '1px solid ' + colors.primary + '25', marginBottom: '24px' }}>
          <Icon name="schedule" size={20} style={{ color: colors.primary, flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: colors.onSurface, marginBottom: '3px' }}>Social scheduling is coming soon</p>
            <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, lineHeight: 1.6 }}>
              Platform connections go live with the scheduling feature. In the meantime, download your clips and post directly. It takes seconds.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px' }}>
              Social media accounts
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              {connectedCount > 0
                ? `${connectedCount} account${connectedCount > 1 ? 's' : ''} connected`
                : 'Connect accounts to schedule and publish clips'}
            </p>
          </div>
          {connectedCount > 0 && (
            <Link href="/calendar" style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', borderRadius: '8px', color: '#ffffff', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
              View Calendar →
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{ color: '#a78bfa', textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PLATFORMS.map(platform => {
              const isConnected = !!connections[platform.id]?.connected;
              const connection = connections[platform.id];
              const isAvailable = platform.plans.includes(userPlan);
              const isConnecting = connecting === platform.id;
              const showInput = showUsernameInput === platform.id;

              return (
                <div key={platform.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', background: isConnected ? platform.bg : 'rgba(255,255,255,0.04)', border: '1px solid', borderColor: isConnected ? platform.color + '40' : 'rgba(255,255,255,0.08)', borderRadius: showInput ? '12px 12px 0 0' : '12px', opacity: isAvailable ? 1 : 0.5 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: platform.id === 'twitter' ? '#000000' : platform.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                      {platform.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '2px' }}>{platform.name}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                        {isConnected ? `Connected as @${connection.username}` : platform.description}
                      </div>
                    </div>
                    {!isAvailable ? (
                      <button onClick={() => setShowUpgrade(true)} style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        🔒 {platform.plans[0] === 'agency' ? 'Agency' : platform.plans[0] === 'pro' ? 'Pro+' : 'Starter+'}
                      </button>
                    ) : isConnected ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', fontSize: '12px', fontWeight: 600 }}>Connected</span>
                        <button onClick={() => handleDisconnect(platform.id)} style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '12px', cursor: 'pointer' }}>Disconnect</button>
                      </div>
                    ) : (
                      <button onClick={() => setShowCsm(true)} disabled={isConnecting} style={{ padding: '8px 18px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', border: 'none', color: '#ffffff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        {isConnecting ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>

                  {showInput && (
                    <div style={{ padding: '14px 18px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderTop: 'none', borderRadius: '0 0 12px 12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={usernameValue}
                        onChange={e => setUsernameValue(e.target.value)}
                        placeholder={`Enter your ${platform.name} username`}
                        onKeyDown={e => { if (e.key === 'Enter') confirmConnect(platform.id); }}
                        autoFocus
                        style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#ffffff', fontSize: '13px', outline: 'none' }}
                      />
                      <button onClick={() => confirmConnect(platform.id)} style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', border: 'none', borderRadius: '8px', color: '#ffffff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                      <button onClick={() => { setShowUsernameInput(null); setUsernameValue(''); }} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: '24px', padding: '14px 16px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#a78bfa', marginBottom: '6px' }}>How scheduling works</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            Connect your accounts above then go to your Clips page to schedule any clip directly to TikTok, Instagram Reels, or YouTube Shorts. VangelClip uses Make.com to handle all platform publishing automatically.
          </div>
        </div>
      </div>
      <ComingSoonModal isOpen={showCsm} onClose={() => setShowCsm(false)} />
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </DashboardLayout>
  );
}
