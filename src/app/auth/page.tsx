'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { clearClipStorage } from '@/lib/clearClipStorage';
import Icon from '@/components/Icon';
import { colors, gradients, radius, inputField } from '@/lib/tokens';

declare global {
  interface Window {
    turnstile: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset:  (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

const supabase = createClient();
const TURNSTILE_SITE_KEY = '0x4AAAAAAER6mHi3zRsSLwKp';

type View = 'signin' | 'signup' | 'forgot' | 'forgot_sent';

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>(
    () => searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [name,          setName]          = useState('');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [captchaToken,  setCaptchaToken]  = useState('');
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef  = useRef<string>('');

  // Show error if OAuth callback redirected back with ?error=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      setError('Google sign-in failed. Please try again or use email/password.');
    }
  }, []);

  // Load Turnstile script once
  useEffect(() => {
    if (document.getElementById('cf-turnstile-script')) return;
    const s = document.createElement('script');
    s.id    = 'cf-turnstile-script';
    s.src   = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }, []);

  // Render / re-render widget on every view change that has a form
  useEffect(() => {
    if (view === 'forgot_sent') return;
    setCaptchaToken('');

    const renderWidget = () => {
      if (!turnstileRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
      }
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey:            TURNSTILE_SITE_KEY,
        theme:              'light',
        callback:           (token: string) => setCaptchaToken(token),
        'expired-callback': ()              => setCaptchaToken(''),
        'error-callback':   ()              => setCaptchaToken(''),
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const script = document.getElementById('cf-turnstile-script');
      if (script) {
        script.addEventListener('load', renderWidget);
        return () => script.removeEventListener('load', renderWidget);
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = '';
      }
    };
  }, [view]);

  const resetCaptcha = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
    setCaptchaToken('');
  };

  const getStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const str      = getStrength(password);
  const strLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][str] || '';
  const strColor = ['', '#ef4444', '#fbbf24', '#89CEFF', '#4ade80'][str] || '';

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email:    email.trim().toLowerCase(),
        password,
        options:  { captchaToken },
      });

      if (error) {
        if (error.message.includes('Email not confirmed') || error.message.includes('not confirmed')) {
          setError(
            'Your email is not confirmed. ' +
            'Please contact support at adminvangelclip@gmail.com to activate your account manually.'
          );
        } else if (
          error.message.includes('Invalid login') ||
          error.message.includes('invalid credentials') ||
          error.message.includes('Invalid credentials')
        ) {
          setError('Wrong email or password. Please try again.');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.session) {
        clearClipStorage();
        router.push('/dashboard');
        return;
      }

      setError('Sign in failed. Please try again.');

    } catch (err: any) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setLoading(false);
      resetCaptcha();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError('Please accept the Terms of Service to create an account.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email:    email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: 'https://vangelclip.app/auth',
          captchaToken,
          data: { full_name: name || '' },
        },
      });

      if (error) {
        if (
          error.message.includes('already registered') ||
          error.message.includes('already exists') ||
          error.message.includes('User already')
        ) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data.session) {
        await supabase.auth.setSession(data.session);
        clearClipStorage();
        router.push('/dashboard');
        return;
      }

      if (data.user) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email:    email.trim().toLowerCase(),
          password,
        });

        if (signInData.session) {
          clearClipStorage();
          router.push('/dashboard');
          return;
        }

        if (signInError) {
          setSuccess(
            `Account created! We've sent a confirmation link to ${email.trim().toLowerCase()}. ` +
            `Check your inbox (and spam folder), click the link, then sign in.`
          );
          return;
        }
      }

      router.push('/dashboard');

    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
      resetCaptcha();
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:   `${window.location.origin}/auth/reset-password`,
        captchaToken,
      });
      if (err) {
        setError(err.message);
        return;
      }
      setView('forgot_sent');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link.');
    } finally {
      setLoading(false);
      resetCaptcha();
    }
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
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (err) setError(err.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    ...inputField,
    width:      '100%',
    boxSizing:  'border-box' as const,
    background: '#F5F3EF',
    color:      '#1A1714',
    border:     '1px solid rgba(0,0,0,0.12)',
  };

  const pageBg: React.CSSProperties = {
    position:       'relative',
    minHeight:      '100vh',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontFamily:     "'Inter',sans-serif",
  };

  // ── Forgot Password Sent ──────────────────────────────────────────────────────
  if (view === 'forgot_sent') return (
    <main style={pageBg}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/auth-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(228,226,221,0.45)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, margin: '24px', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(124,58,237,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Icon name="lock_reset" size={36} style={{ color: '#7C3AED' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, color: '#1A1714' }}>Reset link sent</h2>
        <p style={{ color: '#6B6560', fontSize: 14, marginBottom: 8, lineHeight: 1.7 }}>We sent a password reset link to</p>
        <p style={{ color: '#1A1714', fontWeight: 700, fontSize: 15, marginBottom: 24 }}>{email}</p>
        <p style={{ color: '#6B6560', fontSize: 13, marginBottom: 32, lineHeight: 1.6 }}>
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
    <main style={pageBg}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/auth-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(228,226,221,0.45)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, margin: '24px', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', borderRadius: 16, padding: 40 }}>
        <div style={{ marginBottom: 28 }}>
          <span onClick={() => router.push('/')} style={{ fontSize: 22, fontWeight: 900, color: '#1A1714', cursor: 'pointer', fontFamily: 'Arial Black, Arial, sans-serif' }}>Vangel<span style={{ color: '#7C3AED' }}>Clip</span></span>
        </div>
        <button
          onClick={() => setView('signin')}
          style={{ background: 'none', border: 'none', color: '#6B6560', cursor: 'pointer', fontSize: 13, fontFamily: "'Inter',sans-serif", marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
        >
          ← Back to Sign In
        </button>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: '#1A1714' }}>Reset your password</h2>
        <p style={{ color: '#6B6560', fontSize: 14, marginBottom: 32 }}>
          Enter your email and we will send you a reset link.
        </p>
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: radius.md, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B6560', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
          </div>
          <div ref={turnstileRef} style={{ marginTop: 4 }} />
          <button
            type="submit"
            disabled={loading || !captchaToken}
            style={{ background: gradients.primary, color: '#FAF7FF', fontWeight: 700, padding: 14, borderRadius: radius.md, border: 'none', cursor: (loading || !captchaToken) ? 'not-allowed' : 'pointer', fontSize: 14, opacity: (loading || !captchaToken) ? 0.5 : 1, fontFamily: "'Inter',sans-serif" }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </main>
  );

  // ── Sign In / Sign Up ─────────────────────────────────────────────────────────
  const isSignUp = view === 'signup';

  return (
    <main style={pageBg}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/auth-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(228,226,221,0.45)', backdropFilter: 'blur(4px)' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, margin: '24px', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)', borderRadius: 16, padding: 40 }}>

        {/* Logo */}
        <div style={{ marginBottom: 28 }}>
          <span onClick={() => router.push('/')} style={{ fontSize: 22, fontWeight: 900, color: '#1A1714', cursor: 'pointer', fontFamily: 'Arial Black, Arial, sans-serif' }}>Vangel<span style={{ color: '#7C3AED' }}>Clip</span></span>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#1A1714' }}>
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h2>
        <p style={{ color: '#6B6560', fontSize: 14, marginBottom: 28 }}>
          {isSignUp ? 'Start creating viral clips. Free minutes on signup.' : 'Sign in to your studio.'}
        </p>

        {/* Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '12px 16px', borderRadius: radius.md, background: '#fff',
            border: '1px solid rgba(0,0,0,0.15)', color: '#1A1714', fontWeight: 600, fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 20,
            fontFamily: "'Inter',sans-serif", transition: 'background 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
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
          <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.12)' }} />
          <span style={{ fontSize: 12, color: '#6B6560' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.12)' }} />
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', color: '#dc2626', fontSize: '14px', marginBottom: '16px', lineHeight: 1.5 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '12px 16px', color: '#059669', fontSize: '14px', marginBottom: '16px', lineHeight: 1.5 }}>
            {success}
          </div>
        )}

        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isSignUp && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B6560', display: 'block', marginBottom: 6 }}>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required style={inputStyle} />
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6B6560', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B6560' }}>Password</label>
              {!isSignUp && (
                <button type="button" onClick={() => { setError(''); setView('forgot'); }} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif", padding: 0 }}>
                  Forgot password?
                </button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={isSignUp ? 'Min 8 chars, uppercase, number, symbol' : 'Your password'} required style={{ ...inputStyle, paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B6560', fontSize: 18, padding: 0, display: 'flex', alignItems: 'center' }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {isSignUp && password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= str ? strColor : '#EFECEA' }} />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: strColor, fontWeight: 600 }}>
                  {strLabel}{str < 3 ? ' — add uppercase, numbers, or symbols' : ''}
                </p>
              </div>
            )}
          </div>
          {isSignUp && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginTop: 4 }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                style={{ marginTop: 2, accentColor: '#9B5DE5', width: 15, height: 15, flexShrink: 0, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 12, color: '#6B6560', lineHeight: 1.6 }}>
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#7C3AED', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>
                {' '}and confirm I own or have the rights to any content I upload.
              </span>
            </label>
          )}

          {/* Turnstile widget */}
          <div ref={turnstileRef} style={{ marginTop: 4 }} />

          <button
            type="submit"
            disabled={loading || !captchaToken || (isSignUp && !termsAccepted)}
            style={{
              background:  gradients.primary,
              color:       '#FAF7FF',
              fontWeight:  700,
              padding:     14,
              borderRadius: radius.md,
              border:      'none',
              cursor:      (loading || !captchaToken || (isSignUp && !termsAccepted)) ? 'not-allowed' : 'pointer',
              fontSize:    14,
              opacity:     (loading || !captchaToken || (isSignUp && !termsAccepted)) ? 0.5 : 1,
              marginTop:   4,
              fontFamily:  "'Inter',sans-serif",
            }}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#6B6560', marginTop: 24 }}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => { setError(''); setTermsAccepted(false); setView(isSignUp ? 'signin' : 'signup'); }}
            style={{ background: 'none', border: 'none', color: '#7C3AED', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: "'Inter',sans-serif" }}
          >
            {isSignUp ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#050010' }} />}>
      <AuthPageInner />
    </Suspense>
  );
}
