'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Icon from '@/components/Icon';
import { colors, gradients, radius, inputField } from '@/lib/tokens';

const supabase = createClient();

type View = 'signin' | 'signup' | 'verify' | 'forgot' | 'forgot_sent';

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Show error if the OAuth callback redirected back with ?error=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      setError('Google sign-in failed. Please try again or use email/password.');
    }
  }, []);

  const getStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const str = getStrength(password);
  const strLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][str] || '';
  const strColor = ['', '#ef4444', '#fbbf24', '#89CEFF', '#4ade80'][str] || '';

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (err) {
        if (err.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account first.');
        } else if (err.message.includes('Invalid login credentials')) {
          setError('Incorrect email or password. Please try again.');
        } else {
          setError(err.message);
        }
        return;
      }

      if (data?.user) {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          data: { full_name: name || '' },
        },
      });

      if (err) {
        setError(err.message);
        return;
      }

      if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists. Please sign in instead.');
        return;
      }

      // Create profile row for new users
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email.trim(),
          full_name: name,
          plan: 'free',
          credits: 720,
          created_at: new Date().toISOString(),
        });
      }

      setSuccess('Account created! Check your email to confirm your account before signing in.');
      setView('verify');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    setView('forgot_sent');
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    await supabase.auth.resend({ type: 'signup', email });
    setResendLoading(false);
    setResendDone(true);
  };

  // SUPABASE DASHBOARD SETUP REQUIRED:
  // 1. Authentication → URL Configuration → Site URL:
  //    https://contentclip-app-w2hf.vercel.app
  // 2. Authentication → URL Configuration → Redirect URLs — add ALL:
  //    http://localhost:3000/api/auth/callback
  //    https://contentclip-app-w2hf.vercel.app/api/auth/callback
  //    https://*.vercel.app/api/auth/callback
  // 3. Authentication → Providers → Google → ENABLED with valid Client ID & Secret
  //    - Go to console.cloud.google.com → create OAuth 2.0 credentials
  //    - Add authorised redirect URI: https://[project-ref].supabase.co/auth/v1/callback
  //    - Copy Client ID and Secret to Supabase
  // 4. Authentication → Settings → Email confirmations:
  //    Turn OFF for testing (turn back ON before going live)
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (err) {
        setError(err.message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    ...inputField,
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  // ── Verify Email Screen ──────────────────────────────────────────────────────
  if (view === 'verify') return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.background, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: 420, padding: 40 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Icon name="mark_email_read" size={40} style={{ color: '#4ade80' }} />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10, color: colors.onSurface }}>Check your email</h2>
        <p style={{ color: colors.onSurfaceVariant, fontSize: 14, marginBottom: 8, lineHeight: 1.7 }}>
          We sent a verification link to
        </p>
        <p style={{ color: colors.onSurface, fontWeight: 700, fontSize: 15, marginBottom: 24 }}>{email}</p>
        <p style={{ color: colors.onSurfaceVariant, fontSize: 13, marginBottom: 32, lineHeight: 1.6 }}>
          Click the link in the email to activate your account and access your dashboard. Check your spam folder if you do not see it.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={handleResendVerification}
            disabled={resendLoading || resendDone}
            style={{ background: resendDone ? 'rgba(74,222,128,0.1)' : colors.surfaceContainerHigh, border: `1px solid ${resendDone ? '#4ade80' : colors.outlineVariant}`, color: resendDone ? '#4ade80' : colors.onSurface, fontWeight: 600, padding: 12, borderRadius: radius.md, cursor: resendDone ? 'default' : 'pointer', fontSize: 14, fontFamily: "'Inter',sans-serif" }}
          >
            {resendDone ? '✓ Verification email resent!' : resendLoading ? 'Sending...' : 'Resend verification email'}
          </button>
          <button
            onClick={() => setView('signin')}
            style={{ background: 'none', border: 'none', color: colors.primary, fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: "'Inter',sans-serif", padding: 8 }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </main>
  );

  // ── Forgot Password Sent Screen ───────────────────────────────────────────────
  if (view === 'forgot_sent') return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.background, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: 420, padding: 40 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(192,193,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Icon name="lock_reset" size={40} style={{ color: colors.primary }} />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10, color: colors.onSurface }}>Reset link sent</h2>
        <p style={{ color: colors.onSurfaceVariant, fontSize: 14, marginBottom: 8, lineHeight: 1.7 }}>We sent a password reset link to</p>
        <p style={{ color: colors.onSurface, fontWeight: 700, fontSize: 15, marginBottom: 24 }}>{email}</p>
        <p style={{ color: colors.onSurfaceVariant, fontSize: 13, marginBottom: 32, lineHeight: 1.6 }}>
          Click the link in the email to set a new password. The link expires in 1 hour.
        </p>
        <button
          onClick={() => setView('signin')}
          style={{ background: gradients.primary, border: 'none', color: '#FAF7FF', fontWeight: 700, padding: 14, borderRadius: radius.md, cursor: 'pointer', fontSize: 14, fontFamily: "'Inter',sans-serif", width: '100%' }}
        >
          Back to Sign In
        </button>
      </div>
    </main>
  );

  // ── Forgot Password Form ──────────────────────────────────────────────────────
  if (view === 'forgot') return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.background, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <button
          onClick={() => setView('signin')}
          style={{ background: 'none', border: 'none', color: colors.onSurfaceVariant, cursor: 'pointer', fontSize: 13, fontFamily: "'Inter',sans-serif", marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
        >
          ← Back to Sign In
        </button>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: colors.onSurface }}>Reset your password</h2>
        <p style={{ color: colors.onSurfaceVariant, fontSize: 14, marginBottom: 32 }}>
          Enter your email and we will send you a reset link.
        </p>
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: radius.md, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
          </div>
          <button type="submit" disabled={loading} style={{ background: gradients.primary, color: '#FAF7FF', fontWeight: 700, padding: 14, borderRadius: radius.md, border: 'none', cursor: 'pointer', fontSize: 14, opacity: loading ? 0.7 : 1, fontFamily: "'Inter',sans-serif" }}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </main>
  );

  // ── Sign In / Sign Up ─────────────────────────────────────────────────────────
  const isSignUp = view === 'signup';

  return (
    <main style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter',sans-serif" }}>
      {/* Left panel */}
      <section className="auth-left" style={{ position: 'relative', flex: '0 0 55%', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 48, background: `linear-gradient(135deg,${colors.background},${colors.surfaceContainer},#430076)` }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(at 0% 0%,#9c48ea 0px,transparent 50%),radial-gradient(at 100% 0%,#17a8ec 0px,transparent 50%),radial-gradient(at 100% 100%,#cc97ff 0px,transparent 50%)', filter: 'blur(80px)', opacity: 0.4 }} />
        <div style={{ position: 'relative', zIndex: 10 }}>
          <h1 onClick={() => router.push('/')} style={{ fontSize: 24, fontWeight: 900, cursor: 'pointer', color: colors.onSurface }}>VangelClip</h1>
        </div>
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 520 }}>
          <Icon name="format_quote" filled size={40} style={{ color: colors.primary, marginBottom: 24 }} />
          <blockquote style={{ fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 32, color: colors.onSurface }}>
            VangelClip turned my ministry reach from weeks to minutes.
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: gradients.cta, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#000' }}>A</div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: colors.onSurface }}>Alex Nguyen</p>
              <p style={{ fontSize: 12, color: colors.onSurfaceVariant }}>Creator · 2.1M followers</p>
            </div>
          </div>
        </div>
        <div />
      </section>

      {/* Right panel */}
      <section className="auth-right" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', background: colors.background }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: colors.onSurface }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ color: colors.onSurfaceVariant, fontSize: 14, marginBottom: 32 }}>
            {isSignUp ? 'Start creating viral clips. 720 free credits on signup.' : 'Sign in to your studio.'}
          </p>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: radius.md,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: 20,
              fontFamily: "'Inter',sans-serif",
              transition: 'background 0.2s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Connecting...' : 'Continue with Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: colors.outlineVariant }} />
            <span style={{ fontSize: 12, color: colors.onSurfaceVariant }}>or</span>
            <div style={{ flex: 1, height: 1, background: colors.outlineVariant }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#fca5a5',
              fontSize: '14px',
              marginBottom: '16px',
              lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#6ee7b7',
              fontSize: '14px',
              marginBottom: '16px',
              lineHeight: 1.5,
            }}>
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isSignUp && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: 6 }}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required style={inputStyle} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant }}>Password</label>
                {!isSignUp && (
                  <button type="button" onClick={() => { setError(''); setView('forgot'); }} style={{ background: 'none', border: 'none', color: colors.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif", padding: 0 }}>
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={isSignUp ? 'Min 8 chars, uppercase, number, symbol' : 'Your password'} required style={{ ...inputStyle, paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: colors.onSurfaceVariant, fontSize: 18, padding: 0, display: 'flex', alignItems: 'center' }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
              {isSignUp && password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= str ? strColor : colors.surfaceContainerHigh }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: strColor, fontWeight: 600 }}>
                    {strLabel}{str < 3 ? ' — add uppercase, numbers, or symbols' : ''}
                  </p>
                </div>
              )}
            </div>
            <button type="submit" disabled={loading} style={{ background: gradients.primary, color: '#FAF7FF', fontWeight: 700, padding: 14, borderRadius: radius.md, border: 'none', cursor: loading ? 'wait' : 'pointer', fontSize: 14, opacity: loading ? 0.7 : 1, marginTop: 8, fontFamily: "'Inter',sans-serif" }}>
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: colors.onSurfaceVariant, marginTop: 24 }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => { setError(''); setView(isSignUp ? 'signin' : 'signup'); }} style={{ background: 'none', border: 'none', color: colors.primary, fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
              {isSignUp ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </section>
      <style>{'@media(max-width:768px){.auth-left{display:none!important}}'}</style>
    </main>
  );
}
