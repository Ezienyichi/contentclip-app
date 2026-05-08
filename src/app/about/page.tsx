'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { colors, gradients, radius, shadows } from '@/lib/tokens';

export default function AboutPage() {
  const router = useRouter();
  return (
    <div style={{ background: colors.background, color: colors.onSurface, fontFamily: "'Inter', sans-serif" }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(14,14,14,0.9)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', fontFamily: 'Arial Black, Arial, sans-serif', cursor: 'pointer' }}>Vangel<span style={{ color: '#7C3AED' }}>Clip</span></span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', fontSize: '14px', fontWeight: 500 }}>
          <a href="/#features" style={{ color: colors.onSurfaceVariant, textDecoration: 'none' }}>Features</a>
          <a href="/#pricing" style={{ color: colors.onSurfaceVariant, textDecoration: 'none' }}>Pricing</a>
          <span style={{ color: colors.primary, fontWeight: 600 }}>About</span>
        </div>
        <button onClick={() => router.push('/auth')} style={{ background: gradients.primary, color: '#FAF7FF', fontSize: '13px', fontWeight: 700, padding: '8px 18px', borderRadius: radius.md, border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Start Free</button>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '100px 24px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: radius.full, background: colors.surfaceContainerHighest, border: '1px solid ' + colors.outlineVariant, color: colors.primary, fontSize: 12, fontWeight: 600, marginBottom: 32 }}>
          <Icon name="public" size={14} /> African-built. World-class.
        </div>
        <h1 style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 28 }}>
          Built for African Voices.<br />
          <span style={{ color: colors.primary }}>Made for the World.</span>
        </h1>
        <p style={{ fontSize: 18, color: colors.onSurfaceVariant, maxWidth: 720, margin: '0 auto', lineHeight: 1.8 }}>
          VangelClip is Africa&apos;s first AI-powered short-clip platform built for gospel creators, educators, pastors,
          motivational speakers, and inspirational voices &mdash; turning long-form content into viral short clips that reach the world.
        </p>
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

      {/* CTA */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px 100px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Ready to Clip Your Message?</h2>
        <p style={{ color: colors.onSurfaceVariant, fontSize: 17, marginBottom: 36 }}>Join thousands of African creators already using VangelClip.</p>
        <button onClick={() => router.push('/auth')} style={{ background: gradients.primary, color: '#FAF7FF', fontWeight: 700, padding: '16px 40px', borderRadius: radius.xl, border: 'none', cursor: 'pointer', fontSize: 16, boxShadow: shadows.glowStrong, fontFamily: "'Inter', sans-serif" }}>Start Clipping Free</button>
      </section>

      <style>{'@media (max-width: 768px) { .pillars-grid, .stats-grid { grid-template-columns: 1fr !important; } }'}</style>
    </div>
  );
}
