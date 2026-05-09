'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { colors, gradients, radius, shadows } from '@/lib/tokens';

const BLOG_POSTS = [
  {
    date: 'May 2026',
    tag: 'Product',
    title: 'How African Pastors Are Reaching Millions with AI Clips',
    excerpt: 'VangelClip users in Lagos, Accra, and Nairobi are turning 1-hour Sunday sermons into viral short clips that reach 10x their congregation size online.',
    color: '#7c3aed',
  },
  {
    date: 'April 2026',
    tag: 'Education',
    title: 'The Science of the 60-Second Hook: Why Short Clips Dominate',
    excerpt: 'Research shows viewers decide whether to keep watching within the first 3 seconds. Here\'s how VangelClip\'s AI identifies those critical moments automatically.',
    color: '#06b6d4',
  },
  {
    date: 'March 2026',
    tag: 'Creator Story',
    title: 'From 500 Views to 2 Million: Mama Zola\'s Gospel Journey',
    excerpt: 'A Durban gospel artist used VangelClip to transform her YouTube channel from a local ministry into a globally watched worship destination.',
    color: '#10b981',
  },
];

export default function AboutPage() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportType, setSupportType] = useState('general');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  function handleSupport(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`VangelClip Support: ${supportType}`);
    const body = encodeURIComponent(`Name: ${supportName}\nEmail: ${supportEmail}\nType: ${supportType}\n\n${supportMessage}`);
    window.location.href = `mailto:adminvangelclip@gmail.com?subject=${subject}&body=${body}`;
    setSupportSent(true);
  }

  useEffect(() => {
    const t = setInterval(() => setSlide(p => (p + 1) % 4), 3800);
    return () => clearInterval(t);
  }, []);

  const slides = [
    { src: '/carousel-1.png', label: 'Content Creator',     name: 'African creators leading'  },
    { src: '/carousel-2.png', label: 'Field Creator',       name: 'Content on the go'          },
    { src: '/carousel-3.png', label: 'Gospel & Worship',    name: 'Faith in motion'            },
    { src: '/carousel-4.png', label: 'Podcast & Education', name: 'Voices that inspire'        },
  ];

  const cardPos = [
    { w:'280px', h:'380px', top:'60px',  left:'50%', tx:'-50%',  z:4, op:1,    rot:0,  bright:1,    shadow:'0 24px 64px rgba(124,58,237,.45)', border:'1px solid rgba(124,58,237,.6)' },
    { w:'210px', h:'300px', top:'95px',  left:'67%', tx:'0',     z:3, op:0.75, rot:7,  bright:0.65, shadow:'none', border:'none' },
    { w:'175px', h:'255px', top:'125px', left:'78%', tx:'0',     z:2, op:0.42, rot:12, bright:0.4,  shadow:'none', border:'none' },
    { w:'190px', h:'275px', top:'110px', left:'16%', tx:'-16%',  z:1, op:0.52, rot:-8, bright:0.48, shadow:'none', border:'none' },
  ];

  function go(n: number) {
    setSlide(((n % 4) + 4) % 4);
  }

  return (
    <div style={{ background: colors.background, color: colors.onSurface, fontFamily: "'Inter', sans-serif" }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(14,14,14,0.9)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', fontFamily: 'Arial Black, Arial, sans-serif', cursor: 'pointer' }}>Vangel<span style={{ color: '#7C3AED' }}>Clip</span></span>
        </Link>
        <div className="about-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '32px', fontSize: '14px', fontWeight: 500 }}>
          <a href="/#features" style={{ color: colors.onSurfaceVariant, textDecoration: 'none' }}>Features</a>
          <a href="/#pricing" style={{ color: colors.onSurfaceVariant, textDecoration: 'none' }}>Pricing</a>
          <span style={{ color: colors.primary, fontWeight: 600 }}>About</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/auth')} className="about-nav-cta" style={{ background: gradients.primary, color: '#FAF7FF', fontSize: '13px', fontWeight: 700, padding: '8px 18px', borderRadius: radius.md, border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Start Free</button>
          <button className="about-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu" style={{ display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
            <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#fff', borderRadius: 2 }} />
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div style={{ position: 'fixed', top: 57, left: 0, right: 0, background: 'rgba(10,0,30,0.97)', backdropFilter: 'blur(16px)', padding: '16px 24px 24px', zIndex: 49, borderBottom: '1px solid rgba(124,58,237,0.2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <a href="/#features" onClick={() => setMenuOpen(false)} style={{ padding: '12px 16px', borderRadius: 8, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>Features</a>
          <a href="/#pricing" onClick={() => setMenuOpen(false)} style={{ padding: '12px 16px', borderRadius: 8, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>Pricing</a>
          <a href="/about" onClick={() => setMenuOpen(false)} style={{ padding: '12px 16px', borderRadius: 8, fontSize: 15, fontWeight: 600, color: '#a78bfa', textDecoration: 'none' }}>About</a>
          <button onClick={() => { setMenuOpen(false); router.push('/auth'); }} style={{ padding: '12px 16px', borderRadius: 8, fontSize: 15, fontWeight: 700, color: '#FAF7FF', background: gradients.primary, border: 'none', cursor: 'pointer', fontFamily: "'Inter',sans-serif", textAlign: 'left', marginTop: 4 }}>Start Free</button>
        </div>
      )}

      <style>{`
        .about-hero { position:relative; min-height:100vh; display:flex; align-items:center; overflow:hidden; background:linear-gradient(135deg,#080014 0%,#0d0021 60%,#080014 100%); }
        .about-hero-inner { display:flex; align-items:center; gap:60px; max-width:1200px; margin:0 auto; width:100%; padding:120px 80px; position:relative; z-index:1; }
        .about-left { flex:1; min-width:0; }
        .about-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(124,58,237,.15); border:1px solid rgba(124,58,237,.4); border-radius:100px; padding:6px 16px; margin-bottom:24px; font-size:12px; color:#a78bfa; font-weight:600; }
        .about-h1 { font-size:clamp(36px,5vw,64px); font-weight:800; line-height:1.1; color:#fff; margin:0 0 24px; }
        .about-h1 em { color:#7c3aed; font-style:normal; }
        .about-sub { font-size:clamp(14px,1.8vw,17px); line-height:1.75; color:rgba(255,255,255,.7); margin:0 0 28px; max-width:460px; }
        .about-tags { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:36px; }
        .about-tag { padding:6px 14px; border-radius:100px; border:1px solid rgba(124,58,237,.4); font-size:12px; color:#a78bfa; background:rgba(124,58,237,.08); }
        .about-cta { display:inline-flex; align-items:center; gap:8px; padding:14px 28px; background:linear-gradient(135deg,#7c3aed,#5b21b6); border-radius:100px; color:#fff; font-weight:700; font-size:15px; text-decoration:none; box-shadow:0 8px 32px rgba(124,58,237,.35); transition:transform .2s; }
        .about-cta:hover { transform:translateY(-2px); }
        .about-right { flex-shrink:0; position:relative; }
        .c-stage { position:relative; width:420px; height:500px; }
        .c-card { position:absolute; border-radius:20px; overflow:hidden; cursor:pointer; transition:all .65s cubic-bezier(.34,1.4,.64,1); }
        .c-card img { width:100%; height:100%; object-fit:cover; display:block; }
        .c-overlay { position:absolute; bottom:0; left:0; right:0; padding:20px 16px 16px; background:linear-gradient(transparent,rgba(10,0,30,.92)); }
        .c-type { font-size:10px; font-weight:700; letter-spacing:.1em; color:#a78bfa; text-transform:uppercase; margin-bottom:3px; }
        .c-name { font-size:15px; font-weight:700; color:#fff; }
        .c-counter { position:absolute; top:-28px; right:0; font-size:12px; color:rgba(255,255,255,.4); font-weight:500; }
        .c-counter b { color:rgba(255,255,255,.85); font-weight:700; }
        .c-nav { position:absolute; top:50%; transform:translateY(-50%); width:38px; height:38px; border-radius:50%; background:rgba(124,58,237,.2); border:1px solid rgba(124,58,237,.5); color:#fff; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:10; transition:background .2s; font-family:inherit; }
        .c-nav:hover { background:rgba(124,58,237,.45); }
        .c-prev { left:-20px; }
        .c-next { right:-20px; }
        .c-dots { display:flex; gap:7px; justify-content:center; margin-top:24px; }
        .c-dot { height:7px; border-radius:4px; border:none; cursor:pointer; transition:all .3s; background:rgba(124,58,237,.3); padding:0; }
        .c-dot.on { background:#7c3aed; }
        @media(max-width:900px){
          .about-hero-inner { flex-direction:column; padding:100px 24px 60px; }
          .c-stage { width:320px; height:400px; }
          .about-left { text-align:center; }
          .about-tags { justify-content:center; }
          .about-sub { max-width:100%; }
        }
        @media(max-width:500px){
          .c-stage { width:280px; height:360px; }
        }
        @media (max-width: 768px) {
          .pillars-grid, .stats-grid { grid-template-columns: 1fr !important; }
          .about-nav-links { display: none !important; }
          .about-nav-cta   { display: none !important; }
          .about-hamburger { display: flex !important; }
        }
      `}</style>

      {/* HERO */}
      <section className="about-hero">
        {/* Background glows */}
        <div style={{ position:'absolute', top:'15%', right:'8%', width:'480px', height:'480px', background:'radial-gradient(circle,rgba(124,58,237,.13) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'10%', left:'4%', width:'280px', height:'280px', background:'radial-gradient(circle,rgba(6,182,212,.09) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'50%', left:'40%', width:'200px', height:'200px', background:'radial-gradient(circle,rgba(236,72,153,.06) 0%,transparent 70%)', pointerEvents:'none' }} />

        <div className="about-hero-inner">
          {/* LEFT */}
          <div className="about-left">
            <div className="about-badge">🌍 African-built. World-class.</div>
            <h1 className="about-h1">
              Built for African<br />
              <em>Voices.</em> Made<br />for the World.
            </h1>
            <p className="about-sub">
              VangelClip is Africa&apos;s first AI-powered short-clip platform
              built for gospel creators, educators, pastors, motivational
              speakers, and inspirational voices &mdash; turning long-form
              content into viral short clips that reach the world.
            </p>
            <div className="about-tags">
              {['Gospel','Education','Inspiration','African-First','World-Class'].map(t => (
                <span key={t} className="about-tag">{t}</span>
              ))}
            </div>
            <Link href="/auth" className="about-cta">Start Clipping Free →</Link>
          </div>

          {/* RIGHT — CAROUSEL */}
          <div className="about-right">
            <div className="c-counter">
              <b>{String(slide + 1).padStart(2, '0')}</b>/{slides.length.toString().padStart(2, '0')}
            </div>

            <div className="c-stage">
              {slides.map((sl, i) => {
                const diff = (i - slide + 4) % 4;
                const cfg = cardPos[diff];
                return (
                  <div
                    key={i}
                    className="c-card"
                    onClick={() => go(i)}
                    style={{
                      width: cfg.w,
                      height: cfg.h,
                      top: cfg.top,
                      left: cfg.left,
                      transform: `translateX(${cfg.tx}) rotate(${cfg.rot}deg)`,
                      zIndex: cfg.z,
                      opacity: cfg.op,
                      filter: cfg.bright < 1 ? `brightness(${cfg.bright})` : 'none',
                      boxShadow: cfg.shadow,
                      border: cfg.border,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sl.src} alt={sl.name} />
                    <div className="c-overlay">
                      <div className="c-type">{sl.label}</div>
                      <div className="c-name">{sl.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="c-nav c-prev" onClick={() => go(slide - 1)} aria-label="Previous">&#8249;</button>
            <button className="c-nav c-next" onClick={() => go(slide + 1)} aria-label="Next">&#8250;</button>

            <div className="c-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`c-dot${i === slide ? ' on' : ''}`}
                  style={{ width: i === slide ? '22px' : '7px' }}
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY VANGELCLIP */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px', borderTop: '1px solid rgba(70,69,85,0.1)' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24, textAlign: 'center' }}>Why VangelClip?</h2>
        <p style={{ fontSize: 17, color: colors.onSurfaceVariant, lineHeight: 1.85, textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
          The name is rooted in <strong style={{ color: colors.onSurface }}>Evangel</strong> &mdash; from Greek, meaning Gospel, good news,
          and the proclamation of truth. Combined with <strong style={{ color: colors.onSurface }}>Clip</strong>, it speaks to our core purpose:
          take the world&apos;s most important messages and make them clip-ready for a generation that consumes content in seconds.
        </p>
      </section>

      {/* THREE PILLARS */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px', borderTop: '1px solid rgba(70,69,85,0.1)' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 48, textAlign: 'center' }}>Three Pillars</h2>
        <div className="pillars-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {[
            { icon: '✝', title: 'Gospel & Faith', color: '#7c3aed', body: 'Pastors, evangelists, gospel musicians, and faith creators produce powerful messages. A Sunday sermon that moves thousands in a church can move millions on TikTok — if the right 60 seconds are clipped. VangelClip finds those 60 seconds automatically.' },
            { icon: '📚', title: 'Education & Knowledge', color: '#06b6d4', body: 'African educators, professors, coaches, and thought leaders produce world-class content every day. VangelClip gives them the same AI clipping technology global creators use — designed for the African classroom, conference, and content studio.' },
            { icon: '💡', title: 'Inspiration & Transformation', color: '#10b981', body: 'Motivational speakers, life coaches, and community leaders whose words transform lives deserve global reach. VangelClip makes every profound statement clip-ready for the platforms where the next generation lives.' },
          ].map(p => (
            <div key={p.title} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: 36 }}>
              <div style={{ fontSize: 36, marginBottom: 20 }}>{p.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14, color: p.color }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 1.8 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AFRICAN GAP */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px', borderTop: '1px solid rgba(70,69,85,0.1)' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24, textAlign: 'center' }}>Filling the African Gap</h2>
        <p style={{ fontSize: 17, color: colors.onSurfaceVariant, lineHeight: 1.85, textAlign: 'center', maxWidth: 680, margin: '0 auto 48px' }}>
          There are over 700 million internet users in Africa. Nigerian creators alone produce some of the most watched gospel
          and educational content in the world. Yet no AI clipping platform was built thinking of them first. Until VangelClip.
        </p>
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            { v: '700M+', l: 'Internet users in Africa' },
            { v: '33M+', l: 'YouTube users in Nigeria alone' },
            { v: '10M+', l: 'African TikTok creators' },
            { v: 'First', l: 'African-built AI clip platform' },
          ].map(s => (
            <div key={s.v} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: '28px 20px', textAlign: 'center', border: '1px solid rgba(124,58,237,0.15)' }}>
              <p style={{ fontSize: 32, fontWeight: 800, color: colors.primary, marginBottom: 8 }}>{s.v}</p>
              <p style={{ fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 1.5 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VISION */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px', borderTop: '1px solid rgba(70,69,85,0.1)' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24, textAlign: 'center' }}>The Vision</h2>
        <p style={{ fontSize: 17, color: colors.onSurfaceVariant, lineHeight: 1.85, textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
          In 5 years, VangelClip will be the platform a pastor in Lagos uses to clip his Sunday sermon and reach 2 million people
          by Monday morning. The tool a gospel artist in Accra uses to turn a 4-minute song into 8 viral Reels. What a teacher
          in Nairobi uses to clip a masterclass into 15 educational shorts that change lives worldwide.
        </p>
      </section>

      {/* BLOG */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px', borderTop: '1px solid rgba(70,69,85,0.1)' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>From the Blog</h2>
        <p style={{ fontSize: 15, color: colors.onSurfaceVariant, marginBottom: 40 }}>Stories, insights, and inspiration for African creators.</p>
        <div className="pillars-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {BLOG_POSTS.map(post => (
            <div key={post.title} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ height: 6, background: post.color }} />
              <div style={{ padding: 28 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: post.color, background: post.color + '18', padding: '2px 10px', borderRadius: radius.full }}>{post.tag}</span>
                  <span style={{ fontSize: 11, color: colors.onSurfaceVariant }}>{post.date}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, lineHeight: 1.4 }}>{post.title}</h3>
                <p style={{ fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 1.7, marginBottom: 16 }}>{post.excerpt}</p>
                <span style={{ fontSize: 12, fontWeight: 700, color: post.color }}>Read more →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SUPPORT */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '60px 24px', borderTop: '1px solid rgba(70,69,85,0.1)' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Support</h2>
        <p style={{ fontSize: 15, color: colors.onSurfaceVariant, marginBottom: 40, textAlign: 'center' }}>Have a question or need help? Send us a message and we&apos;ll get back to you within 2 business days.</p>
        {supportSent ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: colors.surfaceContainerHigh, borderRadius: radius.xl, border: '1px solid rgba(74,222,128,0.2)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Message Sent!</h3>
            <p style={{ color: colors.onSurfaceVariant }}>Your email client should open. We&apos;ll reply to <strong>{supportEmail}</strong> within 2 business days.</p>
            <button onClick={() => { setSupportSent(false); setSupportName(''); setSupportEmail(''); setSupportMessage(''); }} style={{ marginTop: 20, padding: '10px 24px', borderRadius: radius.md, background: colors.surfaceContainerHighest, border: '1px solid ' + colors.outlineVariant, color: colors.onSurface, cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 13 }}>Send Another</button>
          </div>
        ) : (
          <form onSubmit={handleSupport} style={{ background: colors.surfaceContainerHigh, borderRadius: radius.xl, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: 6 }}>Your Name</label>
                <input required value={supportName} onChange={e => setSupportName(e.target.value)} placeholder="Pastor Emeka" style={{ width: '100%', background: colors.surfaceContainerLowest, color: colors.onSurface, border: '1px solid ' + colors.outlineVariant, borderRadius: radius.md, padding: '10px 14px', fontSize: 14, fontFamily: "'Inter',sans-serif", outline: 'none', boxSizing: 'border-box' as const }}/>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: 6 }}>Email Address</label>
                <input required type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', background: colors.surfaceContainerLowest, color: colors.onSurface, border: '1px solid ' + colors.outlineVariant, borderRadius: radius.md, padding: '10px 14px', fontSize: 14, fontFamily: "'Inter',sans-serif", outline: 'none', boxSizing: 'border-box' as const }}/>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: 6 }}>Type of Request</label>
              <select value={supportType} onChange={e => setSupportType(e.target.value)} style={{ width: '100%', background: colors.surfaceContainerLowest, color: colors.onSurface, border: '1px solid ' + colors.outlineVariant, borderRadius: radius.md, padding: '10px 14px', fontSize: 14, fontFamily: "'Inter',sans-serif", outline: 'none' }}>
                <option value="general">General Question</option>
                <option value="billing">Billing & Payments</option>
                <option value="technical">Technical Issue</option>
                <option value="feature">Feature Request</option>
                <option value="account">Account Help</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.onSurfaceVariant, display: 'block', marginBottom: 6 }}>Message</label>
              <textarea required rows={5} value={supportMessage} onChange={e => setSupportMessage(e.target.value)} placeholder="Describe your question or issue..." style={{ width: '100%', background: colors.surfaceContainerLowest, color: colors.onSurface, border: '1px solid ' + colors.outlineVariant, borderRadius: radius.md, padding: '10px 14px', fontSize: 14, fontFamily: "'Inter',sans-serif", outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }}/>
            </div>
            <button type="submit" style={{ padding: '14px', borderRadius: radius.md, background: gradients.primary, color: '#FAF7FF', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Send Message →</button>
          </form>
        )}
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px 100px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Ready to Clip Your Message?</h2>
        <p style={{ color: colors.onSurfaceVariant, fontSize: 17, marginBottom: 36 }}>Join thousands of African creators already using VangelClip.</p>
        <button onClick={() => router.push('/auth')} style={{ background: gradients.primary, color: '#FAF7FF', fontWeight: 700, padding: '16px 40px', borderRadius: radius.xl, border: 'none', cursor: 'pointer', fontSize: 16, boxShadow: shadows.glowStrong, fontFamily: "'Inter', sans-serif" }}>Start Clipping Free</button>
      </section>
    </div>
  );
}
