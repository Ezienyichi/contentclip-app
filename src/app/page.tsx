'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { colors, gradients, radius, shadows } from '@/lib/tokens';
const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'Creator Â· 1.2M followers', text: 'HookClip cut my editing time from 8 hours to 20 minutes.', avatar: 'S' },
  { name: 'Marcus Johnson', role: 'Podcast Host Â· Top 50', text: 'I paste my episode link and get 10 viral clips back.', avatar: 'M' },
  { name: 'Priya Sharma', role: 'Agency Â· 40+ clients', text: 'Handles what used to take a 5-person team.', avatar: 'P' },
];
export default function LandingPage() {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  return (
    <div style={{ background: colors.background, color: colors.onSurface, fontFamily: "'Inter', sans-serif" }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(14,14,14,0.8)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ width: 32, height: 32, borderRadius: radius.md, background: gradients.cta, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="auto_awesome" size={18} style={{ color: '#fff' }} /></div>
          <img src="/hookclip-logo.svg" alt="HookClip" style={{ height: 32, width: 'auto' }} />
        </div>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '32px', fontSize: '14px', fontWeight: 500 }}>
          <a href="#features" style={{ color: colors.onSurfaceVariant, textDecoration: 'none' }}>Features</a>
          <a href="#workflow" style={{ color: colors.onSurfaceVariant, textDecoration: 'none' }}>Workflow</a>
          <a href="#pricing" style={{ color: colors.onSurfaceVariant, textDecoration: 'none' }}>Pricing</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => router.push('/auth')} style={{ background: 'none', border: 'none', color: colors.onSurfaceVariant, fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Sign In</button>
          <button onClick={() => router.push('/auth')} style={{ background: '#fff', color: '#000', fontSize: '13px', fontWeight: 700, padding: '8px 18px', borderRadius: radius.md, border: 'none', cursor: 'pointer' }}>Start Free</button>
        </div>
      </nav>
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: 300, height: 300, background: 'rgba(93,96,235,0.06)', borderRadius: '50%', filter: 'blur(100px)', animation: 'float 8s ease-in-out infinite' }} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: radius.full, background: colors.surfaceContainerHighest, border: '1px solid ' + colors.outlineVariant, color: colors.primary, fontSize: 12, fontWeight: 600, marginBottom: 32, position: 'relative' }}>
          <Icon name="verified" size={14} /> New: AI Reframe for Shorts
        </div>
        <h1 style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 28, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto', position: 'relative' }}>
          Turn Long Videos Into <span style={{ color: colors.primary }}>High-Performing</span> Short Clips in Minutes
        </h1>
        <p style={{ fontSize: 18, color: colors.onSurfaceVariant, maxWidth: 640, margin: '0 auto 48px', lineHeight: 1.7, position: 'relative' }}>HookClip automatically finds the best moments in your long-form content and formats them perfectly for TikTok, Reels, and YouTube Shorts.</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48, position: 'relative' }}>
          <button onClick={() => router.push('/auth')} style={{ background: gradients.primary, color: '#FAF7FF', fontWeight: 700, padding: '16px 32px', borderRadius: radius.xl, border: 'none', cursor: 'pointer', fontSize: 15, boxShadow: shadows.glowStrong, fontFamily: "'Inter', sans-serif" }}>Create My First Clip</button>
          <button onClick={() => setShowDemo(true)} style={{ background: colors.surfaceContainer, color: colors.onSurface, border: '1px solid ' + colors.outlineVariant, fontWeight: 700, padding: '16px 32px', borderRadius: radius.xl, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Inter', sans-serif" }}><Icon name="play_circle" filled size={20} /> View Demo</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginBottom: 60, flexWrap: 'wrap', position: 'relative' }}>
          {[{ v: '50K+', l: 'Creators' }, { v: '2M+', l: 'Clips' }, { v: '8.2B', l: 'Views' }, { v: '94%', l: 'Satisfaction' }].map(s => <div key={s.l} style={{ textAlign: 'center' }}><p style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{s.v}</p><p style={{ fontSize: 12, color: colors.onSurfaceVariant }}>{s.l}</p></div>)}
        </div>
        <div onClick={() => setShowDemo(true)} style={{ position: 'relative', maxWidth: 960, margin: '0 auto', cursor: 'pointer' }}>
          <div style={{ position: 'relative', background: 'rgba(32,31,31,0.4)', backdropFilter: 'blur(16px)', borderRadius: radius.xl, padding: 8, border: '1px solid rgba(255,255,255,0.05)', boxShadow: shadows.float }}>
            <div style={{ borderRadius: radius.lg, overflow: 'hidden', aspectRatio: '16/9', background: 'linear-gradient(135deg, ' + colors.surfaceContainerLow + ', ' + colors.surfaceContainer + ', rgba(93,96,235,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="play_arrow" filled size={40} style={{ color: '#fff' }} /></div>
            </div>
          </div>
        </div>
      </section>
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>Trusted by creators at</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap', opacity: 0.4 }}>
          {['Google','Adobe','Spotify','Netflix','Shopify'].map(l => <span key={l} style={{ fontSize: 20, fontWeight: 800, color: colors.onSurfaceVariant }}>{l}</span>)}
        </div>
      </section>
      <section id="workflow" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px', borderTop: '1px solid rgba(70,69,85,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}><h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Three Steps to Viral Content</h2><p style={{ color: colors.onSurfaceVariant }}>From long-form video to viral clips in under 5 minutes.</p></div>
        <div className="workflow-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32 }}>
          {[{ icon: 'link', n: '01', t: 'Paste a Link', d: 'Drop a YouTube, Vimeo, or TikTok URL. Zero uploads, zero storage costs.', c: colors.primary },
            { icon: 'auto_awesome', n: '02', t: 'AI Does the Work', d: 'Transcribes, detects hooks, cuts clips, adds captions, reframes to 9:16.', c: colors.tertiary },
            { icon: 'rocket_launch', n: '03', t: 'Publish & Grow', d: 'Review clips ranked by virality. Edit, schedule, and export everywhere.', c: '#4ade80' }
          ].map(s => <div key={s.n} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: 36, position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', top: 16, right: 20, fontSize: 64, fontWeight: 900, color: 'rgba(255,255,255,0.03)' }}>{s.n}</span>
            <div style={{ width: 56, height: 56, borderRadius: radius.lg, background: s.c+'10', border: '1px solid '+s.c+'20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}><Icon name={s.icon} size={26} style={{ color: s.c }} /></div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{s.t}</h3>
            <p style={{ color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 1.7 }}>{s.d}</p>
          </div>)}
        </div>
      </section>
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}><h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Everything You Need to Go Viral</h2></div>
        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
          {[{ i: 'auto_awesome_motion', c: colors.primary, t: 'AI Hook Detection', d: 'Claude AI finds scroll-stopping moments with 94% accuracy.', s: '94% accuracy' },
            { i: 'closed_caption', c: colors.tertiary, t: 'Animated Captions', d: 'Word-by-word animation. +40% watch time.', s: '+40% watch time' },
            { i: 'aspect_ratio', c: colors.secondary, t: '9:16 Reframe', d: 'Speaker-tracking keeps faces centered for vertical.', s: 'Auto reframe' },
            { i: 'schedule_send', c: '#ff97b5', t: 'Multi-Platform Publish', d: 'Schedule to Shorts, TikTok, and Reels from one place.', s: '3 platforms' },
            { i: 'tune', c: '#fbbf24', t: 'Pro Adjustments', d: 'Color, brightness, contrast, stabilization, noise reduction.', s: '20+ tools' },
            { i: 'translate', c: '#4ade80', t: 'Multi-Language', d: 'Transcribe and caption in 50+ languages.', s: '50+ languages' }
          ].map(f => <div key={f.t} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: 36 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: radius.lg, background: f.c+'10', border: '1px solid '+f.c+'20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={f.i} size={24} style={{ color: f.c }} /></div>
              <span style={{ fontSize: 11, fontWeight: 700, color: f.c, background: f.c+'10', padding: '4px 10px', borderRadius: radius.full }}>{f.s}</span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{f.t}</h3>
            <p style={{ color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 1.7 }}>{f.d}</p>
          </div>)}
        </div>
      </section>
      <section id="testimonials" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}><h2 style={{ fontSize: 36, fontWeight: 800 }}>Loved by 50,000+ Creators</h2></div>
        <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {TESTIMONIALS.map(t => <div key={t.name} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: 32 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>{[1,2,3,4,5].map(s => <Icon key={s} name="star" filled size={16} style={{ color: '#fbbf24' }} />)}</div>
            <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>&ldquo;{t.text}&rdquo;</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: gradients.cta, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#000' }}>{t.avatar}</div>
              <div><p style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</p><p style={{ fontSize: 11, color: colors.onSurfaceVariant }}>{t.role}</p></div>
            </div>
          </div>)}
        </div>
      </section>
      <section id="pricing" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Simple, Transparent Pricing</h2>
          <p style={{ color: colors.onSurfaceVariant, marginBottom: 28 }}>Start free. Upgrade when you&apos;re ready.</p>
          <div style={{ display: 'inline-flex', background: colors.surfaceContainerHigh, borderRadius: radius.full, padding: 4 }}>
            <button onClick={() => setAnnual(false)} style={{ padding: '8px 20px', borderRadius: radius.full, border: 'none', cursor: 'pointer', background: !annual ? colors.primary : 'transparent', color: !annual ? '#000' : colors.onSurfaceVariant, fontWeight: 600, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>Monthly</button>
            <button onClick={() => setAnnual(true)} style={{ padding: '8px 20px', borderRadius: radius.full, border: 'none', cursor: 'pointer', background: annual ? colors.primary : 'transparent', color: annual ? '#000' : colors.onSurfaceVariant, fontWeight: 600, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>Annual <span style={{ color: annual ? '#000' : '#4ade80', fontSize: 11 }}>-25%</span></button>
          </div>
        </div>
        {/* Credits explainer */}
        <div style={{ maxWidth: 600, margin: '0 auto 32px', padding: '14px 20px', borderRadius: radius.lg, background: colors.surfaceContainerHigh, border: '1px solid ' + colors.outlineVariant, fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 1.6, textAlign: 'left' }}>
          <strong style={{ color: colors.onSurface }}>How credits work:</strong> paste a 30-minute video → uses 30 credits. Credits reset monthly. Unused credits do not roll over.
        </div>
        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            { n: 'Free', p: 0, cr: 30, d: 'Try it out', f: ['30 credits/month', '5 min video window', '720p exports', 'Watermark on clips', 'Basic captions', '1 project'], badge: null },
            { n: 'Starter', p: 12, cr: 300, d: 'Growing creators', f: ['300 credits/month', '15 min video window', '1080p exports', 'No watermark', 'Custom captions', '5 projects'], badge: 'Most Popular' },
            { n: 'Pro', p: 29, cr: 1000, d: 'Serious creators', f: ['1,000 credits/month', '45 min video window', '4K exports', 'No watermark', 'Animated captions', 'Unlimited projects'], badge: 'Best Value' },
            { n: 'Agency', p: 89, cr: 5000, d: 'Teams & agencies', f: ['5,000 credits/month', '90 min video window', '4K + ProRes', 'No watermark', 'All caption styles', 'Unlimited projects', 'Priority processing', 'API access'], badge: null },
          ].map(plan => {
            const dp = annual ? Math.round(plan.p * 0.75) : plan.p;
            const hi = plan.badge !== null;
            return <div key={plan.n} style={{ background: hi ? colors.surfaceContainerHigh : colors.surfaceContainerLow, borderRadius: radius.xl, padding: 32, border: hi ? '1px solid '+colors.primary+'40' : '1px solid transparent', position: 'relative', boxShadow: hi ? shadows.glow : 'none' }}>
              {plan.badge && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: gradients.primary, color: '#000', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: radius.full, whiteSpace: 'nowrap' }}>{plan.badge}</div>}
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{plan.n}</h3>
              <p style={{ fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 16 }}>{plan.d}</p>
              <div style={{ marginBottom: plan.p > 0 ? 4 : 24 }}><span style={{ fontSize: 40, fontWeight: 800 }}>${dp}</span><span style={{ fontSize: 14, color: colors.onSurfaceVariant }}>/mo</span></div>
              {plan.p > 0 && <p style={{ fontSize: 11, color: colors.onSurfaceVariant, margin: '0 0 20px', opacity: 0.7 }}>1 credit = 1 minute of video processed</p>}
              <button onClick={() => router.push('/auth')} style={{ width: '100%', background: hi ? gradients.primary : colors.surfaceContainer, color: hi ? '#FAF7FF' : colors.onSurface, border: hi ? 'none' : '1px solid '+colors.outlineVariant, padding: 12, borderRadius: radius.md, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 24, fontFamily: "'Inter', sans-serif" }}>{plan.p === 0 ? 'Get Started' : 'Start Trial'}</button>
              <ul style={{ listStyle: 'none', padding: 0 }}>{plan.f.map(f => <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 10 }}><Icon name="check_circle" size={16} style={{ color: colors.primary }} filled /> {f}</li>)}</ul>
            </div>;
          })}
        </div>
      </section>
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>Ready to go viral?</h2>
        <p style={{ color: colors.onSurfaceVariant, fontSize: 18, marginBottom: 36 }}>Join 50,000+ creators saving 20+ hours a week.</p>
        <button onClick={() => router.push('/auth')} style={{ background: gradients.primary, color: '#FAF7FF', fontWeight: 700, padding: '16px 40px', borderRadius: radius.xl, border: 'none', cursor: 'pointer', fontSize: 16, boxShadow: shadows.glowStrong, fontFamily: "'Inter', sans-serif" }}>Start Creating â€” It&apos;s Free</button>
      </section>
      <footer style={{ borderTop: '1px solid rgba(70,69,85,0.1)', padding: '48px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: radius.sm, background: gradients.cta, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="auto_awesome" size={14} style={{ color: '#fff' }} /></div>
              <img src="/hookclip-logo.svg" alt="HookClip" style={{ height: 28, width: "auto", opacity: 0.7 }} />
            </div>
            <p style={{ fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 1.7 }}>AI-powered video clipping. Built by TechDuce Africa.</p>
          </div>
          {[{ t: 'Product', l: ['Features','Pricing','Changelog'] }, { t: 'Company', l: ['About','Blog','Contact'] }, { t: 'Legal', l: ['Privacy','Terms','Cookies'] }].map(c => <div key={c.t}><h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.t}</h4>{c.l.map(l => <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: colors.onSurfaceVariant, textDecoration: 'none', marginBottom: 10 }}>{l}</a>)}</div>)}
        </div>
        <div style={{ borderTop: '1px solid rgba(70,69,85,0.1)', paddingTop: 24, fontSize: 12, color: colors.onSurfaceVariant, textAlign: 'center' }}>Â© {new Date().getFullYear()} HookClip by TechDuce Africa.</div>
      </footer>
      {showDemo && <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowDemo(false)}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, borderRadius: radius.xl, overflow: 'hidden', background: '#000', position: 'relative' }}>
          <button onClick={() => setShowDemo(false)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="close" size={20} style={{ color: '#fff' }} /></button>
          <div style={{ aspectRatio: '16/9' }}><iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0" title="Demo" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ border: 'none' }} /></div>
        </div>
      </div>}
      <style>{'@media (max-width: 768px) { .nav-links { display: none !important; } .workflow-grid, .features-grid, .pricing-grid, .testimonials-grid { grid-template-columns: 1fr !important; } .footer-grid { grid-template-columns: repeat(2, 1fr) !important; } }'}</style>
    </div>
  );
}
