'use client';
import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { mkt as _mkt, mktBtn as _mktBtn, mktCard as _mktCard } from '@/theme';
import type { CSSProperties as CP } from 'react';
import { PLAN_DATA, COMPARISON_KEYS } from '@/lib/pricingData';

// ── Light theme override (homepage only) ──────────────────────────────────────
const mkt = {
  ..._mkt,
  bg:         '#E4E2DD',
  surface:    '#EFECEA',
  surface2:   '#E8E5DF',
  text:       '#1A1714',
  muted:      '#6B6560',
  border:     'rgba(0,0,0,0.10)',
  edge:       'rgba(0,0,0,0.05)',
  navBg:      'rgba(228,226,221,0.92)',
  shadow:     '0 1px 4px rgba(0,0,0,0.10),0 8px 24px rgba(0,0,0,0.07)',
  glow:       '0 6px 26px rgba(155,93,229,0.18)',
  cardShadow: '0 1px 4px rgba(0,0,0,0.10),0 8px 24px rgba(0,0,0,0.07)',
};

const mktBtn = {
  ..._mktBtn,
  ghost: {
    ..._mktBtn.ghost,
    border:     '1px solid rgba(0,0,0,0.18)',
    color:      '#1A1714',
    background: 'rgba(0,0,0,0.05)',
  } as CP,
};

const mktCard = {
  base: {
    background:   '#EFECEA',
    border:       '1px solid rgba(0,0,0,0.10)',
    borderRadius: '6px',
    boxShadow:    '0 1px 4px rgba(0,0,0,0.10),0 8px 24px rgba(0,0,0,0.07)',
  } as CP,
  elevated: {
    background:   '#F5F2EE',
    border:       '1px solid rgba(0,0,0,0.10)',
    borderRadius: '10px',
    boxShadow:    '0 1px 4px rgba(0,0,0,0.10),0 8px 24px rgba(0,0,0,0.07)',
  } as CP,
};

// ── Static data ───────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'Workflow', href: '/#workflow' },
  { label: 'Pricing',  href: '/#pricing'  },
  { label: 'About',    href: '/about'     },
];

const PHONES = [
  { name: 'MUSIC',       cap: 'One song, eight reels',        cls: 'vph-outer-l' },
  { name: 'CONFERENCES', cap: 'Stage moments that move',      cls: 'vph-mid-l'   },
  { name: 'PODCAST',     cap: 'Why your why matters',         cls: 'vph-center'  },
  { name: 'EDUCATION',   cap: 'A masterclass in 15 shorts',   cls: 'vph-mid-r'   },
  { name: 'SERMON',      cap: 'Faith over fear. Sunday',      cls: 'vph-outer-r' },
];

const STATS = [
  { num: '700M+', label: 'Internet users in Africa' },
  { num: '33M+',  label: 'YouTube users in Nigeria alone' },
  { num: '10M+',  label: 'African TikTok creators' },
  { num: 'First', label: 'African-built AI clip platform' },
];

const FEATURE_IMGS = [
  { src: '/images/feature-viral-score.jpg', label: 'AI Hook Detection',      badge: '94% accuracy'    },
  { src: '/images/feature-captions.png',    label: 'Animated Captions',      badge: '+40% watch time' },
  { src: '/images/feature-scheduling.png',  label: 'Multi-Platform Publish', badge: '3 platforms'     },
  { src: '/images/feature-editing.png',     label: 'Pro Adjustments',        badge: '20+ tools'       },
];

// PLANS is now imported from @/lib/pricingData as PLAN_DATA — single source of truth

const FAQS = [
  { q: 'What does "minutes" mean?',      a: 'Minutes are the total length of video you process each month. A 40-minute sermon uses 40 minutes, no matter how many clips you generate from it.' },
  { q: 'What happens when I run out?',   a: 'Upgrade anytime for more minutes, or wait for your monthly reset. Clips you already made stay yours.' },
  { q: 'Do unused minutes roll over?',   a: 'No, your minute balance resets each month.' },
  { q: 'Can I cancel anytime?',          a: 'Yes, no contract.' },
];

const FOOTER_COLS = [
  { heading: 'Product', items: [{ l: 'Features', h: '/#features' }, { l: 'Pricing',  h: '/#pricing'      }, { l: 'Changelog', h: '#' }] },
  { heading: 'Company', items: [{ l: 'About',    h: '/about'     }, { l: 'Blog',     h: '#'              }, { l: 'Contact',   h: '#' }] },
  { heading: 'Legal',   items: [{ l: 'Privacy',  h: '/legal/privacy' }, { l: 'Terms', h: '/legal/terms'  }, { l: 'Cookies',   h: '/legal/cookies' }] },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router  = useRouter();
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [heroUrl,    setHeroUrl]    = useState('');
  const [annual,     setAnnual]     = useState(false);
  const [openFaq,    setOpenFaq]    = useState<number | null>(null);
  const [tableOpen,  setTableOpen]  = useState(false);
  const [authUser,   setAuthUser]   = useState<any>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setAuthUser(data.user));
  }, []);

  function startClipping() {
    const url = heroUrl.trim();
    router.push(url ? `/import?url=${encodeURIComponent(url)}` : '/import');
  }

  const planCard  = (pop: boolean) => pop ? {
    // Popular: subtle purple tint so it's elevated above the black page
    position:'relative' as const, background:'rgba(155,93,229,0.08)',
    border:`2px solid ${mkt.brand}`, borderRadius:mkt.rMd,
    padding:30, boxShadow:`${mkt.glow},inset 1px 1px 0 ${mkt.edge}`,
  } : {
    position:'relative' as const, background:mkt.surface,
    border:`1px solid ${mkt.border}`, borderRadius:mkt.rMd,
    padding:30, boxShadow:`inset 1px 1px 0 ${mkt.edge},${mkt.shadow}`,
  };

  const planCta = (pop: boolean) => pop ? {
    display:'block', width:'100%', border:'none',
    background:mkt.brandGrad, color:'#fff',
    fontWeight:700, fontSize:15, padding:14,
    borderRadius:mkt.r, cursor:'pointer',
    boxShadow:`inset 1px 1px 0 rgba(255,255,255,.20),${mkt.glow}`,
    fontFamily:mkt.fontBody, marginTop:18,
  } as CSSProperties : {
    display:'block', width:'100%',
    border:`1px solid ${mkt.border}`,
    background:'rgba(0,0,0,0.04)', color:mkt.text,
    fontWeight:600, fontSize:15, padding:14,
    borderRadius:mkt.r, cursor:'pointer',
    fontFamily:mkt.fontBody, marginTop:18,
    textAlign:'center',
  } as CSSProperties;

  return (
    <div className="mkt-page" style={{ background:mkt.bg, color:mkt.text, fontFamily:mkt.fontBody, minHeight:'100vh' }}>

      {/* ── All CSS ── */}
      <style>{`
        /* Phone cluster */
        .vc-phones   { display:flex; flex-direction:row-reverse; gap:20px; justify-content:center; align-items:flex-end; height:500px; position:relative; overflow:visible; }
        .vc-phone    { border-radius:22px; border:1px solid ${mkt.border}; overflow:hidden; background:${mkt.surface}; flex:none; position:relative; box-shadow:${mkt.cardShadow}; }
        .vph-outer-l { width:160px; height:336px; animation:vcFloat  5.2s ease-in-out infinite; }
        .vph-mid-l   { width:186px; height:390px; animation:vcFloat2 4.4s ease-in-out infinite; }
        .vph-center  { width:232px; height:486px; animation:vcFloat  4.0s ease-in-out infinite; z-index:2; }
        .vph-mid-r   { width:186px; height:390px; animation:vcFloat2 4.8s ease-in-out infinite; }
        .vph-outer-r { width:160px; height:336px; animation:vcFloat  5.6s ease-in-out infinite; }
        @keyframes vcFloat  { 0%,100%{transform:translateY(0)}    50%{transform:translateY(-14px)} }
        @keyframes vcFloat2 { 0%,100%{transform:translateY(-8px)} 50%{transform:translateY(6px)}  }

        /* Grids */
        .vc-stats     { display:grid; grid-template-columns:repeat(4,1fr);  gap:18px; }
        .vc-feat-grid { display:grid; grid-template-columns:repeat(2,1fr);  gap:20px; margin-bottom:30px; }
        .vc-plan-grid { display:grid; grid-template-columns:repeat(4,1fr);  gap:22px; align-items:start; }
        .vc-footer-g  { display:grid; grid-template-columns:1.6fr 1fr 1fr 1fr; gap:32px; }

        /* Hero input row */
        .vc-hero-row   { display:flex; gap:10px; justify-content:center; align-items:stretch; flex-wrap:wrap; max-width:620px; margin:0 auto; }
        .vc-hero-input { display:flex; align-items:center; gap:8px; flex:1; min-width:260px; background:rgba(0,0,0,0.06); border:1px solid rgba(0,0,0,0.15); border-radius:${mkt.r}; padding:6px 6px 6px 14px; box-shadow:inset 1px 1px 0 rgba(0,0,0,0.04); }
        .vc-hero-cta   { flex:none; border:none; background:${mkt.brandGrad}; color:#fff; font-weight:700; font-family:'Figtree',sans-serif; font-size:15px; padding:0 22px; min-height:50px; border-radius:${mkt.r}; cursor:pointer; box-shadow:inset 1px 1px 0 rgba(255,255,255,.25),${mkt.glow}; white-space:nowrap; }
        .vc-cta-input  { display:flex; align-items:center; gap:8px; flex:1; min-width:280px; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.3); border-radius:${mkt.r}; padding:6px 6px 6px 14px; }
        .vc-cta-btn    { flex:none; border:none; background:#fff; color:${mkt.brand}; font-weight:700; font-family:'Figtree',sans-serif; font-size:15.5px; padding:14px 24px; border-radius:${mkt.r}; cursor:pointer; box-shadow:0 6px 18px rgba(0,0,0,.18); white-space:nowrap; }

        /* Nav */
        .vc-nav-links { display:flex; gap:30px; align-items:center; font-size:14.5px; font-weight:500; }
        .vc-nav-links a { color:${mkt.muted}; text-decoration:none; transition:color .15s; }
        .vc-nav-links a:hover { color:${mkt.text}; }
        .vc-nav-sighin { display:inline-flex; }
        .vc-hamburger  { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:8px; }
        .vc-hamburger span { display:block; width:22px; height:2px; background:${mkt.text}; border-radius:2px; }
        .vc-mobile-menu { display:none; position:fixed; inset:0; top:57px; background:rgba(0,0,0,0.97); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); z-index:90; flex-direction:column; padding:12px 20px; gap:2px; overflow-y:auto; }
        .vc-mobile-menu.open { display:flex; }
        .vc-mobile-menu a { display:block; color:${mkt.text}; text-decoration:none; font-size:18px; font-weight:600; padding:14px 0; border-bottom:1px solid ${mkt.border}; font-family:'Figtree',sans-serif; }
        .vc-mobile-menu a:hover { color:${mkt.brand}; }

        /* Section */
        .vc-sec { max-width:${mkt.maxW}; margin:0 auto; padding:80px 28px; }

        /* Trust strip logos */
        .vc-logos { display:flex; gap:24px; justify-content:space-evenly; flex-wrap:wrap; align-items:center; }

        /* Pricing toggle pill */
        .vc-pill-active   { border:none; cursor:pointer; background:linear-gradient(135deg,${mkt.brand},${mkt.brand2}); color:#fff; font-weight:600; font-size:14px; padding:9px 22px; border-radius:100px; box-shadow:inset 1px 1px 0 rgba(255,255,255,.25),${mkt.glow}; font-family:'Figtree',sans-serif; }
        .vc-pill-inactive { border:none; cursor:pointer; background:transparent; color:${mkt.muted}; font-weight:600; font-size:14px; padding:9px 22px; border-radius:100px; font-family:'Figtree',sans-serif; }

        /* FAQ */
        .vc-faq { background:${mkt.surface}; border:1px solid ${mkt.border}; border-radius:${mkt.r}; padding:18px 20px; box-shadow:inset 1px 1px 0 ${mkt.edge},${mkt.shadow}; cursor:pointer; }

        /* CTA row */
        .vc-cta-row { display:flex; gap:10px; justify-content:center; align-items:stretch; flex-wrap:wrap; max-width:580px; margin:0 auto; }

        /* ── Tablet 860px ── */
        @media (max-width:860px) {
          .vc-stats     { grid-template-columns:repeat(2,1fr); }
          .vc-feat-grid { grid-template-columns:1fr; }
          .vc-plan-grid { grid-template-columns:repeat(2,1fr); }
          .vc-footer-g  { grid-template-columns:1fr 1fr; gap:24px; }
        }
        @media (max-width:540px) {
          .vc-plan-grid { grid-template-columns:1fr; }
        }

        /* ── Nav collapse 768px ── */
        @media (max-width:768px) {
          .vc-nav-links  { display:none; }
          .vc-nav-sighin { display:none; }
          .vc-hamburger  { display:flex; }
        }

        /* ── Phone cluster 900px: hold current sizes so 641–900px range stays clean ── */
        @media (max-width:900px) {
          .vc-phones   { height:360px; gap:18px; }
          .vph-outer-l { width:118px; height:248px; }
          .vph-mid-l   { width:138px; height:288px; }
          .vph-center  { width:172px; height:340px; }
          .vph-mid-r   { width:138px; height:288px; }
          .vph-outer-r { width:118px; height:248px; }
        }

        /* ── Phone cluster 640px: 3-card mobile layout ── */
        @media (max-width:640px) {
          .vph-outer-l, .vph-outer-r { display:none; }
          .vc-phones  { height:270px; gap:10px; }
          .vph-mid-l  { width:98px;  height:206px; }
          .vph-center { width:122px; height:256px; }
          .vph-mid-r  { width:98px;  height:206px; }
        }

        /* ── Mobile 600px ── */
        @media (max-width:600px) {
          .vc-sec       { padding:56px 16px; }
          .vc-stats     { gap:12px; }
          .vc-logos     { gap:20px; }
          .vc-footer-g  { grid-template-columns:1fr; gap:20px; }
        }

        /* ── Hero input stacks 480px ── */
        @media (max-width:480px) {
          .vc-hero-row  { flex-direction:column; gap:8px; }
          .vc-hero-cta  { padding:14px; }
          .vc-cta-row   { flex-direction:column; }
          .vc-cta-input { min-width:0; }
          .vc-cta-btn   { padding:14px; }
        }

        @media (prefers-reduced-motion:reduce) { .vc-phone { animation:none !important; } }

        .vc-hero-cta:focus-visible, .vc-hamburger:focus-visible,
        .vc-pill-active:focus-visible, .vc-pill-inactive:focus-visible { outline:2px solid ${mkt.brand}; outline-offset:2px; border-radius:${mkt.r}; }
        a:focus-visible { outline:2px solid ${mkt.brand}; outline-offset:2px; border-radius:3px; }
        .vc-hero-icon { position:absolute; pointer-events:none; user-select:none; }
        @media (max-width:900px) { .vc-hero-icon { display:none; } }
      `}</style>

      {/* ══ NAV ════════════════════════════════════════════════════════════════ */}
      <nav style={{ position:'sticky', top:0, zIndex:100, backdropFilter:'saturate(160%) blur(14px)', WebkitBackdropFilter:'saturate(160%) blur(14px)', background:mkt.navBg, borderBottom:`1px solid ${mkt.border}` }}>
        <div style={{ maxWidth:mkt.maxW, margin:'0 auto', padding:'15px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
          <a href="/" style={{ fontFamily:mkt.fontHead, fontWeight:800, fontSize:21, letterSpacing:'-.02em', color:mkt.text, textDecoration:'none', flexShrink:0 }}>
            Vangel<span style={{ color:mkt.brand }}>Clip</span>
          </a>
          <div className="vc-nav-links">
            {NAV_LINKS.map(l => <a key={l.label} href={l.href}>{l.label}</a>)}
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            {authUser ? (
              <a href="/dashboard" style={{ ...mktBtn.primary, fontSize:13.5, padding:'10px 18px', minHeight:36 }}>Dashboard</a>
            ) : (
              <>
                <a href="/auth" className="vc-nav-sighin" style={{ ...mktBtn.ghost, fontSize:13.5, padding:'8px 14px', minHeight:36 }}>Sign in</a>
                <a href="/auth?mode=signup" style={{ ...mktBtn.primary, fontSize:13.5, padding:'10px 18px', minHeight:36 }}>Start Free</a>
              </>
            )}
            <button className="vc-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu" aria-expanded={menuOpen}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      <div className={`vc-mobile-menu${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)}>
        {NAV_LINKS.map(l => <a key={l.label} href={l.href}>{l.label}</a>)}
        {authUser ? (
          <a href="/dashboard" style={{ background:mkt.brandGrad, color:'#fff', borderRadius:mkt.r, textAlign:'center', marginTop:12, padding:'15px 0', boxShadow:`inset 1px 1px 0 rgba(255,255,255,.25),${mkt.glow}`, border:'none' }}>Dashboard</a>
        ) : (
          <>
            <a href="/auth" style={{ color:mkt.muted }}>Sign in</a>
            <a href="/auth?mode=signup" style={{ background:mkt.brandGrad, color:'#fff', borderRadius:mkt.r, textAlign:'center', marginTop:12, padding:'15px 0', boxShadow:`inset 1px 1px 0 rgba(255,255,255,.25),${mkt.glow}`, border:'none' }}>Start Free</a>
          </>
        )}
      </div>

      {/* ══ HERO ═══════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth:mkt.maxW, margin:'0 auto', padding:'78px 28px 30px', textAlign:'center', minHeight:600, position:'relative' }}>

        {/* Music note — upper left */}
        <span className="vc-hero-icon" style={{ top:85, left:38, transform:'rotate(-15deg)' }}>
          <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
            <line x1="21" y1="4" x2="21" y2="33" stroke={mkt.brand} strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M21 4 C29 8 30 17 25 23" stroke={mkt.brand} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <ellipse cx="13" cy="35" rx="10" ry="6.5" transform="rotate(-15 13 35)" fill={mkt.brand}/>
          </svg>
        </span>

        {/* Microphone — upper right */}
        <span className="vc-hero-icon" style={{ top:52, right:38, transform:'rotate(10deg)' }}>
          <svg width="28" height="46" viewBox="0 0 28 46" fill="none">
            <rect x="7" y="1" width="14" height="22" rx="7" fill={mkt.brand} opacity="0.18"/>
            <rect x="7" y="1" width="14" height="22" rx="7" stroke={mkt.brand} strokeWidth="2.5"/>
            <line x1="10" y1="9"  x2="18" y2="9"  stroke={mkt.brand} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            <line x1="10" y1="14" x2="18" y2="14" stroke={mkt.brand} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            <path d="M2 20 C2 35 26 35 26 20" stroke={mkt.brand} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <line x1="14" y1="35" x2="14" y2="42" stroke={mkt.brand} strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="6"  y1="42" x2="22" y2="42" stroke={mkt.brand} strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </span>

        {/* Chat bubble — left middle */}
        <span className="vc-hero-icon" style={{ top:218, left:14, transform:'rotate(-8deg)' }}>
          <svg width="44" height="40" viewBox="0 0 44 40" fill="none">
            <rect x="2" y="2" width="40" height="28" rx="9" fill={mkt.brand} opacity="0.12"/>
            <rect x="2" y="2" width="40" height="28" rx="9" stroke={mkt.brand} strokeWidth="2.5"/>
            <line x1="11" y1="12" x2="33" y2="12" stroke={mkt.brand} strokeWidth="2" strokeLinecap="round"/>
            <line x1="11" y1="20" x2="25" y2="20" stroke={mkt.brand} strokeWidth="2" strokeLinecap="round"/>
            <path d="M10 30 L6 39 L20 30" fill={mkt.brand} opacity="0.12"/>
            <path d="M10 30 L6 39 L20 30" stroke={mkt.brand} strokeWidth="2" strokeLinejoin="round" fill="none"/>
          </svg>
        </span>

        {/* Heart — right middle */}
        <span className="vc-hero-icon" style={{ top:198, right:18, transform:'rotate(8deg)' }}>
          <svg width="38" height="34" viewBox="0 0 38 34" fill="none">
            <path d="M19 31C17 29 2 20 2 10C2 5.8 5.4 3 9.5 3C13 3 16 5 19 8.5C22 5 25 3 28.5 3C32.6 3 36 5.8 36 10C36 20 21 29 19 31Z" fill={mkt.brand}/>
          </svg>
        </span>

        {/* Hands holding phone — lower right */}
        <span className="vc-hero-icon" style={{ bottom:68, right:42, transform:'rotate(5deg)' }}>
          <svg width="46" height="52" viewBox="0 0 46 52" fill="none">
            <rect x="12" y="1"  width="22" height="37" rx="5" fill={mkt.brand} opacity="0.15"/>
            <rect x="12" y="1"  width="22" height="37" rx="5" stroke={mkt.brand} strokeWidth="2.5"/>
            <rect x="15" y="5"  width="16" height="24" rx="2" fill={mkt.brand} opacity="0.2"/>
            <line x1="18" y1="33" x2="28" y2="33" stroke={mkt.brand} strokeWidth="2" strokeLinecap="round"/>
            <path d="M4 44 C4 40 12 38 12 38"        stroke={mkt.brand} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M42 44 C42 40 34 38 34 38"      stroke={mkt.brand} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M4 44 Q4 50 23 50 Q42 50 42 44" stroke={mkt.brand} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          </svg>
        </span>

        <h1 style={{ fontFamily:mkt.fontHead, fontWeight:800, fontSize:'clamp(32px,6vw,62px)', lineHeight:1.04, letterSpacing:'-.03em', margin:'0 auto 20px', maxWidth:820 }}>
          Spread your Content.<br />
          <span style={{ fontStyle:'italic', fontWeight:700, color:mkt.brand }}>One Video, Seen Everywhere.</span>
        </h1>
        <p style={{ fontSize:'clamp(15px,2.2vw,18px)', lineHeight:1.6, color:mkt.muted, maxWidth:560, margin:'0 auto 30px' }}>
          VangelClip turns your long videos into dozens of short, captioned clips so your best moments reach more people, on every platform, in minutes.
        </p>
        <div className="vc-hero-row">
          <div className="vc-hero-input">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={mkt.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <input
              type="url"
              value={heroUrl}
              onChange={e => setHeroUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startClipping()}
              placeholder="Paste a YouTube link to try free…"
              style={{ flex:1, minWidth:0, border:'none', outline:'none', background:'transparent', color:mkt.text, fontFamily:mkt.fontBody, fontSize:14.5, padding:'8px 0' }}
            />
          </div>
          <button onClick={startClipping} className="vc-hero-cta">Start Clipping Free →</button>
        </div>
        <p style={{ fontSize:13, color:mkt.muted, marginTop:14 }}>No card needed · First clip is on us. Try any link above.</p>
      </section>

      {/* ══ PHONE CLUSTER ══════════════════════════════════════════════════════ */}
      <div style={{ maxWidth:mkt.maxW, margin:'0 auto', padding:'0 28px 0', overflow:'hidden' }}>
        <div className="vc-phones">
          {PHONES.map((ph, i) => (
            <div key={ph.name} className={`vc-phone ${ph.cls}`} style={{ animationDelay:`${i*0.35}s` }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:`repeating-linear-gradient(135deg,${mkt.border} 0 1px,transparent 1px 11px)` }} />
              <div style={{ position:'absolute', top:10, left:'50%', transform:'translateX(-50%)', width:46, height:5, borderRadius:3, background:'rgba(0,0,0,0.25)', zIndex:3 }} />
              <div style={{ position:'absolute', top:'44%', left:'50%', transform:'translate(-50%,-50%)', width:30, height:30, borderRadius:'50%', background:mkt.brand, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4v16l13-8z"/></svg>
              </div>
              <div style={{ position:'absolute', left:10, bottom:12, right:10, zIndex:3, background:'linear-gradient(transparent,rgba(0,0,0,.55))', padding:'14px 6px 4px', borderRadius:'0 0 8px 8px' }}>
                <div style={{ display:'inline-block', background:mkt.brand, color:'#fff', fontSize:9, fontWeight:700, fontFamily:mkt.fontBody, padding:'2px 6px', borderRadius:3, marginBottom:6 }}>{ph.name}</div>
                <div style={{ fontFamily:mkt.fontHead, fontWeight:700, fontSize:13, color:'#fff', lineHeight:1.15 }}>{ph.cap}</div>
              </div>
            </div>
          ))}
          <div style={{ position:'absolute', left:'50%', top:'55%', transform:'translate(-50%,-50%)', width:720, height:400, background:`radial-gradient(closest-side,${mkt.brand2},transparent)`, opacity:0.12, filter:'blur(40px)', pointerEvents:'none', zIndex:0 }} />
        </div>
      </div>

      {/* ══ PLATFORM STRIP ══════════════════════════════════════════════════════ */}
      <div style={{ borderTop:`1px solid ${mkt.border}`, borderBottom:`1px solid ${mkt.border}`, background:mkt.surface2 }}>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 28px', textAlign:'center' }}>
          <div style={{ fontSize:12.5, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', color:mkt.muted, marginBottom:4 }}>Share your clips everywhere</div>
          <div style={{ fontSize:12, color:mkt.muted, opacity:.6, marginBottom:20 }}>Export once, made for every platform.</div>
          <div className="vc-logos">
            {/* YouTube */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <svg width="52" height="37" viewBox="0 0 38 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="38" height="27" rx="6" fill="#FF0000"/>
                <path d="M15.5 8.5L26.5 13.5L15.5 18.5V8.5Z" fill="white"/>
              </svg>
              <span style={{ fontSize:13, fontWeight:700, color:mkt.muted, opacity:.7, letterSpacing:'.02em' }}>YouTube</span>
            </div>
            {/* TikTok */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="27" height="27" rx="6" fill="#111111"/>
                <path d="M20.3 5.8a5.2 5.2 0 0 1-4.1-4.6V1h-3.7v14.7a3.1 3.1 0 0 1-3.1 2.7 3.1 3.1 0 0 1-3.1-3.1 3.1 3.1 0 0 1 3.1-3.1c.3 0 .6 0 .9.1V8.6a6.8 6.8 0 0 0-.9-.1 6.8 6.8 0 0 0-6.8 6.8 6.8 6.8 0 0 0 6.8 6.8 6.8 6.8 0 0 0 6.8-6.8V8.9a8.8 8.8 0 0 0 5.1 1.6V6.8a5.2 5.2 0 0 1-1.0.0z" fill="white"/>
              </svg>
              <span style={{ fontSize:13, fontWeight:700, color:mkt.muted, opacity:.7, letterSpacing:'.02em' }}>TikTok</span>
            </div>
            {/* Instagram */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="ig-grad" x1="0" y1="27" x2="27" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#f09433"/>
                    <stop offset="30%" stopColor="#e6683c"/>
                    <stop offset="55%" stopColor="#dc2743"/>
                    <stop offset="75%" stopColor="#cc2366"/>
                    <stop offset="100%" stopColor="#bc1888"/>
                  </linearGradient>
                </defs>
                <rect width="27" height="27" rx="7" fill="url(#ig-grad)"/>
                <rect x="3" y="3" width="21" height="21" rx="5.5" stroke="white" strokeWidth="1.6" fill="none"/>
                <circle cx="13.5" cy="13.5" r="4.5" stroke="white" strokeWidth="1.6" fill="none"/>
                <circle cx="19.5" cy="7.5" r="1.4" fill="white"/>
              </svg>
              <span style={{ fontSize:13, fontWeight:700, color:mkt.muted, opacity:.7, letterSpacing:'.02em' }}>Instagram</span>
            </div>
            {/* Spotify */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="13.5" cy="13.5" r="13.5" fill="#1ED760"/>
                <path d="M19.7 18.6c-.2.4-.7.5-1.1.3-3-1.8-6.7-2.2-11.1-1.2-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 4.8-1.1 8.9-.6 12.2 1.4.5.2.6.8.4 1.1-.0 0 0 0 0-.2zM21.1 15.5c-.3.5-.9.6-1.3.3-3.4-2.1-8.6-2.7-12.6-1.5-.5.2-1.1-.1-1.2-.6-.2-.5.1-1.1.6-1.2 4.6-1.4 10.3-.7 14.2 1.7.5.3.7.9.3 1.3zM21.2 12.3c-4.1-2.4-10.8-2.6-14.7-1.4-.6.2-1.2-.1-1.4-.7-.2-.6.1-1.2.7-1.4 4.5-1.4 11.9-1.1 16.6 1.6.6.3.8 1 .4 1.6-.3.5-1 .7-1.6.3z" fill="#191414"/>
              </svg>
              <span style={{ fontSize:13, fontWeight:700, color:mkt.muted, opacity:.7, letterSpacing:'.02em' }}>Spotify</span>
            </div>
            {/* Facebook */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <svg width="40" height="40" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="27" height="27" rx="6" fill="#1877F2"/>
                <path d="M17.5 3.5h-2.5C13.1 3.5 12 4.6 12 6.5V8.5H10v3h2v9h3.5v-9H17l.5-3h-2V6.8c0-.4.2-.8.8-.8H17.5V3.5z" fill="white"/>
              </svg>
              <span style={{ fontSize:13, fontWeight:700, color:mkt.muted, opacity:.7, letterSpacing:'.02em' }}>Facebook</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ WHY VANGELCLIP ═════════════════════════════════════════════════════ */}
      <section className="vc-sec" style={{ maxWidth:760 }}>
        <div style={{ fontSize:13, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:mkt.brand, marginBottom:18 }}>Why VangelClip?</div>
        <p style={{ fontFamily:mkt.fontHead, fontWeight:500, fontSize:'clamp(17px,2.5vw,25px)', lineHeight:1.45, letterSpacing:'-.01em', margin:0 }}>
          Rooted in <em style={{ color:mkt.brand }}>Evangel</em>, Greek for gospel, good news, the proclamation of truth. Joined with <em style={{ color:mkt.brand }}>Clip</em>, it names our purpose: take the world&apos;s most important messages, content or information and make them clip-ready for a generation that consumes content in seconds.
        </p>
      </section>

      {/* ══ DEMO VIDEO ═════════════════════════════════════════════════════════ */}
      <div style={{ background:mkt.surface2 }}>
        <section id="workflow" className="vc-sec">
          <div style={{ textAlign:'center', maxWidth:640, margin:'0 auto 36px' }}>
            <h2 style={{ fontFamily:mkt.fontHead, fontWeight:800, fontSize:'clamp(26px,4vw,38px)', letterSpacing:'-.02em', margin:'0 0 12px' }}>
              How&nbsp;<span style={{ fontStyle:'italic', color:mkt.brand }}>VangelClip Workflow Automation Works</span>
            </h2>
            <p style={{ fontSize:16, color:mkt.muted, margin:0, maxWidth:520, marginLeft:'auto', marginRight:'auto' }}>
              Watch a 90-second walkthrough — paste a link, let the AI clip, publish everywhere.
            </p>
          </div>
          <div style={{ maxWidth:880, margin:'0 auto' }}>
            <div style={{ position:'relative', aspectRatio:'16/9', borderRadius:`calc(${mkt.r} + 4px)`, overflow:'hidden', ...mktCard.base }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:`repeating-linear-gradient(135deg,${mkt.border} 0 1px,transparent 1px 16px)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
                <div style={{ width:66, height:66, borderRadius:'50%', background:mkt.brandGrad, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`inset 1px 1px 0 rgba(255,255,255,.25),${mkt.glow}` }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4v16l13-8z"/></svg>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:mkt.fontHead, fontWeight:700, fontSize:18, color:mkt.text }}>Add your demo video</div>
                  <div style={{ fontSize:13.5, color:mkt.muted, marginTop:4 }}>Paste a YouTube link in <code style={{ fontFamily:'monospace', color:mkt.brand }}>demoVideo</code> to embed it here</div>
                </div>
              </div>
              {/* Set src="" to a YouTube embed URL when your demo is ready */}
              <iframe src="" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:0, display:'none' }} />
            </div>
          </div>
        </section>
      </div>

      {/* ══ AFRICAN GAP STATS ══════════════════════════════════════════════════ */}
      <section className="vc-sec">
        <div style={{ textAlign:'center', maxWidth:680, margin:'0 auto 44px' }}>
          <h2 style={{ fontFamily:mkt.fontHead, fontWeight:800, fontSize:'clamp(26px,4vw,38px)', letterSpacing:'-.02em', margin:'0 0 16px' }}>
            Filling the <span style={{ fontStyle:'italic', color:mkt.brand }}>African Gap</span>
          </h2>
          <p style={{ fontSize:16.5, lineHeight:1.6, color:mkt.muted, margin:0 }}>
            Over 700 million internet users. African creators alone produce some of the most-watched gospel, creative, and educational content on earth. Yet no AI clipping platform was ever built thinking of them first. Until now.
          </p>
        </div>
        <div className="vc-stats">
          {STATS.map(s => (
            <div key={s.num} style={{ ...mktCard.base, padding:'26px 22px' }}>
              <div style={{ fontFamily:mkt.fontHead, fontWeight:800, fontSize:'clamp(26px,3.5vw,40px)', letterSpacing:'-.03em', color:mkt.brand, lineHeight:1 }}>{s.num}</div>
              <div style={{ fontSize:13.5, color:mkt.muted, marginTop:10, lineHeight:1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES — 2×2 image grid ══════════════════════════════════════════ */}
      <div style={{ background:mkt.surface2 }}>
        <section id="features" className="vc-sec">
          <div style={{ textAlign:'center', maxWidth:640, margin:'0 auto 46px' }}>
            <div style={{ fontSize:13, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:mkt.brand, marginBottom:14 }}>Everything you need</div>
            <h2 style={{ fontFamily:mkt.fontHead, fontWeight:800, fontSize:'clamp(26px,4vw,38px)', letterSpacing:'-.02em', margin:0 }}>
              Built to go <span style={{ fontStyle:'italic', color:mkt.brand }}>viral.</span>
            </h2>
          </div>
          <div className="vc-feat-grid">
            {FEATURE_IMGS.map((feat, i) => (
              <div key={feat.label} style={{ borderRadius:`calc(${mkt.r} + 4px)`, overflow:'hidden', border:`1px solid ${mkt.border}`, boxShadow:`inset 1px 1px 0 ${mkt.edge},${mkt.shadow}`, background:mkt.surface, aspectRatio:'16/9', position:'relative' }}>
                <Image
                  src={feat.src}
                  alt={feat.label}
                  fill
                  priority={i < 2}
                  sizes="(max-width:860px) 100vw, 50vw"
                  style={{ objectFit:'cover' }}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ══ PRICING ════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="vc-sec">
        <div style={{ textAlign:'center', maxWidth:640, margin:'0 auto 28px' }}>
          <div style={{ fontSize:13, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:mkt.brand, marginBottom:14 }}>Pricing</div>
          <h2 style={{ fontFamily:mkt.fontHead, fontWeight:800, fontSize:'clamp(26px,4vw,38px)', letterSpacing:'-.02em', margin:'0 0 12px' }}>
            Simple, transparent <span style={{ fontStyle:'italic', color:mkt.brand }}>pricing.</span>
          </h2>
          <p style={{ fontSize:16, color:mkt.muted, margin:0 }}>Start free. Upgrade when you&apos;re ready.</p>
        </div>

        {/* Toggle */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:9, marginBottom:42 }}>
          <div style={{ display:'inline-flex', background:mkt.surface, border:`1px solid ${mkt.border}`, borderRadius:100, padding:4, boxShadow:`inset 1px 1px 0 ${mkt.edge}` }}>
            <button onClick={() => setAnnual(false)} className={annual ? 'vc-pill-inactive' : 'vc-pill-active'}>Monthly</button>
            <button onClick={() => setAnnual(true)}  className={annual ? 'vc-pill-active'   : 'vc-pill-inactive'}>Annual</button>
          </div>
          <div style={{ fontSize:13, fontWeight:600, color:mkt.brand }}>Save ~20% with annual billing</div>
        </div>

        {/* Plan cards */}
        <div className="vc-plan-grid">
          {PLAN_DATA.map(plan => (
            <div key={plan.name} style={planCard(plan.popular)}>
              {plan.popular && (
                <div style={{ position:'absolute', top:0, left:'50%', transform:'translate(-50%,-50%)', background:mkt.brandGrad, color:'#fff', fontSize:11, fontWeight:700, letterSpacing:'.04em', padding:'5px 14px', borderRadius:100, boxShadow:mkt.glow, whiteSpace:'nowrap' }}>
                  MOST POPULAR
                </div>
              )}
              <h3 style={{ fontFamily:mkt.fontHead, fontWeight:800, fontSize:18, letterSpacing:'.02em', margin:'0 0 4px' }}>{plan.name.toUpperCase()}</h3>
              <p style={{ fontSize:13.5, color:mkt.muted, margin:'0 0 18px', minHeight:20 }}>{plan.tagline}</p>
              <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                <span style={{ fontFamily:mkt.fontHead, fontWeight:800, fontSize:42, letterSpacing:'-.03em' }}>
                  ${annual ? plan.annual : plan.monthly}
                </span>
                <span style={{ fontSize:15, color:mkt.muted, fontWeight:500 }}>/mo</span>
              </div>
              <div style={{ fontSize:12.5, color:mkt.muted, marginTop:5, minHeight:18 }}>
                {plan.monthly === 0
                  ? 'Free forever'
                  : annual
                    ? `Billed annually ($${plan.annual * 12}/yr)`
                    : 'Billed monthly'}
              </div>
              <button onClick={() => router.push('/auth?mode=signup')} style={planCta(plan.popular)}>{plan.cta}</button>
              <div style={{ height:1, background:mkt.border, margin:'22px 0' }} />
              <div style={{ fontSize:12, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:mkt.muted, marginBottom:14 }}>{plan.includes}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
                {plan.features.map(ft => (
                  <div key={ft} style={{ display:'flex', alignItems:'flex-start', gap:9, fontSize:14, lineHeight:1.4 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={mkt.brand} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>{ft}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign:'center', fontSize:13, color:mkt.muted, margin:'24px 0 0' }}>
          Minutes = total video length you process each month. Resets monthly. Cancel anytime.
        </p>

        {/* ── Collapsible feature comparison table ── */}
        <div style={{ maxWidth: 900, margin: '36px auto 0' }}>
          <button
            onClick={() => setTableOpen(o => !o)}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background: mkt.surface, border:`1px solid ${mkt.border}`, borderRadius: tableOpen ? '10px 10px 0 0' : '10px', padding:'16px 22px', cursor:'pointer', fontFamily:mkt.fontBody }}
          >
            <span style={{ fontSize:15, fontWeight:700, color:mkt.text }}>Compare all features</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={mkt.brand} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition:'transform 0.2s', transform: tableOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink:0 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {tableOpen && (
            <div style={{ background: mkt.surface, border:`1px solid ${mkt.border}`, borderTop:'none', borderRadius:'0 0 10px 10px', overflow:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:560 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign:'left', padding:'12px 16px', fontSize:12, fontWeight:600, color:mkt.muted, borderBottom:`1px solid ${mkt.border}` }}>Feature</th>
                    {PLAN_DATA.map(p => (
                      <th key={p.name} style={{ textAlign:'center', padding:'12px 16px', fontSize:13, fontWeight:700, color: p.popular ? mkt.brand : mkt.text, borderBottom:`1px solid ${mkt.border}` }}>{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_KEYS.map((key, i) => (
                    <tr key={key} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                      <td style={{ padding:'11px 16px', fontSize:13, color:mkt.muted, borderBottom: i < COMPARISON_KEYS.length - 1 ? `1px solid ${mkt.border}` : 'none' }}>{key}</td>
                      {PLAN_DATA.map(p => {
                        const v = p.comparison[key];
                        const isCheck = v === '✓';
                        const isDash  = v === '—';
                        const isSoon  = v === 'Coming soon';
                        return (
                          <td key={p.name} style={{ textAlign:'center', padding:'11px 16px', fontSize:13, borderBottom: i < COMPARISON_KEYS.length - 1 ? `1px solid ${mkt.border}` : 'none', color: isDash ? 'rgba(0,0,0,0.25)' : isCheck ? '#059669' : isSoon ? mkt.brand : mkt.text }}>
                            {isCheck
                              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              : isSoon
                                ? <span style={{ fontSize:11, fontWeight:600 }}>Soon</span>
                                : v}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth:740, margin:'60px auto 0' }}>
          <h3 style={{ fontFamily:mkt.fontHead, fontWeight:800, fontSize:'clamp(20px,3vw,26px)', letterSpacing:'-.02em', textAlign:'center', margin:'0 0 26px' }}>
            Frequently asked questions
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {FAQS.map((faq, i) => (
              <div key={faq.q} className="vc-faq" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14 }}>
                  <span style={{ fontFamily:mkt.fontHead, fontWeight:700, fontSize:15.5 }}>{faq.q}</span>
                  <span style={{ fontSize:20, color:mkt.brand, fontWeight:600, flexShrink:0, lineHeight:1 }}>{openFaq === i ? '–' : '+'}</span>
                </div>
                {openFaq === i && (
                  <p style={{ fontSize:14, lineHeight:1.6, color:mkt.muted, margin:'12px 0 0' }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth:mkt.maxW, margin:'30px auto 70px', padding:'0 28px' }}>
        <div style={{ position:'relative', overflow:'hidden', borderRadius:10, background:mkt.brandGrad, padding:'62px 40px', textAlign:'center', boxShadow:mkt.glow }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:"url('/cta-bg.svg')", backgroundSize:'cover', backgroundPosition:'center', backgroundRepeat:'no-repeat' }} />
          <h2 style={{ position:'relative', fontFamily:mkt.fontHead, fontWeight:800, fontSize:'clamp(26px,4vw,38px)', letterSpacing:'-.02em', color:'rgba(255,255,255,0.95)', margin:'0 0 12px' }}>
            Ready to Clip Your <span style={{ fontStyle:'italic' }}>Message?</span>
          </h2>
          <p style={{ position:'relative', fontSize:16, color:'rgba(255,255,255,0.72)', margin:'0 0 26px' }}>
            <b style={{ color:'rgba(255,255,255,0.96)' }}>Join thousands of African creators already using VangelClip.</b>
          </p>
          <div className="vc-cta-row" style={{ position:'relative' }}>
            <div className="vc-cta-input">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <input
                type="url"
                value={heroUrl}
                onChange={e => setHeroUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && startClipping()}
                placeholder="Paste a YouTube link to try free…"
                style={{ flex:1, minWidth:0, border:'none', outline:'none', background:'transparent', color:'#fff', fontFamily:mkt.fontBody, fontSize:14.5, padding:'9px 0' }}
              />
            </div>
            <button onClick={startClipping} className="vc-cta-btn">Start Clipping Free →</button>
          </div>
          <div style={{ position:'relative', fontSize:13, color:'rgba(255,255,255,.78)', marginTop:14 }}>
            No card needed · First clip is on us. Try any link above.
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop:`1px solid ${mkt.border}`, background:mkt.surface2 }}>
        <div style={{ maxWidth:mkt.maxW, margin:'0 auto', padding:'48px 28px' }}>
          <div className="vc-footer-g" style={{ marginBottom:40 }}>
            <div>
              <div style={{ fontFamily:mkt.fontHead, fontWeight:800, fontSize:20, marginBottom:8 }}>Vangel<span style={{ color:mkt.brand }}>Clip</span></div>
              <div style={{ fontWeight:600, fontSize:13.5, color:mkt.brand, marginBottom:10 }}>Clip. Spread. Transform.</div>
              <p style={{ fontSize:13, lineHeight:1.55, color:mkt.muted, margin:0, maxWidth:280 }}>Africa&apos;s AI clip platform for gospel creators, educators, and inspirational voices.</p>
            </div>
            {FOOTER_COLS.map(col => (
              <div key={col.heading}>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>{col.heading}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:9, fontSize:13.5, color:mkt.muted }}>
                  {col.items.map(item => <a key={item.l} href={item.h} style={{ color:mkt.muted, textDecoration:'none' }}>{item.l}</a>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop:`1px solid ${mkt.border}`, textAlign:'center', padding:'18px 0 0', fontSize:12.5, color:mkt.muted }}>
            © 2026 VangelClip. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
