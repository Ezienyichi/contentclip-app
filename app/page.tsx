"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ═══ DATA ═══ */
const PLANS = [
  { id: "free", name: "Free", credits: "30 daily", price: 0, priceY: 0, pop: false, features: ["30 credits/day (~5 videos)", "AI virality scoring", "720p export", "Watermarked output", "2 credits to remove watermark", "Basic captions", "Community support"] },
  { id: "starter", name: "Starter", credits: "100/mo", price: 9, priceY: 86, pop: false, features: ["100 credits/month", "AI hook detection", "1080p export", "No watermark", "3 editing styles", "Email support", "1 brand kit"] },
  { id: "creator", name: "Creator", credits: "300/mo", price: 19, priceY: 182, pop: true, features: ["300 credits/month", "All 6 AI editing styles", "1080p 60fps export", "B-Roll insertion", "Filler word removal", "All transitions", "3 brand kits", "Priority support"] },
  { id: "business", name: "Business", credits: "1,000/mo", price: 49, priceY: 470, pop: false, features: ["1,000 credits/month", "4K 60fps export", "Voice cloning", "20+ languages", "Premiere/DaVinci XML", "5 team seats", "Unlimited brand kits", "Dedicated manager", "API access"] },
];

const STYLES = [
  { name: "Cinematic", desc: "Dramatic pacing, cinematic bars, film grain overlay, slow transitions for impactful storytelling.", emoji: "\u{1F3AC}", color: "#8B5CF6" },
  { name: "Energetic", desc: "Fast cuts, zoom effects, screen shake, bold text \u2014 built for high-energy content.", emoji: "\u26A1", color: "#EF4444" },
  { name: "Minimal Clean", desc: "Whitespace-forward, soft typography, gentle fades. Ideal for education and wellness.", emoji: "\u2728", color: "#6B7280" },
  { name: "Podcast Pro", desc: "Waveform visualizer, speaker tracking, side-by-side layout for audio-first content.", emoji: "\u{1F399}\uFE0F", color: "#F59E0B" },
  { name: "Social Native", desc: "Platform-native feel with trending overlays and engagement-optimized pacing.", emoji: "\u{1F4F1}", color: "#EC4899" },
  { name: "Corporate", desc: "Clean transitions, lower-thirds, branded templates. Meeting compliance ready.", emoji: "\u{1F3E2}", color: "#3B82F6" },
];

const INDUSTRIES = [
  { name: "Content Creators", desc: "Turn one long video into a month of short-form content. AI finds your best hooks automatically.", icon: "\u{1F3AC}" },
  { name: "Media & Entertainment", desc: "Repurpose interviews and press clips into platform-optimized content at scale.", icon: "\u{1F4FA}" },
  { name: "Marketing Teams", desc: "Generate campaign assets from webinars and product demos. A/B test hooks with AI.", icon: "\u{1F4CA}" },
  { name: "Podcasters", desc: "Every episode becomes 15-30 clips. AI detects quotable moments and tracks speakers.", icon: "\u{1F399}\uFE0F" },
  { name: "Agencies & Studios", desc: "White-label clip production. Brand kits, team seats, and batch processing.", icon: "\u{1F3E2}" },
  { name: "Livestreamers", desc: "AI monitors your VODs for highlights, rage clips, and clutch plays.", icon: "\u{1F3AE}" },
  { name: "Advertisers", desc: "Transform long-form ad creative into 15/30/60-second cuts per platform.", icon: "\u{1F4E2}" },
  { name: "Churches & Ministries", desc: "Clip sermons and worship moments into shareable devotionals.", icon: "\u26EA" },
  { name: "E-Commerce Brands", desc: "Turn product demos into shoppable shorts. AI adds CTAs automatically.", icon: "\u{1F6D2}" },
  { name: "Real Estate Agents", desc: "Convert walkthroughs into platform-ready tours with listing overlays.", icon: "\u{1F3E0}" },
];

const EXPORTS = [
  { name: "MP4", desc: "Universal. Best for social." },
  { name: "MOV", desc: "Apple ProRes quality." },
  { name: "WebM", desc: "Web-optimized. Smaller." },
  { name: "GIF", desc: "Animated previews." },
  { name: "Premiere XML", desc: "Adobe Premiere Pro." },
  { name: "DaVinci XML", desc: "DaVinci Resolve." },
  { name: "SRT", desc: "Standard subtitles." },
  { name: "VTT", desc: "Web Video Text." },
];

const TUTORIALS = [
  { title: "Getting Started", desc: "Upload your first video and generate AI clips in under 5 minutes.", dur: "4:32", bg: "linear-gradient(135deg,#7C3AED,#A78BFA)" },
  { title: "AI Editing Styles", desc: "Learn when to use Cinematic vs Energetic vs Social Native.", dur: "7:15", bg: "linear-gradient(135deg,#EC4899,#F472B6)" },
  { title: "Brand Kit Setup", desc: "Save your logo, colors, intro/outro for one-click branding.", dur: "5:48", bg: "linear-gradient(135deg,#F59E0B,#FBBF24)" },
  { title: "Multi-Platform Publishing", desc: "Auto-publish to YouTube Shorts, TikTok, Instagram, LinkedIn.", dur: "6:22", bg: "linear-gradient(135deg,#10B981,#34D399)" },
  { title: "Virality Scores", desc: "How our AI predicts engagement and ranks your clips.", dur: "8:05", bg: "linear-gradient(135deg,#3B82F6,#60A5FA)" },
  { title: "Pro Export Workflows", desc: "Export Premiere XML, DaVinci XML, SRT, and 4K 60fps.", dur: "5:10", bg: "linear-gradient(135deg,#EF4444,#F87171)" },
];

const TESTIMONIALS = [
  { name: "Sarah Chen", role: "Podcast Host \u00B7 340K subs", text: "HelpEdit turned my weekly podcast into a content machine. One episode gives me 25+ clips. My TikTok grew from 2K to 180K in 3 months.", metric: "+8900%", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
  { name: "Marcus Johnson", role: "YouTube Creator \u00B7 1.2M subs", text: "The AI virality scoring is scary accurate. I only post clips scored 85+ and my average views went from 50K to 400K per Short.", metric: "8x views", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
  { name: "Emma Rodriguez", role: "Agency Owner \u00B7 23 clients", text: "We replaced 3 full-time editors with HelpEdit. Saved \u00A3180K in the first year.", metric: "\u00A3180K saved", avatar: "https://randomuser.me/api/portraits/women/68.jpg" },
];

/* ═══ STYLES OBJECT ═══ */
const s = {
  wrap: { maxWidth: 1140, margin: "0 auto", padding: "0 20px" } as React.CSSProperties,
  section: { padding: "80px 0" } as React.CSSProperties,
  sectionAlt: { padding: "80px 0", background: "#161B33", borderTop: "1px solid rgba(255,255,255,.06)", borderBottom: "1px solid rgba(255,255,255,.06)" } as React.CSSProperties,
  center: { textAlign: "center" } as React.CSSProperties,
  heading: { fontFamily: "Newsreader, Georgia, serif", fontWeight: 800, color: "#F4F4F6", lineHeight: 1.15, margin: "12px 0 8px" } as React.CSSProperties,
  subtext: { color: "#9B9EAA", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 } as React.CSSProperties,
  card: { background: "#101428", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: 24, transition: "all .3s" } as React.CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 } as React.CSSProperties,
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 } as React.CSSProperties,
  grid4: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 } as React.CSSProperties,
  btn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all .25s", textDecoration: "none" } as React.CSSProperties,
  purple: "#7C3AED",
  purpleL: "#A78BFA",
};

/* ═══ CHECK ICON ═══ */
const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" style={{ width: 15, height: 15, flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" strokeWidth="1" style={{ width: 14, height: 14 }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
  </svg>
);

export default function HomePage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    // Check auth
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) setUser({ email: session.user.email || "" });
      } catch { /* no supabase */ }
    })();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0B0E1A" }}>
      {/* ═══ NAVBAR ═══ */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 20px", transition: "all .3s", ...(scrolled ? { background: "rgba(11,14,26,.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.06)" } : {}) }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#7C3AED,#5B21B6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" style={{ width: 17, height: 17 }}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>
            </div>
            <span style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: 20, fontWeight: 800, color: "#F4F4F6" }}>HelpEdit</span>
          </Link>

          {/* Desktop nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 28 }} className="hide-mobile">
            {["Features", "Solutions", "How It Works", "Pricing"].map(t => (
              <a key={t} href={`#${t.toLowerCase().replace(/ /g, "")}`} style={{ fontSize: 13, fontWeight: 500, color: "#9B9EAA", transition: "color .2s" }}>{t}</a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {user ? (
              <Link href="/dashboard" style={{ ...s.btn, padding: "9px 20px", fontSize: 13, background: "linear-gradient(135deg,#7C3AED,#5B21B6)", color: "#fff", borderRadius: 12 }}>Dashboard</Link>
            ) : (
              <>
                <Link href="/auth" style={{ ...s.btn, padding: "9px 18px", fontSize: 13, border: "1px solid rgba(255,255,255,.12)", color: "#E8E9ED", borderRadius: 12 }} className="hide-mobile">Log in</Link>
                <Link href="/auth?mode=signup" style={{ ...s.btn, padding: "9px 18px", fontSize: 13, background: "linear-gradient(135deg,#7C3AED,#5B21B6)", color: "#fff", borderRadius: 12 }}>Get Started</Link>
              </>
            )}
            {/* Hamburger */}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="show-mobile" style={{ display: "none", padding: 4 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#E8E9ED" strokeWidth="2" strokeLinecap="round" style={{ width: 22, height: 22 }}>
                {mobileMenu ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(11,14,26,.97)", backdropFilter: "blur(20px)", padding: "80px 20px 20px", overflowY: "auto" }}>
          {["Features", "Solutions", "How It Works", "Pricing"].map(t => (
            <a key={t} href={`#${t.toLowerCase().replace(/ /g, "")}`} onClick={() => setMobileMenu(false)} style={{ display: "block", fontSize: 18, fontWeight: 600, color: "#E8E9ED", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>{t}</a>
          ))}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/auth?mode=signup" onClick={() => setMobileMenu(false)} style={{ ...s.btn, justifyContent: "center", background: "linear-gradient(135deg,#7C3AED,#5B21B6)", color: "#fff" }}>Get Started Free</Link>
            <Link href="/auth" onClick={() => setMobileMenu(false)} style={{ ...s.btn, justifyContent: "center", border: "1px solid rgba(255,255,255,.12)", color: "#E8E9ED" }}>Log In</Link>
          </div>
        </div>
      )}

      {/* ═══ HERO ═══ */}
      <section style={{ paddingTop: 120, paddingBottom: 80, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -200, right: -200, width: 500, height: 500, background: "radial-gradient(circle, rgba(124,58,237,.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={s.wrap}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }} className="hero-grid">
            <div className="animate-fade-up">
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999, background: "rgba(124,58,237,.15)", border: "1px solid rgba(124,58,237,.25)", fontSize: 11, fontWeight: 600, color: "#A78BFA", marginBottom: 20 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399" }} className="animate-pulse-dot" /> AI-Powered Video Production
              </div>
              <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontFamily: "Newsreader, Georgia, serif", fontWeight: 800, color: "#F4F4F6", lineHeight: 1.1, marginBottom: 16 }}>
                Edit smarter.<br /><span className="gradient-text">Grow faster.</span>
              </h1>
              <p style={{ fontSize: "clamp(14px, 1.5vw, 16px)", color: "#9B9EAA", lineHeight: 1.7, maxWidth: 460, marginBottom: 24 }}>
                AI transforms your long-form videos into viral short-form clips. Hook detection, auto-captions, smart reframing, and B-Roll — all optimized for maximum engagement in under 5 minutes.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {["AI finds your best hooks and viral moments automatically", "6 AI editing styles — Cinematic, Energetic, Podcast Pro & more", "Auto-publish to YouTube, TikTok, Instagram, LinkedIn"].map(t => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#9B9EAA" }}>
                    <Check /> {t}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/auth?mode=signup" style={{ ...s.btn, background: "linear-gradient(135deg,#7C3AED,#5B21B6)", color: "#fff", boxShadow: "0 4px 18px rgba(124,58,237,.3)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 17, height: 17 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> Try It Free
                </Link>
                <a href="#howitworks" style={{ ...s.btn, border: "1px solid rgba(255,255,255,.12)", color: "#E8E9ED" }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 17, height: 17 }}><polygon points="5 3 19 12 5 21" /></svg> See How It Works
                </a>
              </div>
            </div>

            {/* Hero mockup */}
            <div style={{ position: "relative" }} className="animate-fade-up hero-mockup-wrap">
              <div style={{ background: "#101428", border: "1px solid rgba(255,255,255,.06)", borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28CA41" }} />
                  <span style={{ fontSize: 11, color: "#6E7282", marginLeft: 8, fontFamily: "monospace" }}>HelpEdit AI Dashboard</span>
                </div>
                <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[{ l: "AI CLIPS", v: "2,847", c: "#F4F4F6" }, { l: "AVG VIRALITY", v: "87.3", c: "#34D399" }, { l: "TIME SAVED", v: "142h", c: "#F4F4F6" }, { l: "VIEWS GAINED", v: "4.2M", c: "#A78BFA" }].map(d => (
                    <div key={d.l} style={{ background: "#161B33", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 10, color: "#6E7282", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{d.l}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: d.c }}>{d.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="animate-float" style={{ position: "absolute", top: -8, right: -16, background: "#101428", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: "8px 14px", boxShadow: "0 8px 28px rgba(0,0,0,.4)", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#34D399" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 14, height: 14 }}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg> +340% growth
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section style={s.section} id="features">
        <div style={{ ...s.wrap, ...s.center, marginBottom: 40 }}>
          <span className="section-label">AI Features</span>
          <h2 style={{ ...s.heading, fontSize: "clamp(24px, 3.5vw, 38px)" }}>AI-powered tools that maximize your views.</h2>
          <p style={{ ...s.subtext, fontSize: 15 }}>Every feature is optimized by AI to detect hooks, increase engagement, and help your content go viral.</p>
        </div>
        <div style={s.wrap}>
          {/* Wide card */}
          <div style={{ ...s.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "center", marginBottom: 14 }} className="feature-wide-card">
            <div>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(124,58,237,.15)", border: "1px solid rgba(124,58,237,.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" style={{ width: 20, height: 20 }}><path d="M12 2l2.09 6.26L20.18 10l-6.09 1.74L12 18l-2.09-6.26L3.82 10l6.09-1.74z" /></svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#F4F4F6", marginBottom: 8 }}>AI Hook Detection & Virality Scoring</h3>
              <p style={{ fontSize: 14, color: "#9B9EAA", lineHeight: 1.7 }}>Our AI analyzes speech patterns, emotional peaks, and audience retention signals to identify viral moments. Each clip gets a Virality Score (0\u2013100) so you only post content that maximizes reach.</p>
            </div>
            <div style={{ background: "#161B33", borderRadius: 12, padding: 20, fontFamily: "monospace", fontSize: 12 }}>
              {[{ l: "AI Clip #1", v: 94, c: "#34D399" }, { l: "AI Clip #2", v: 91, c: "#34D399" }, { l: "AI Clip #3", v: 76, c: "#FBBF24" }].map(c => (
                <div key={c.l} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: "#6E7282" }}>{c.l}</span><span style={{ fontWeight: 700, color: c.c }}>Score: {c.v}</span></div>
                  <div style={{ height: 6, background: "#1E2440", borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${c.v}%`, height: "100%", background: `linear-gradient(90deg, #7C3AED, ${c.c})`, borderRadius: 3 }} /></div>
                </div>
              ))}
            </div>
          </div>
          {/* Feature grid */}
          <div style={s.grid2}>
            {[
              { t: "AI-Powered Captions", d: "6 styles \u2014 Bold, Minimal, Karaoke, Dynamic, Custom, Subtitles. 99.2% accuracy in 21 languages." },
              { t: "Smart Auto-Reframing", d: "AI tracks speakers and auto-crops for 9:16, 1:1, 4:5, and 16:9. Every platform covered." },
              { t: "AI B-Roll Insertion", d: "AI analyzes your transcript and auto-inserts relevant stock footage with smooth transitions." },
              { t: "AI Filler Removal", d: "Detects and removes \"um,\" \"uh,\" long pauses, and dead air with seamless crossfades." },
              { t: "One-Click Brand Kit", d: "Save logo, colors, fonts, intro/outro. AI applies your brand identity consistently." },
              { t: "Voice Cloning & Translation", d: "Clone your voice in 20+ languages. Natural-sounding narration for global audiences." },
            ].map(f => (
              <div key={f.t} className="he-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F4F4F6", marginBottom: 6 }}>{f.t}</h3>
                <p style={{ fontSize: 13, color: "#9B9EAA", lineHeight: 1.65 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AI STYLES ═══ */}
      <section style={s.sectionAlt} id="styles">
        <div style={{ ...s.wrap, ...s.center, marginBottom: 36 }}>
          <span className="section-label">AI Editing Styles</span>
          <h2 style={{ ...s.heading, fontSize: "clamp(24px, 3.5vw, 38px)" }}>6 AI styles. Pick one or let AI choose.</h2>
          <p style={{ ...s.subtext, fontSize: 15 }}>Each style is auto-applied based on your content, or choose manually for full creative control.</p>
        </div>
        <div style={s.wrap}>
          <div style={s.grid2}>
            {STYLES.map(st => (
              <div key={st.name} className="he-card" style={{ padding: 24, textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24, background: st.color + "18", border: `1px solid ${st.color}35` }}>{st.emoji}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F4F4F6", marginBottom: 6 }}>{st.name}</h3>
                <p style={{ fontSize: 13, color: "#9B9EAA", lineHeight: 1.6 }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ INDUSTRY SOLUTIONS ═══ */}
      <section style={s.section} id="solutions">
        <div style={{ ...s.wrap, ...s.center, marginBottom: 36 }}>
          <span className="section-label">Industry Solutions</span>
          <h2 style={{ ...s.heading, fontSize: "clamp(24px, 3.5vw, 38px)" }}>Built for every content industry.</h2>
        </div>
        <div style={s.wrap}>
          <div style={s.grid3}>
            {INDUSTRIES.map(ind => (
              <div key={ind.name} className="he-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{ind.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F4F4F6", marginBottom: 4 }}>{ind.name}</h3>
                <p style={{ fontSize: 12, color: "#9B9EAA", lineHeight: 1.6 }}>{ind.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROCESS ═══ */}
      <section style={s.sectionAlt} id="howitworks">
        <div style={{ ...s.wrap, ...s.center, marginBottom: 36 }}>
          <span className="section-label">Process</span>
          <h2 style={{ ...s.heading, fontSize: "clamp(24px, 3.5vw, 38px)" }}>Why thousands trust HelpEdit&apos;s AI.</h2>
        </div>
        <div style={s.wrap}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {[
              { n: "01", t: "Upload or paste URL", d: "Drop any video or paste a YouTube, Vimeo, or TikTok link. Up to 4 hours." },
              { n: "02", t: "AI analyzes & clips", d: "Transcription, hook detection, virality scoring \u2014 all automated in under 5 minutes." },
              { n: "03", t: "AI enhances automatically", d: "Captions, reframing, B-Roll, filler removal, editing style, and brand kit applied." },
              { n: "04", t: "Download & publish", d: "Preview clips ranked by virality. Download or auto-publish everywhere." },
            ].map(step => (
              <div key={step.n} style={{ ...s.card, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #7C3AED, #A78BFA)" }} />
                <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "#A78BFA", marginBottom: 12 }}>Step {step.n}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F4F4F6", marginBottom: 6 }}>{step.t}</h3>
                <p style={{ fontSize: 13, color: "#9B9EAA", lineHeight: 1.6 }}>{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ EXPORTS ═══ */}
      <section style={s.section}>
        <div style={{ ...s.wrap, ...s.center, marginBottom: 28 }}>
          <span className="section-label">Export Formats</span>
          <h2 style={{ ...s.heading, fontSize: "clamp(24px, 3.5vw, 38px)" }}>Export in any format. Any quality.</h2>
          <p style={{ fontSize: 13, color: "#6E7282", marginTop: 6 }}>720p &middot; 1080p &middot; 4K &nbsp;|&nbsp; 24fps &middot; 30fps &middot; 60fps</p>
        </div>
        <div style={s.wrap}><div style={s.grid4}>
          {EXPORTS.map(e => (
            <div key={e.name} style={{ background: "#101428", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#A78BFA", marginBottom: 4 }}>{e.name}</div>
              <p style={{ fontSize: 11, color: "#6E7282" }}>{e.desc}</p>
            </div>
          ))}
        </div></div>
      </section>

      {/* ═══ STATS ═══ */}
      <div style={{ padding: "48px 0", background: "#161B33", borderTop: "1px solid rgba(255,255,255,.06)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={s.wrap}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, textAlign: "center" }}>
            {[{ v: "50,000+", l: "Active Creators" }, { v: "12M+", l: "AI Clips Generated" }, { v: "97.3%", l: "Caption Accuracy" }, { v: "<5 min", l: "Processing Time" }].map(st => (
              <div key={st.l}>
                <div style={{ fontSize: "clamp(24px, 3vw, 38px)", fontFamily: "Newsreader, Georgia, serif", fontWeight: 800, color: "#F4F4F6" }}>{st.v}</div>
                <div style={{ fontSize: 12, color: "#6E7282", marginTop: 4 }}>{st.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ TESTIMONIALS ═══ */}
      <section style={s.section}>
        <div style={{ ...s.wrap, ...s.center, marginBottom: 36 }}>
          <span className="section-label">Testimonials</span>
          <h2 style={{ ...s.heading, fontSize: "clamp(24px, 3.5vw, 38px)" }}>Loved by creators worldwide.</h2>
        </div>
        <div style={s.wrap}><div style={s.grid2}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ ...s.card, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #7C3AED, transparent)" }} />
              <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>{Array(5).fill(0).map((_, i) => <StarIcon key={i} />)}</div>
              <p style={{ fontSize: 14, color: "#E8E9ED", lineHeight: 1.7, marginBottom: 16 }}>&ldquo;{t.text}&rdquo;</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={t.avatar} alt={t.name} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(124,58,237,.25)" }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#F4F4F6" }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "#6E7282" }}>{t.role}</div>
                </div>
                <span style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 600, background: "rgba(52,211,153,.1)", color: "#34D399", border: "1px solid rgba(52,211,153,.2)" }}>{t.metric}</span>
              </div>
            </div>
          ))}
        </div></div>
      </section>

      {/* ═══ TRY IT ═══ */}
      <section style={s.section}>
        <div style={{ ...s.wrap, ...s.center, marginBottom: 28 }}>
          <span className="section-label">Try It</span>
          <h2 style={{ ...s.heading, fontSize: "clamp(24px, 3.5vw, 38px)" }}>See AI in action.</h2>
          <p style={{ ...s.subtext, fontSize: 15 }}>Upload a video file or paste a YouTube, Vimeo, or TikTok URL. No sign-up needed to preview.</p>
        </div>
        <div style={{ ...s.wrap, maxWidth: 640 }}>
          <div style={{ ...s.card, textAlign: "center", border: "2px dashed rgba(124,58,237,.25)" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(124,58,237,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" style={{ width: 26, height: 26 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#F4F4F6", marginBottom: 6 }}>Drop your video here</h3>
            <p style={{ fontSize: 14, color: "#9B9EAA", marginBottom: 16 }}>MP4, MOV, AVI \u2014 up to 4 hours</p>
            <input type="file" accept="video/*" id="vidUpload" style={{ display: "none" }} onChange={() => { window.location.href = "/auth?mode=signup"; }} />
            <button onClick={() => document.getElementById("vidUpload")?.click()} style={{ ...s.btn, background: "linear-gradient(135deg,#7C3AED,#5B21B6)", color: "#fff", padding: "12px 24px", fontSize: 14, borderRadius: 12 }}>Choose Video File</button>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }} className="url-input-row">
              <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Or paste YouTube / Vimeo / TikTok URL..."
                style={{ flex: 1, padding: "10px 14px", background: "#1A1F35", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, color: "#E8E9ED", fontSize: 13 }} />
              <button onClick={() => { if (!videoUrl.trim()) { alert("Paste a URL first"); return; } window.location.href = "/auth?mode=signup"; }}
                style={{ ...s.btn, background: "linear-gradient(135deg,#7C3AED,#5B21B6)", color: "#fff", padding: "10px 20px", fontSize: 13, borderRadius: 12, flexShrink: 0 }}>Process</button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TUTORIALS ═══ */}
      <section style={s.sectionAlt}>
        <div style={{ ...s.wrap, ...s.center, marginBottom: 36 }}>
          <span className="section-label">Tutorials</span>
          <h2 style={{ ...s.heading, fontSize: "clamp(24px, 3.5vw, 38px)" }}>Learn HelpEdit in minutes.</h2>
        </div>
        <div style={s.wrap}><div style={s.grid2}>
          {TUTORIALS.map(t => (
            <div key={t.title} className="he-card" style={{ overflow: "hidden", cursor: "pointer", padding: 0 }}>
              <div style={{ width: "100%", height: 160, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <svg viewBox="0 0 24 24" fill="white" style={{ width: 36, height: 36, opacity: .9 }}><polygon points="5 3 19 12 5 21" /></svg>
                <span style={{ position: "absolute", bottom: 8, right: 8, padding: "2px 8px", borderRadius: 6, background: "rgba(0,0,0,.6)", fontSize: 11, fontWeight: 600, fontFamily: "monospace", color: "#fff" }}>{t.dur}</span>
              </div>
              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F4F4F6", marginBottom: 4 }}>{t.title}</h3>
                <p style={{ fontSize: 12, color: "#9B9EAA", lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div></div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section style={s.section} id="pricing">
        <div style={{ ...s.wrap, ...s.center }}>
          <span className="section-label">Pricing</span>
          <h2 style={{ ...s.heading, fontSize: "clamp(24px, 3.5vw, 38px)" }}>Affordable. Creator-friendly.</h2>
          <p style={{ fontSize: 13, color: "#6E7282", marginTop: 4 }}>Start free. Upgrade when ready. Cancel anytime.</p>
          <div style={{ display: "inline-flex", padding: 3, borderRadius: 999, background: "#101428", border: "1px solid rgba(255,255,255,.06)", margin: "20px 0 40px" }}>
            <button onClick={() => setBilling("monthly")} style={{ padding: "8px 20px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: billing === "monthly" ? "#7C3AED" : "transparent", color: billing === "monthly" ? "#fff" : "#6E7282", border: "none", cursor: "pointer", transition: "all .2s" }}>Monthly</button>
            <button onClick={() => setBilling("yearly")} style={{ padding: "8px 20px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: billing === "yearly" ? "#7C3AED" : "transparent", color: billing === "yearly" ? "#fff" : "#6E7282", border: "none", cursor: "pointer", transition: "all .2s" }}>Yearly <span style={{ opacity: .7 }}>-20%</span></button>
          </div>
        </div>
        <div style={s.wrap}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
            {PLANS.map(p => (
              <div key={p.id} style={{ ...s.card, position: "relative", ...(p.pop ? { borderColor: "rgba(124,58,237,.25)", boxShadow: "0 0 40px rgba(124,58,237,.1)", transform: "scale(1.02)" } : {}) }}>
                {p.pop && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "4px 14px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: "#7C3AED", color: "#fff", whiteSpace: "nowrap" }}>Most Popular</div>}
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#F4F4F6", marginBottom: 4 }}>{p.name}</h3>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#A78BFA", marginBottom: 14 }}>{p.credits} credits</div>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: "clamp(28px, 3.5vw, 38px)", fontWeight: 800, color: "#F4F4F6" }}>${billing === "monthly" ? p.price : Math.round(p.priceY / 12)}</span>
                  {p.price > 0 && <span style={{ fontSize: 13, color: "#6E7282" }}>/mo</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#9B9EAA" }}>
                      <Check /> <span>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href={p.price === 0 ? "/auth?mode=signup" : "/auth?mode=signup"} style={{ ...s.btn, width: "100%", justifyContent: "center", padding: "12px 20px", fontSize: 14, borderRadius: 12, ...(p.pop ? { background: "linear-gradient(135deg,#7C3AED,#5B21B6)", color: "#fff" } : { border: "1px solid rgba(255,255,255,.12)", color: "#E8E9ED" }) }}>
                  {p.price === 0 ? "Start Free" : p.id === "business" ? "Contact Sales" : "Upgrade Now"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ padding: "80px 0" }}>
        <div style={s.wrap}>
          <div style={{ background: "linear-gradient(135deg, #5B21B6, #161B33)", border: "1px solid rgba(124,58,237,.25)", borderRadius: 24, padding: "clamp(40px, 5vw, 64px)", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <h2 style={{ ...s.heading, fontSize: "clamp(24px, 3.5vw, 38px)" }}>Let AI build your content engine.</h2>
            <p style={{ fontSize: 15, color: "#9B9EAA", maxWidth: 420, margin: "10px auto 24px", lineHeight: 1.7 }}>30 free daily credits. No credit card. See why 50,000+ creators trust HelpEdit&apos;s AI.</p>
            <Link href="/auth?mode=signup" style={{ ...s.btn, background: "linear-gradient(135deg,#7C3AED,#5B21B6)", color: "#fff", boxShadow: "0 4px 18px rgba(124,58,237,.3)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 17, height: 17 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> Start Creating Free
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: "48px 20px 20px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 28, marginBottom: 28 }} className="footer-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7C3AED,#5B21B6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" style={{ width: 14, height: 14 }}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /></svg>
              </div>
              <span style={{ fontFamily: "Newsreader, Georgia, serif", fontSize: 17, fontWeight: 800, color: "#F4F4F6" }}>HelpEdit</span>
            </div>
            <p style={{ fontSize: 12, color: "#6E7282", lineHeight: 1.6, maxWidth: 240 }}>AI-powered short-form video production for creators, podcasters, and agencies.</p>
          </div>
          {[{ t: "Company", ls: ["About", "Blog", "Careers", "Contact"] }, { t: "Support", ls: ["Docs", "Tutorials", "FAQ", "Help"] }, { t: "Legal", ls: ["Terms", "Privacy", "GDPR", "Security"] }].map(col => (
            <div key={col.t}>
              <h4 style={{ fontSize: 10, fontWeight: 700, color: "#F4F4F6", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1.5 }}>{col.t}</h4>
              {col.ls.map(l => <a key={l} href="#" style={{ display: "block", fontSize: 12, color: "#6E7282", marginBottom: 6 }}>{l}</a>)}
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.06)", fontSize: 10, color: "#6E7282" }}>&copy; 2026 HelpEdit. Built by TechDuce Africa.</div>
      </footer>

      {/* ═══ RESPONSIVE CSS ═══ */}
      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-mockup-wrap { order: -1; }
          .feature-wide-card { grid-template-columns: 1fr !important; }
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .url-input-row { flex-direction: column; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
