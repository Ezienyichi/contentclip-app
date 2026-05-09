'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { colors, gradients, radius, shadows } from '@/lib/tokens';
const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'Creator · 1.2M followers', text: 'VangelClip cut my editing time from 8 hours to 20 minutes.', avatar: 'S' },
  { name: 'Marcus Johnson', role: 'Podcast Host · Top 50', text: 'I paste my episode link and get 10 viral clips back.', avatar: 'M' },
  { name: 'Priya Sharma', role: 'Agency · 40+ clients', text: 'Handles what used to take a 5-person team.', avatar: 'P' },
];
export default function LandingPage() {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [muted, setMuted] = React.useState(true);
  const [iframeKey, setIframeKey] = React.useState(0);
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div style={{ background: colors.background, color: colors.onSurface, fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(14,14,14,0.8)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
        <div style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', fontFamily: 'Arial Black, Arial, sans-serif' }}>Vangel<span style={{ color: '#7C3AED' }}>Clip</span></span>
        </div>
        <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '32px', fontSize: '14px', fontWeight: 500 }}>
          <a href="#features" style={{ color: colors.onSurfaceVariant, textDecoration: 'none' }}>Features</a>
          <a href="#workflow" style={{ color: colors.onSurfaceVariant, textDecoration: 'none' }}>Workflow</a>
          <a href="#pricing" style={{ color: colors.onSurfaceVariant, textDecoration: 'none' }}>Pricing</a>
          <a href="/about" style={{ color: colors.onSurfaceVariant, textDecoration: 'none' }}>About</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/auth')} className="nav-signin" style={{ background: 'none', border: 'none', color: colors.onSurfaceVariant, fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Sign In</button>
          <button onClick={() => router.push('/auth')} className="nav-cta" style={{ background: '#fff', color: '#000', fontSize: '13px', fontWeight: 700, padding: '8px 18px', borderRadius: radius.md, border: 'none', cursor: 'pointer' }}>Start Free</button>
          <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>
      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
        <a href="#workflow" onClick={() => setMenuOpen(false)}>Workflow</a>
        <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
        <a href="/about" onClick={() => setMenuOpen(false)}>About</a>
        <button onClick={() => { setMenuOpen(false); router.push('/auth'); }}>Sign In</button>
        <button onClick={() => { setMenuOpen(false); router.push('/auth'); }} style={{ background: gradients.primary, color: '#FAF7FF' }}>Start Free</button>
      </div>

      {/* HERO — video bg, overflow hidden, dark fallback */}
      <section className="hero-section-wrap" style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: '#0a0014' }}>
        {/* YouTube background — contained inside section via overflow:hidden */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '177.78vh', minWidth: '100%', height: '56.25vw', minHeight: '100%', zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <iframe
            key={iframeKey}
            src={`https://www.youtube.com/embed/ifIR8cdrbkY?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=ifIR8cdrbkY&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1`}
            style={{ position: 'absolute', top: '-80px', left: 0, width: '100%', height: 'calc(100% + 160px)', border: 'none', pointerEvents: 'none' }}
            allow="autoplay; encrypted-media"
            title="Hero background video"
          />
          {/* Cover strip — hides YouTube title bar at top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80px', background: '#0a0014', zIndex: 2, pointerEvents: 'none' }} />
          {/* Cover strip — hides YouTube bar at bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: '#0a0014', zIndex: 2, pointerEvents: 'none' }} />
        </div>
        {/* Overlay — stronger on mobile via CSS class */}
        <div className="hero-overlay" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
        {/* Purple glow bottom-left */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '50%', height: '300px', background: 'radial-gradient(ellipse at left bottom, rgba(124,58,237,0.25) 0%, transparent 70%)', zIndex: 1 }} />
        {/* Hero text content */}
        <div className="hero-content" style={{ position: 'relative', zIndex: 2 }}>
          <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: radius.full, background: colors.surfaceContainerHighest, border: '1px solid ' + colors.outlineVariant, color: colors.primary, fontSize: 12, fontWeight: 600, marginBottom: 32 }}>
            <Icon name="verified" size={14} /> New: AI Reframe for Shorts
          </div>
          <h1 className="hero-headline">
            Your Message. <span style={{ color: colors.primary }}>One Clip</span> at a Time.
          </h1>
          <p className="hero-subheadline">VangelClip uses AI to turn your sermons, songs, teachings, and talks into viral short clips for TikTok, Reels, and YouTube Shorts. Gospel. Education. Inspiration. Built for African creators. Made for the world.</p>
          <p className="hero-tags">Gospel &middot; Education &middot; Inspiration &middot; African-First &middot; World-Class</p>
          <div className="hero-buttons">
            <button onClick={() => router.push('/auth')} style={{ background: gradients.primary, color: '#FAF7FF', fontWeight: 700, padding: '16px 32px', borderRadius: radius.xl, border: 'none', cursor: 'pointer', fontSize: 15, boxShadow: shadows.glowStrong, fontFamily: "'Inter', sans-serif" }}>Start Clipping Free</button>
            <button onClick={() => setShowDemo(true)} style={{ background: colors.surfaceContainer, color: colors.onSurface, border: '1px solid ' + colors.outlineVariant, fontWeight: 700, padding: '16px 32px', borderRadius: radius.xl, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Inter', sans-serif" }}><Icon name="play_circle" filled size={20} /> View Demo</button>
          </div>
          <div className="stats-grid">
            {[{ v: '50K+', l: 'Creators' }, { v: '2M+', l: 'Clips' }, { v: '8.2B', l: 'Views' }, { v: '94%', l: 'Satisfaction' }].map(s => (
              <div key={s.l}><p style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{s.v}</p><p style={{ fontSize: 12, color: colors.onSurfaceVariant }}>{s.l}</p></div>
            ))}
          </div>
        </div>
        {/* Mute toggle */}
        <button
          onClick={() => { setMuted(m => !m); setIframeKey(k => k + 1); }}
          style={{ position: 'absolute', bottom: '32px', right: '32px', zIndex: 10, background: 'rgba(124,58,237,0.4)', border: '1px solid rgba(124,58,237,0.6)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ffffff', fontSize: '18px', backdropFilter: 'blur(8px)', transition: 'background 0.2s' }}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </section>

      {/* SOCIAL PROOF */}
      <section className="deco-section" style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
        {/* Left edge — vertical film strip */}
        <div className="deco-corner" style={{ top: 0, left: 0, height: '100%', width: '40px' }}>
          <svg width="40" height="100%" viewBox="0 0 40 120" preserveAspectRatio="xMidYMid slice" fill="none">
            <rect x="2" y="0" width="36" height="120" rx="0" fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth="0.5"/>
            <rect x="6" y="8" width="28" height="18" rx="2" fill="rgba(124,58,237,0.08)"/>
            <rect x="6" y="34" width="28" height="18" rx="2" fill="rgba(124,58,237,0.08)"/>
            <rect x="6" y="60" width="28" height="18" rx="2" fill="rgba(124,58,237,0.08)"/>
            <rect x="6" y="86" width="28" height="18" rx="2" fill="rgba(124,58,237,0.08)"/>
          </svg>
        </div>
        {/* Right edge — vertical film strip */}
        <div className="deco-corner" style={{ top: 0, right: 0, height: '100%', width: '40px' }}>
          <svg width="40" height="100%" viewBox="0 0 40 120" preserveAspectRatio="xMidYMid slice" fill="none">
            <rect x="2" y="0" width="36" height="120" rx="0" fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth="0.5"/>
            <rect x="6" y="8" width="28" height="18" rx="2" fill="rgba(6,182,212,0.08)"/>
            <rect x="6" y="34" width="28" height="18" rx="2" fill="rgba(6,182,212,0.08)"/>
            <rect x="6" y="60" width="28" height="18" rx="2" fill="rgba(6,182,212,0.08)"/>
            <rect x="6" y="86" width="28" height="18" rx="2" fill="rgba(6,182,212,0.08)"/>
          </svg>
        </div>
        <p style={{ fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>Used by creators across Africa</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          {['Preach It','DSTV','TBN Africa','Spotify','YouTube'].map(l => <span key={l} style={{ fontSize: 20, fontWeight: 800, color: '#ffffff' }}>{l}</span>)}
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="deco-section" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px', borderTop: '1px solid rgba(70,69,85,0.1)' }}>
        {/* Left film strip */}
        <div className="deco-corner" style={{ top: 0, left: 0, width: '40px', height: '100%' }}>
          <svg width="40" height="100%" viewBox="0 0 40 600" preserveAspectRatio="xMidYMin slice" fill="none">
            <rect x="2" y="0" width="36" height="600" fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth="0.5"/>
            {[0,1,2,3,4,5,6,7,8,9,10].map(i => <rect key={i} x="6" y={8+i*54} width="28" height="38" rx="3" fill="rgba(124,58,237,0.07)"/>)}
          </svg>
        </div>
        {/* Right film strip */}
        <div className="deco-corner" style={{ top: 0, right: 0, width: '40px', height: '100%' }}>
          <svg width="40" height="100%" viewBox="0 0 40 600" preserveAspectRatio="xMidYMin slice" fill="none">
            <rect x="2" y="0" width="36" height="600" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="0.5"/>
            {[0,1,2,3,4,5,6,7,8,9,10].map(i => <rect key={i} x="6" y={8+i*54} width="28" height="38" rx="3" fill="rgba(6,182,212,0.07)"/>)}
          </svg>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 'clamp(28px,5vw,36px)', fontWeight: 800, marginBottom: 12 }}>How VangelClip Works</h2>
          <p style={{ color: colors.onSurfaceVariant }}>From long-form video to viral clips in 6 simple steps.</p>
        </div>
        <div className="workflow-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {[
            { icon: 'link', n: '01', t: 'Paste a Link', d: 'Drop any YouTube, Vimeo, or TikTok URL. No uploading, no storage costs. Just the link.', c: colors.primary },
            { icon: 'auto_awesome', n: '02', t: 'AI Analyses Video', d: 'Our AI transcribes your video, detects viral hooks, and scores every moment for impact.', c: colors.tertiary },
            { icon: 'movie_edit', n: '03', t: 'Review Your Clips', d: 'Get back 5–15 AI-generated clips ranked by virality score. Preview each one instantly.', c: '#06b6d4' },
            { icon: 'tune', n: '04', t: 'Edit & Customise', d: 'Adjust captions, add your logo, reframe to 9:16, apply colour grading and transitions.', c: '#fbbf24' },
            { icon: 'dashboard', n: '05', t: 'Choose a Template', d: 'Pick from 20 proven clip formats — Gospel, Podcast, Motivation, Education, and more.', c: '#ff97b5' },
            { icon: 'rocket_launch', n: '06', t: 'Schedule & Publish', d: 'Schedule clips to TikTok, Reels, and Shorts from one calendar. Track performance in-app.', c: '#4ade80' },
          ].map(s => (
            <div key={s.n} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: 28, position: 'relative', overflow: 'hidden' }}>
              <span style={{ position: 'absolute', top: 12, right: 16, fontSize: 56, fontWeight: 900, color: 'rgba(255,255,255,0.03)' }}>{s.n}</span>
              <div style={{ width: 48, height: 48, borderRadius: radius.lg, background: s.c+'10', border: '1px solid '+s.c+'20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><Icon name={s.icon} size={22} style={{ color: s.c }} /></div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{s.t}</h3>
              <p style={{ color: colors.onSurfaceVariant, fontSize: 13, lineHeight: 1.7 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(28px,5vw,36px)', fontWeight: 800, marginBottom: 12 }}>Everything You Need to Go Viral</h2>
        </div>
        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[
            { i: 'auto_awesome_motion', c: colors.primary, t: 'AI Hook Detection', d: 'Claude AI finds scroll-stopping moments with 94% accuracy.', s: '94% accuracy' },
            { i: 'closed_caption', c: colors.tertiary, t: 'Animated Captions', d: 'Word-by-word animation. +40% watch time.', s: '+40% watch time' },
            { i: 'aspect_ratio', c: colors.secondary, t: '9:16 Reframe', d: 'Speaker-tracking keeps faces centered for vertical.', s: 'Auto reframe' },
            { i: 'schedule_send', c: '#ff97b5', t: 'Multi-Platform Publish', d: 'Schedule to Shorts, TikTok, and Reels from one place.', s: '3 platforms' },
            { i: 'tune', c: '#fbbf24', t: 'Pro Adjustments', d: 'Color, brightness, contrast, stabilization, noise reduction.', s: '20+ tools' },
            { i: 'translate', c: '#4ade80', t: 'Multi-Language', d: 'Transcribe and caption in 50+ languages.', s: '50+ languages' },
          ].map(f => (
            <div key={f.t} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: 36 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: radius.lg, background: f.c+'10', border: '1px solid '+f.c+'20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={f.i} size={24} style={{ color: f.c }} /></div>
                <span style={{ fontSize: 11, fontWeight: 700, color: f.c, background: f.c+'10', padding: '4px 10px', borderRadius: radius.full }}>{f.s}</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{f.t}</h3>
              <p style={{ color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 1.7 }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CREATOR HIGHLIGHTS */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px', borderTop: '1px solid rgba(70,69,85,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(28px,5vw,36px)', fontWeight: 800, marginBottom: 12 }}>Creator Highlights</h2>
          <p style={{ color: colors.onSurfaceVariant }}>Gospel voices reaching millions across Africa and beyond.</p>
        </div>
        <div className="reel-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16 }}>
          {[
            { name: 'Pastor Emeka', location: 'Lagos, Nigeria', type: 'Sermon', flag: '🇳🇬', color: '#7c3aed' },
            { name: 'Sis Abena', location: 'Accra, Ghana', type: 'Worship', flag: '🇬🇭', color: '#ec4899' },
            { name: 'Dr. Amara', location: 'Nairobi, Kenya', type: 'Teaching', flag: '🇰🇪', color: '#06b6d4' },
            { name: 'Bro Tunde', location: 'Ibadan, Nigeria', type: 'Inspiration', flag: '🇳🇬', color: '#10b981' },
            { name: 'Mama Zola', location: 'Durban, S. Africa', type: 'Gospel Music', flag: '🇿🇦', color: '#ff6b35' },
          ].map(c => (
            <div key={c.name} className="reel-card" style={{ aspectRatio: '9/16', borderRadius: radius.xl, position: 'relative', overflow: 'hidden', cursor: 'pointer', background: 'linear-gradient(160deg, #0d0721 0%, #1a0a3a 60%, #0a0a1a 100%)', border: '1px solid ' + c.color + '30' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="play_arrow" size={24} style={{ color: '#fff' }} filled />
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 14px', background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.color, background: c.color + '20', padding: '3px 10px', borderRadius: radius.full, display: 'inline-block', marginBottom: 8 }}>{c.type}</div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{c.flag} {c.name}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{c.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="deco-section" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        {/* Central radial glow */}
        <div className="deco-corner" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '300px', background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Left film strip */}
        <div className="deco-corner" style={{ top: 0, left: 0, width: '36px', height: '100%' }}>
          <svg width="36" height="100%" viewBox="0 0 36 400" preserveAspectRatio="xMidYMin slice" fill="none">
            <rect x="2" y="0" width="32" height="400" fill="none" stroke="rgba(124,58,237,0.12)" strokeWidth="0.5"/>
            {[0,1,2,3,4,5,6].map(i => <rect key={i} x="5" y={8+i*54} width="26" height="36" rx="3" fill="rgba(124,58,237,0.06)"/>)}
          </svg>
        </div>
        {/* Right film strip */}
        <div className="deco-corner" style={{ top: 0, right: 0, width: '36px', height: '100%' }}>
          <svg width="36" height="100%" viewBox="0 0 36 400" preserveAspectRatio="xMidYMin slice" fill="none">
            <rect x="2" y="0" width="32" height="400" fill="none" stroke="rgba(236,72,153,0.12)" strokeWidth="0.5"/>
            {[0,1,2,3,4,5,6].map(i => <rect key={i} x="5" y={8+i*54} width="26" height="36" rx="3" fill="rgba(236,72,153,0.06)"/>)}
          </svg>
        </div>
        {/* Floating video frame top-left */}
        <div className="deco-corner" style={{ top: 20, left: 60, opacity: 0.4, pointerEvents: 'none' }}>
          <svg width="72" height="52" viewBox="0 0 72 52" fill="none"><rect x="1" y="1" width="70" height="50" rx="6" fill="rgba(124,58,237,0.08)" stroke="rgba(124,58,237,0.3)" strokeWidth="1"/><circle cx="36" cy="26" r="10" fill="none" stroke="rgba(124,58,237,0.25)" strokeWidth="1"/><polygon points="33,22 33,30 41,26" fill="rgba(124,58,237,0.3)"/></svg>
        </div>
        {/* Floating video frame top-right */}
        <div className="deco-corner" style={{ top: 20, right: 60, opacity: 0.4, pointerEvents: 'none' }}>
          <svg width="72" height="52" viewBox="0 0 72 52" fill="none"><rect x="1" y="1" width="70" height="50" rx="6" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.3)" strokeWidth="1"/><circle cx="36" cy="26" r="10" fill="none" stroke="rgba(6,182,212,0.25)" strokeWidth="1"/><polygon points="33,22 33,30 41,26" fill="rgba(6,182,212,0.3)"/></svg>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(28px,5vw,36px)', fontWeight: 800 }}>Loved by 50,000+ Creators</h2>
        </div>
        <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: 32 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>{[1,2,3,4,5].map(s => <Icon key={s} name="star" filled size={16} style={{ color: '#fbbf24' }} />)}</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>&ldquo;{t.text}&rdquo;</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: gradients.cta, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#000' }}>{t.avatar}</div>
                <div><p style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</p><p style={{ fontSize: 11, color: colors.onSurfaceVariant }}>{t.role}</p></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="deco-section" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        {/* Diagonal stripe background */}
        <div className="deco-corner" style={{ inset: 0, background: 'repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(124,58,237,0.02) 40px, rgba(124,58,237,0.02) 80px)', pointerEvents: 'none' }} />
        {/* Central radial glow */}
        <div className="deco-corner" style={{ top: '30%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Left film strip */}
        <div className="deco-corner" style={{ top: 0, left: 0, width: '36px', height: '100%' }}>
          <svg width="36" height="100%" viewBox="0 0 36 600" preserveAspectRatio="xMidYMin slice" fill="none">
            <rect x="2" y="0" width="32" height="600" fill="none" stroke="rgba(124,58,237,0.12)" strokeWidth="0.5"/>
            {[0,1,2,3,4,5,6,7,8,9].map(i => <rect key={i} x="5" y={8+i*60} width="26" height="40" rx="3" fill="rgba(124,58,237,0.05)"/>)}
          </svg>
        </div>
        {/* Right film strip */}
        <div className="deco-corner" style={{ top: 0, right: 0, width: '36px', height: '100%' }}>
          <svg width="36" height="100%" viewBox="0 0 36 600" preserveAspectRatio="xMidYMin slice" fill="none">
            <rect x="2" y="0" width="32" height="600" fill="none" stroke="rgba(6,182,212,0.12)" strokeWidth="0.5"/>
            {[0,1,2,3,4,5,6,7,8,9].map(i => <rect key={i} x="5" y={8+i*60} width="26" height="40" rx="3" fill="rgba(6,182,212,0.05)"/>)}
          </svg>
        </div>
        {/* Floating video frames */}
        <div className="deco-corner" style={{ top: 40, left: 56, opacity: 0.35, pointerEvents: 'none' }}>
          <svg width="64" height="46" viewBox="0 0 64 46" fill="none"><rect x="1" y="1" width="62" height="44" rx="5" fill="rgba(124,58,237,0.08)" stroke="rgba(124,58,237,0.25)" strokeWidth="1"/><circle cx="32" cy="23" r="9" fill="none" stroke="rgba(124,58,237,0.2)" strokeWidth="1"/><polygon points="29,19 29,27 37,23" fill="rgba(124,58,237,0.25)"/></svg>
        </div>
        <div className="deco-corner" style={{ top: 40, right: 56, opacity: 0.35, pointerEvents: 'none' }}>
          <svg width="64" height="46" viewBox="0 0 64 46" fill="none"><rect x="1" y="1" width="62" height="44" rx="5" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.25)" strokeWidth="1"/><circle cx="32" cy="23" r="9" fill="none" stroke="rgba(6,182,212,0.2)" strokeWidth="1"/><polygon points="29,19 29,27 37,23" fill="rgba(6,182,212,0.25)"/></svg>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(28px,5vw,36px)', fontWeight: 800, marginBottom: 12 }}>Simple, Transparent Pricing</h2>
          <p style={{ color: colors.onSurfaceVariant, marginBottom: 28 }}>Start free. Upgrade when you&apos;re ready.</p>
          <div style={{ display: 'inline-flex', background: colors.surfaceContainerHigh, borderRadius: radius.full, padding: 4 }}>
            <button onClick={() => setAnnual(false)} style={{ padding: '8px 20px', borderRadius: radius.full, border: 'none', cursor: 'pointer', background: !annual ? colors.primary : 'transparent', color: !annual ? '#000' : colors.onSurfaceVariant, fontWeight: 600, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>Monthly</button>
            <button onClick={() => setAnnual(true)} style={{ padding: '8px 20px', borderRadius: radius.full, border: 'none', cursor: 'pointer', background: annual ? colors.primary : 'transparent', color: annual ? '#000' : colors.onSurfaceVariant, fontWeight: 600, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>Annual <span style={{ color: annual ? '#000' : '#4ade80', fontSize: 11 }}>-25%</span></button>
          </div>
        </div>
        <div style={{ maxWidth: 600, margin: '0 auto 32px', padding: '14px 20px', borderRadius: radius.lg, background: colors.surfaceContainerHigh, border: '1px solid ' + colors.outlineVariant, fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 1.6, textAlign: 'left' }}>
          <strong style={{ color: colors.onSurface }}>How credits work:</strong> paste a 30-minute video &rarr; uses 30 credits. Credits reset monthly. Unused credits do not roll over.
        </div>
        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            { n: 'Free', p: 0, cr: 30, d: 'Try it out', f: ['30 credits/month', '5 min video window', '720p exports', 'Watermark on clips', 'Basic captions', '1 project', '3 African templates', 'Email support'], badge: null },
            { n: 'Starter', p: 12, cr: 300, d: 'Growing creators', f: ['300 credits/month', '15 min video window', '1080p exports', 'No watermark', 'Custom captions', '5 projects', 'All 20 templates', 'Scheduling calendar', 'Basic analytics', 'Email support'], badge: 'Most Popular' },
            { n: 'Pro', p: 29, cr: 1000, d: 'Serious creators', f: ['1,000 credits/month', '45 min video window', '4K exports', 'No watermark', 'Animated captions', 'Unlimited projects', 'All 20 + custom templates', 'Scheduling calendar', 'Full analytics', 'Priority support'], badge: 'Best Value' },
            { n: 'Agency', p: 89, cr: 5000, d: 'Teams & agencies', f: ['5,000 credits/month', '90 min video window', '4K + ProRes', 'No watermark', 'All caption styles', 'Unlimited projects', 'White-label templates', 'Scheduling calendar', 'Full analytics + reports', 'Up to 10 team members', 'API access', 'Dedicated support'], badge: null },
          ].map(plan => {
            const dp = annual ? Math.round(plan.p * 0.75) : plan.p;
            const hi = plan.badge !== null;
            return (
              <div key={plan.n} style={{ background: hi ? colors.surfaceContainerHigh : colors.surfaceContainerLow, borderRadius: radius.xl, padding: 28, border: hi ? '1px solid '+colors.primary+'40' : '1px solid transparent', position: 'relative', boxShadow: hi ? shadows.glow : 'none' }}>
                {plan.badge && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: gradients.primary, color: '#000', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: radius.full, whiteSpace: 'nowrap' }}>{plan.badge}</div>}
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{plan.n}</h3>
                <p style={{ fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 16 }}>{plan.d}</p>
                <div style={{ marginBottom: plan.p > 0 ? 4 : 24 }}><span style={{ fontSize: 40, fontWeight: 800 }}>${dp}</span><span style={{ fontSize: 14, color: colors.onSurfaceVariant }}>/mo</span></div>
                {plan.p > 0 && <p style={{ fontSize: 11, color: colors.onSurfaceVariant, margin: '0 0 20px', opacity: 0.7 }}>1 credit = 1 minute of video processed</p>}
                <button onClick={() => router.push('/auth')} style={{ width: '100%', background: hi ? gradients.primary : colors.surfaceContainer, color: hi ? '#FAF7FF' : colors.onSurface, border: hi ? 'none' : '1px solid '+colors.outlineVariant, padding: 12, borderRadius: radius.md, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 24, fontFamily: "'Inter', sans-serif" }}>{plan.p === 0 ? 'Get Started' : 'Start Trial'}</button>
                <ul style={{ listStyle: 'none', padding: 0 }}>{plan.f.map(f => <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 9 }}><Icon name="check_circle" size={15} style={{ color: colors.primary, flexShrink: 0, marginTop: 1 }} filled /> {f}</li>)}</ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, marginBottom: 16 }}>Ready to go viral?</h2>
        <p style={{ color: colors.onSurfaceVariant, fontSize: 18, marginBottom: 36 }}>Join 50,000+ creators saving 20+ hours a week.</p>
        <button onClick={() => router.push('/auth')} style={{ background: gradients.primary, color: '#FAF7FF', fontWeight: 700, padding: '16px 40px', borderRadius: radius.xl, border: 'none', cursor: 'pointer', fontSize: 16, boxShadow: shadows.glowStrong, fontFamily: "'Inter', sans-serif" }}>Start Creating &mdash; It&apos;s Free</button>
      </section>

      {/* FOOTER */}
      <footer style={{ position: 'relative', overflow: 'hidden', borderTop: '1px solid rgba(124,58,237,0.3)' }}>
        {/* YouTube video background */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '177.78vh', minWidth: '100%', height: '56.25vw', minHeight: '100%', zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <iframe
            src="https://www.youtube.com/embed/ifIR8cdrbkY?autoplay=1&mute=1&loop=1&playlist=ifIR8cdrbkY&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1"
            style={{ position: 'absolute', top: '-80px', left: 0, width: '100%', height: 'calc(100% + 160px)', border: 'none', pointerEvents: 'none' }}
            allow="autoplay; encrypted-media"
            title="Footer background video"
          />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80px', background: '#0a0014', zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: '#0a0014', zIndex: 2, pointerEvents: 'none' }} />
        </div>
        {/* Dark overlay — heavier than hero so text is readable */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,0,20,0.92) 0%, rgba(10,0,40,0.96) 60%, rgba(5,0,15,0.98) 100%)', zIndex: 1 }} />
        {/* Purple glow top center */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: '200px', background: 'radial-gradient(ellipse at center top, rgba(124,58,237,0.18) 0%, transparent 70%)', zIndex: 1, pointerEvents: 'none' }} />
        {/* Footer content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '60px 40px 40px' }}>
          {/* Decorative top border — film strip gradient */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(to right, transparent, rgba(124,58,237,0.6), rgba(6,182,212,0.4), rgba(236,72,153,0.3), transparent)', zIndex: 3 }} />
          {/* Left edge film strip */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '48px', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
            <svg width="48" height="100%" viewBox="0 0 48 500" preserveAspectRatio="xMidYMin slice" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="0" width="44" height="500" fill="none" stroke="rgba(124,58,237,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="10" width="36" height="26" rx="3" fill="rgba(124,58,237,0.06)" stroke="rgba(124,58,237,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="50" width="36" height="26" rx="3" fill="rgba(124,58,237,0.06)" stroke="rgba(124,58,237,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="90" width="36" height="26" rx="3" fill="rgba(124,58,237,0.06)" stroke="rgba(124,58,237,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="130" width="36" height="26" rx="3" fill="rgba(124,58,237,0.06)" stroke="rgba(124,58,237,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="170" width="36" height="26" rx="3" fill="rgba(124,58,237,0.06)" stroke="rgba(124,58,237,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="210" width="36" height="26" rx="3" fill="rgba(124,58,237,0.06)" stroke="rgba(124,58,237,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="250" width="36" height="26" rx="3" fill="rgba(124,58,237,0.06)" stroke="rgba(124,58,237,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="290" width="36" height="26" rx="3" fill="rgba(124,58,237,0.06)" stroke="rgba(124,58,237,0.12)" strokeWidth="0.5"/>
              <circle cx="24" cy="80" r="4" fill="rgba(124,58,237,0.2)"/>
              <circle cx="24" cy="200" r="3" fill="rgba(6,182,212,0.2)"/>
              <circle cx="24" cy="340" r="5" fill="rgba(236,72,153,0.15)"/>
            </svg>
          </div>
          {/* Right edge film strip */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '48px', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
            <svg width="48" height="100%" viewBox="0 0 48 500" preserveAspectRatio="xMidYMin slice" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="0" width="44" height="500" fill="none" stroke="rgba(124,58,237,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="10" width="36" height="26" rx="3" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="50" width="36" height="26" rx="3" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="90" width="36" height="26" rx="3" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="130" width="36" height="26" rx="3" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="170" width="36" height="26" rx="3" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="210" width="36" height="26" rx="3" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="250" width="36" height="26" rx="3" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.12)" strokeWidth="0.5"/>
              <rect x="6" y="290" width="36" height="26" rx="3" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.12)" strokeWidth="0.5"/>
              <circle cx="24" cy="120" r="4" fill="rgba(6,182,212,0.2)"/>
              <circle cx="24" cy="260" r="3" fill="rgba(124,58,237,0.2)"/>
              <circle cx="24" cy="400" r="5" fill="rgba(236,72,153,0.12)"/>
            </svg>
          </div>
          {/* Floating geometric shapes left */}
          <div style={{ position: 'absolute', top: '40px', left: '80px', pointerEvents: 'none', zIndex: 2 }}>
            <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
              <rect x="0" y="0" width="64" height="45" rx="8" fill="rgba(124,58,237,0.06)" stroke="rgba(124,58,237,0.18)" strokeWidth="0.8" transform="rotate(-8 32 22)"/>
              <rect x="50" y="30" width="50" height="35" rx="6" fill="rgba(6,182,212,0.05)" stroke="rgba(6,182,212,0.15)" strokeWidth="0.8" transform="rotate(5 75 47)"/>
            </svg>
          </div>
          {/* Floating geometric shapes right */}
          <div style={{ position: 'absolute', top: '40px', right: '80px', pointerEvents: 'none', zIndex: 2 }}>
            <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
              <rect x="10" y="5" width="55" height="38" rx="8" fill="rgba(236,72,153,0.05)" stroke="rgba(236,72,153,0.15)" strokeWidth="0.8" transform="rotate(10 37 24)"/>
              <rect x="55" y="35" width="48" height="32" rx="6" fill="rgba(124,58,237,0.06)" stroke="rgba(124,58,237,0.18)" strokeWidth="0.8" transform="rotate(-6 79 51)"/>
            </svg>
          </div>
          {/* Bottom glow */}
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '70%', height: '150px', background: 'radial-gradient(ellipse at center bottom, rgba(124,58,237,0.12) 0%, transparent 70%)', zIndex: 1, pointerEvents: 'none' }} />
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', fontFamily: 'Arial Black, Arial, sans-serif' }}>Vangel<span style={{ color: '#7C3AED' }}>Clip</span></span>
              </div>
              <p style={{ fontSize: 12, color: colors.onSurfaceVariant, opacity: 0.5, marginBottom: 8 }}>Clip. Spread. Transform.</p>
              <p style={{ fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 1.7 }}>Africa&apos;s AI clip platform for gospel creators, educators, and inspirational voices.</p>
            </div>
            {[
              { t: 'Product', items: [{ l: 'Features', h: '#features' }, { l: 'Pricing', h: '#pricing' }, { l: 'Changelog', h: '#' }] },
              { t: 'Company', items: [{ l: 'About', h: '/about' }, { l: 'Blog', h: '#' }, { l: 'Contact', h: '#' }] },
              { t: 'Legal', items: [{ l: 'Privacy', h: '/legal/privacy' }, { l: 'Terms', h: '/legal/terms' }, { l: 'Cookies', h: '/legal/cookies' }] },
            ].map(c => (
              <div key={c.t}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.t}</h4>
                {c.items.map(item => <a key={item.l} href={item.h} style={{ display: 'block', fontSize: 13, color: colors.onSurfaceVariant, textDecoration: 'none', marginBottom: 10 }}>{item.l}</a>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(70,69,85,0.1)', paddingTop: 24, fontSize: 12, color: colors.onSurfaceVariant, textAlign: 'center' }}>&copy; 2026 VangelClip. All rights reserved.</div>
        </div>
      </footer>

      {/* DEMO MODAL */}
      {showDemo && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowDemo(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, borderRadius: radius.xl, overflow: 'hidden', background: '#000', position: 'relative' }}>
            <button onClick={() => setShowDemo(false)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={20} style={{ color: '#fff' }} /></button>
            <div style={{ aspectRatio: '16/9' }}><iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0" title="Demo" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ border: 'none' }} /></div>
          </div>
        </div>
      )}

      <style>{`
        /* ─── HERO ───────────────────────────────── */
        .hero-overlay {
          background: linear-gradient(to right, rgba(5,0,20,0.92) 0%, rgba(10,0,40,0.85) 40%, rgba(10,0,40,0.45) 70%, rgba(0,0,0,0.15) 100%);
        }
        .hero-content {
          max-width: 620px;
          padding: 100px 24px 80px 80px;
          text-align: left;
        }
        .hero-headline {
          font-size: clamp(36px, 7vw, 72px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.08;
          margin-bottom: 20px;
          color: #ffffff;
        }
        .hero-subheadline {
          font-size: clamp(15px, 2.2vw, 18px);
          color: rgba(255,255,255,0.82);
          max-width: 520px;
          margin-bottom: 16px;
          line-height: 1.7;
        }
        .hero-tags {
          font-size: clamp(11px, 1.8vw, 13px);
          color: rgba(255,255,255,0.5);
          margin-bottom: 32px;
          letter-spacing: 0.04em;
        }
        .hero-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-bottom: 48px;
        }

        /* ─── STATS ──────────────────────────────── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          max-width: 560px;
          margin-bottom: 60px;
        }

        /* ─── FOOTER GRID ────────────────────────── */
        .footer-grid {
          display: grid;
          grid-template-columns: 2.5fr 1fr 1fr 1fr;
          gap: 40px;
        }

        /* ─── NAV ────────────────────────────────── */
        .nav-links-desktop { display: flex; }
        .nav-signin { display: inline; }
        .nav-cta { display: inline; }

        /* ─── HAMBURGER ──────────────────────────── */
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
        }
        .hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #fff;
          border-radius: 2px;
          transition: transform 0.2s, opacity 0.2s;
        }

        /* ─── MOBILE MENU ────────────────────────── */
        .mobile-menu {
          display: none;
          flex-direction: column;
          gap: 4px;
          position: fixed;
          top: 57px;
          left: 0;
          right: 0;
          background: rgba(10,0,30,0.97);
          backdrop-filter: blur(16px);
          padding: 16px 24px 24px;
          z-index: 49;
          border-bottom: 1px solid rgba(124,58,237,0.2);
          transform: translateY(-110%);
          transition: transform 0.3s ease;
        }
        .mobile-menu.open {
          transform: translateY(0);
          display: flex;
        }
        .mobile-menu a, .mobile-menu button {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          text-align: left;
          transition: background 0.15s;
        }
        .mobile-menu a:hover, .mobile-menu button:hover { background: rgba(124,58,237,0.15); }

        /* ─── DECORATIVE SECTIONS ────────────────── */
        .deco-section { position: relative; overflow: hidden; }
        .deco-corner { position: absolute; pointer-events: none; z-index: 0; }
        .deco-section > *:not(.deco-corner) { position: relative; z-index: 1; }

        /* ─── REEL CARD HOVER ────────────────────── */
        .reel-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .reel-card:hover { transform: translateY(-6px) scale(1.02); }

        /* ─── TABLET 900px ───────────────────────── */
        @media (max-width: 900px) {
          .workflow-grid  { grid-template-columns: repeat(2,1fr) !important; }
          .features-grid  { grid-template-columns: repeat(2,1fr) !important; }
          .pricing-grid   { grid-template-columns: repeat(2,1fr) !important; }
          .reel-grid      { grid-template-columns: repeat(3,1fr) !important; }
          .footer-grid    { grid-template-columns: 1fr 1fr !important; gap: 28px !important; }
        }

        /* ─── TABLET 768px ───────────────────────── */
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-signin        { display: none !important; }
          .nav-cta           { display: none !important; }
          .hamburger         { display: flex !important; }
          .hero-overlay {
            background: linear-gradient(to right, rgba(5,0,20,0.95) 0%, rgba(10,0,40,0.92) 50%, rgba(10,0,40,0.75) 100%) !important;
          }
          .hero-content {
            padding: 100px 20px 60px 20px !important;
            max-width: 100% !important;
          }
          .hero-buttons { flex-direction: column; align-items: flex-start; }
          .hero-buttons > * { width: 100% !important; justify-content: center; }
          .stats-grid {
            grid-template-columns: repeat(2,1fr) !important;
            max-width: 100% !important;
          }
          .testimonials-grid { grid-template-columns: repeat(2,1fr) !important; }
        }

        /* ─── MOBILE 600px ───────────────────────── */
        @media (max-width: 600px) {
          .workflow-grid    { grid-template-columns: 1fr !important; }
          .features-grid    { grid-template-columns: 1fr !important; }
          .pricing-grid     { grid-template-columns: 1fr !important; }
          .reel-grid        { grid-template-columns: repeat(2,1fr) !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .footer-grid      { grid-template-columns: 1fr !important; gap: 24px !important; }
          /* ─── HERO MOBILE MINIMIZE ─── */
          .hero-section-wrap { align-items: flex-end !important; min-height: 85vh !important; }
          .hero-content      { padding: 60px 16px 48px 16px !important; }
          .hero-headline     { font-size: 32px !important; }
          .hero-subheadline  { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
          .hero-tags         { display: none !important; }
          .hero-badge        { display: none !important; }
        }

        /* ─── MOBILE 480px ───────────────────────── */
        @media (max-width: 480px) {
          .hero-content { padding: 60px 16px 40px 16px !important; }
          .stats-grid   { gap: 16px !important; }
        }
      `}</style>
    </div>
  );
}
