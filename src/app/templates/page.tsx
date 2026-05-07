'use client';
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors, gradients, radius } from '@/lib/tokens';

const CATS = ['All','Trending','Educational','Entertainment','Podcast','Marketing','Vlog'];

interface Template {
  id: string;
  name: string;
  cat: string;
  desc: string;
  uses: string;
  rating: number;
  bg: string;
  icon: string;
  platforms: string[];
  duration: string;
  badge: string;
  prompt: string;
}

const TMPLS: Template[] = [
  {
    id: '1',
    name: 'Hook & Drop',
    cat: 'Trending',
    desc: 'Cold open with a bold claim, then drop your main point in 3 seconds flat.',
    uses: '18.2K',
    rating: 4.9,
    bg: 'linear-gradient(135deg,#C0C1FF,#5D60EB)',
    icon: 'bolt',
    platforms: ['TikTok','Reels','Shorts'],
    duration: '15–30s',
    badge: '🔥 Viral',
    prompt: 'Extract the most attention-grabbing opening hook from this video. Start with the boldest claim or shocking statement, then cut to the core message. Maximum 30 seconds.',
  },
  {
    id: '2',
    name: 'Story Arc',
    cat: 'Entertainment',
    desc: '3-part emotional journey: setup, tension, and satisfying resolution.',
    uses: '11.3K',
    rating: 4.8,
    bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
    icon: 'auto_stories',
    platforms: ['TikTok','Reels'],
    duration: '45–60s',
    badge: '❤️ Emotional',
    prompt: 'Find a compelling story arc in this video with a clear beginning, rising tension, and resolution. Edit for maximum emotional impact in 45-60 seconds.',
  },
  {
    id: '3',
    name: 'Controversy Clip',
    cat: 'Trending',
    desc: 'Hot take that sparks instant debate and floods your comment section.',
    uses: '14.7K',
    rating: 4.7,
    bg: 'linear-gradient(135deg,#ef4444,#b91c1c)',
    icon: 'local_fire_department',
    platforms: ['TikTok','Reels','Shorts'],
    duration: '15–30s',
    badge: '💬 Debate',
    prompt: 'Extract the most controversial or debate-sparking moment from this video. The clip should make viewers feel strongly enough to argue in the comments. Under 30 seconds.',
  },
  {
    id: '4',
    name: 'Laugh Factory',
    cat: 'Entertainment',
    desc: 'Comedy beats with tight timing — setup, build, and punchline perfection.',
    uses: '9.4K',
    rating: 4.8,
    bg: 'linear-gradient(135deg,#fde68a,#f59e0b)',
    icon: 'sentiment_very_satisfied',
    platforms: ['TikTok','Reels','Shorts'],
    duration: '15–30s',
    badge: '😂 Comedy',
    prompt: 'Find the funniest moments with the best comedic timing. Preserve the full setup and punchline. Cut anything that breaks the joke momentum. Under 30 seconds.',
  },
  {
    id: '5',
    name: 'Value Bomb',
    cat: 'Educational',
    desc: 'Rapid-fire insight delivery that makes viewers stop scrolling and screenshot.',
    uses: '16.1K',
    rating: 4.9,
    bg: 'linear-gradient(135deg,#89CEFF,#0079AD)',
    icon: 'tips_and_updates',
    platforms: ['TikTok','Reels','LinkedIn'],
    duration: '30–45s',
    badge: '💡 Insightful',
    prompt: 'Extract the single most valuable insight or piece of actionable advice from this video. The clip should make viewers want to save and share it immediately. 30-45 seconds.',
  },
  {
    id: '6',
    name: 'Afrobeats Energy',
    cat: 'Entertainment',
    desc: 'High-energy cuts built for Afrobeats vibes — vibrant, cultural, unapologetic.',
    uses: '21.5K',
    rating: 4.9,
    bg: 'linear-gradient(135deg,#FF6B35,#FF0080)',
    icon: 'music_note',
    platforms: ['TikTok','Reels'],
    duration: '15–30s',
    badge: '🌍 African',
    prompt: 'Find the highest energy, most visually vibrant moments in this video that would pair perfectly with Afrobeats music. Prioritize dancing, celebrations, and cultural moments. Under 30 seconds.',
  },
  {
    id: '7',
    name: 'Podcast Goldmine',
    cat: 'Podcast',
    desc: 'Clip the one quote that stops every thumb mid-scroll and demands a listen.',
    uses: '9.1K',
    rating: 4.6,
    bg: 'linear-gradient(135deg,#4ade80,#16a34a)',
    icon: 'mic',
    platforms: ['TikTok','Reels','Shorts'],
    duration: '30–60s',
    badge: '🎙️ Podcast',
    prompt: 'Find the single most insightful, surprising, or controversial moment from this podcast or interview. The clip should work as a standalone without the full episode context. 30-60 seconds.',
  },
  {
    id: '8',
    name: 'Tutorial Snap',
    cat: 'Educational',
    desc: 'Lightning-fast how-to with numbered steps and zero fluff.',
    uses: '5.8K',
    rating: 4.5,
    bg: 'linear-gradient(135deg,#a78bfa,#7c3aed)',
    icon: 'school',
    platforms: ['TikTok','Reels','Shorts'],
    duration: '30–60s',
    badge: '📚 Tutorial',
    prompt: 'Extract a clear, concise tutorial or how-to segment from this video. Include every key step at a fast pace. Cut filler words and repetition. 30-60 seconds.',
  },
  {
    id: '9',
    name: 'Reaction Bait',
    cat: 'Entertainment',
    desc: 'Jaw-drop moments designed to trigger strong shares and emotional reactions.',
    uses: '12.8K',
    rating: 4.7,
    bg: 'linear-gradient(135deg,#f472b6,#ec4899)',
    icon: 'emoji_emotions',
    platforms: ['TikTok','Reels'],
    duration: '15–30s',
    badge: '😮 Reaction',
    prompt: 'Find the most surprising, shocking, or awe-inspiring moment in this video. The clip should provoke a strong enough reaction that viewers immediately share it. Under 30 seconds.',
  },
  {
    id: '10',
    name: 'Nigerian Skit Style',
    cat: 'Entertainment',
    desc: 'Fast-cut Naija comedy with cultural references that resonate deeply.',
    uses: '28.3K',
    rating: 4.9,
    bg: 'linear-gradient(135deg,#22d3ee,#0891b2)',
    icon: 'theater_comedy',
    platforms: ['TikTok','Reels'],
    duration: '30–60s',
    badge: '🇳🇬 Naija',
    prompt: 'Extract the most entertaining skit or comedy segment from this video. Preserve the comedic timing, dialogue rhythm, and cultural humor. Keep it punchy and relatable to Nigerian and African audiences. 30-60 seconds.',
  },
  {
    id: '11',
    name: 'Motivational Cut',
    cat: 'Trending',
    desc: 'Fire speech moments that make people jump out of their seats and take action.',
    uses: '22.6K',
    rating: 4.8,
    bg: 'linear-gradient(135deg,#ff9a00,#ff6a00)',
    icon: 'rocket_launch',
    platforms: ['TikTok','Reels','Shorts','LinkedIn'],
    duration: '30–60s',
    badge: '💪 Motivation',
    prompt: 'Find the most inspiring, motivating speech or monologue from this video. Cut for maximum emotional build-up and energy that crescendos at the end. 30-60 seconds.',
  },
  {
    id: '12',
    name: 'Stats & Facts',
    cat: 'Educational',
    desc: 'Mind-blowing numbers and counterintuitive data points that demand a rewatch.',
    uses: '7.4K',
    rating: 4.6,
    bg: 'linear-gradient(135deg,#38bdf8,#0284c7)',
    icon: 'bar_chart',
    platforms: ['TikTok','Reels','LinkedIn'],
    duration: '15–30s',
    badge: '📊 Data',
    prompt: 'Extract the most surprising or counterintuitive statistics and facts from this video. Present them in a rapid-fire format that makes viewers pause and rewatch. Under 30 seconds.',
  },
  {
    id: '13',
    name: 'Before & After',
    cat: 'Marketing',
    desc: 'Transformation story with tension before the reveal and a jaw-drop finish.',
    uses: '6.2K',
    rating: 4.8,
    bg: 'linear-gradient(135deg,#ff97b5,#E1306C)',
    icon: 'compare',
    platforms: ['TikTok','Reels','Shorts'],
    duration: '30–45s',
    badge: '✨ Transform',
    prompt: 'Find the transformation or before/after reveal moment in this video. Build tension before the reveal, then let the result land hard. 30-45 seconds.',
  },
  {
    id: '14',
    name: 'Interview Highlight',
    cat: 'Podcast',
    desc: 'The single answer that makes you click the full interview immediately.',
    uses: '8.9K',
    rating: 4.7,
    bg: 'linear-gradient(135deg,#818cf8,#4f46e5)',
    icon: 'record_voice_over',
    platforms: ['TikTok','Reels','LinkedIn'],
    duration: '45–60s',
    badge: '🎤 Interview',
    prompt: 'Extract the most compelling interview exchange where the subject gives an unexpected, vulnerable, or highly quotable answer. 45-60 seconds.',
  },
  {
    id: '15',
    name: 'Behind The Scenes',
    cat: 'Vlog',
    desc: 'Raw, unfiltered moments that build authentic connection with your audience.',
    uses: '7.6K',
    rating: 4.7,
    bg: 'linear-gradient(135deg,#6ee7b7,#059669)',
    icon: 'videocam',
    platforms: ['TikTok','Reels','Shorts'],
    duration: '30–60s',
    badge: '🎬 Authentic',
    prompt: 'Find the most authentic, unscripted, or behind-the-scenes moments from this video. Prioritize genuine reactions and candid moments over polished content. 30-60 seconds.',
  },
  {
    id: '16',
    name: 'Product Review',
    cat: 'Marketing',
    desc: 'Fast verdict cut: unboxing, key features, and a clear money-shot ending.',
    uses: '4.2K',
    rating: 4.4,
    bg: 'linear-gradient(135deg,#fca5a5,#dc2626)',
    icon: 'shopping_bag',
    platforms: ['TikTok','Reels','Shorts'],
    duration: '30–45s',
    badge: '⭐ Review',
    prompt: 'Extract the product reveal, key feature demonstration, and final verdict from this review. Include the most visually impactful moment of the product in action. 30-45 seconds.',
  },
  {
    id: '17',
    name: 'Street Vox Pop',
    cat: 'Entertainment',
    desc: 'Wildest public reactions and unexpected street answers that feel totally real.',
    uses: '13.1K',
    rating: 4.6,
    bg: 'linear-gradient(135deg,#fdba74,#ea580c)',
    icon: 'campaign',
    platforms: ['TikTok','Reels'],
    duration: '30–45s',
    badge: '🎤 Street',
    prompt: 'Find the most entertaining, unexpected, or hilarious public interview or reaction in this video. The clip should feel authentic and make viewers feel like they were there. 30-45 seconds.',
  },
  {
    id: '18',
    name: 'News Commentary',
    cat: 'Trending',
    desc: 'Hot take on current events with a unique creator angle that adds real value.',
    uses: '3.9K',
    rating: 4.3,
    bg: 'linear-gradient(135deg,#fb7185,#be185d)',
    icon: 'newspaper',
    platforms: ['TikTok','Reels','LinkedIn'],
    duration: '30–60s',
    badge: '📰 Commentary',
    prompt: 'Extract the creator\'s most insightful or provocative commentary on current events. The clip should offer a clear perspective that adds meaningfully to the conversation. 30-60 seconds.',
  },
  {
    id: '19',
    name: 'Faith & Inspiration',
    cat: 'Trending',
    desc: 'Spiritual moments and faith-based quotes that move souls and get saved 10×.',
    uses: '31.4K',
    rating: 4.9,
    bg: 'linear-gradient(135deg,#c4b5fd,#8b5cf6)',
    icon: 'auto_awesome',
    platforms: ['TikTok','Reels','Shorts'],
    duration: '30–60s',
    badge: '🙏 Faith',
    prompt: 'Find the most spiritually moving, faith-affirming, or inspirational moment in this video. The clip should provide comfort, renewed purpose, or spiritual encouragement. 30-60 seconds.',
  },
  {
    id: '20',
    name: 'Business Pitch',
    cat: 'Marketing',
    desc: 'Crisp founder story or value prop that sells the vision in under a minute.',
    uses: '5.1K',
    rating: 4.5,
    bg: 'linear-gradient(135deg,#86efac,#16a34a)',
    icon: 'business_center',
    platforms: ['LinkedIn','TikTok','Reels'],
    duration: '30–45s',
    badge: '💼 Business',
    prompt: 'Extract the clearest, most compelling business pitch or value proposition from this video. The clip should communicate the problem, solution, and opportunity in under 45 seconds.',
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState<string | null>(null);

  const filtered = TMPLS.filter(t =>
    (cat === 'All' || t.cat === cat) &&
    (search === '' || t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase()))
  );

  const handleUse = (tmpl: Template) => {
    setApplied(tmpl.id);
    sessionStorage.setItem('hookclip_template_prompt', tmpl.prompt);
    sessionStorage.setItem('hookclip_template_name', tmpl.name);
    setTimeout(() => { router.push('/import'); }, 600);
  };

  return (
    <DashboardLayout title="Templates Library" subtitle="Start with a proven format. Customize to your style.">
      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
          <Icon name="search" size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: colors.onSurfaceVariant }} />
          <input
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: colors.surfaceContainerLowest, color: colors.onSurface, border: '1px solid transparent', borderRadius: radius.md, padding: '11px 16px 11px 40px', fontSize: '14px', fontFamily: "'Inter',sans-serif", outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {CATS.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              style={{ padding: '8px 14px', borderRadius: radius.full, background: cat === c ? colors.primary : colors.surfaceContainerHigh, color: cat === c ? '#000' : colors.onSurfaceVariant, border: 'none', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap' }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, marginBottom: '16px' }}>
        {filtered.length} template{filtered.length !== 1 ? 's' : ''}
        {cat !== 'All' ? ` in ${cat}` : ''}
        {search ? ` matching "${search}"` : ''}
      </p>

      {/* Responsive grid */}
      <div className="templates-grid">
        {filtered.map(t => (
          <div
            key={t.id}
            style={{
              background: colors.surfaceContainerHigh,
              borderRadius: radius.lg,
              overflow: 'hidden',
              border: applied === t.id ? `2px solid ${colors.primary}` : '2px solid transparent',
              transition: 'border-color 0.2s',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Thumbnail */}
            <div style={{ aspectRatio: '16/10', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
              <Icon name={t.icon} size={44} style={{ color: 'rgba(255,255,255,0.25)' }} />
              {/* Badge top-left */}
              <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', padding: '3px 10px', borderRadius: radius.full, fontSize: '11px', fontWeight: 600, color: '#fff' }}>
                {t.badge}
              </div>
              {/* Rating bottom-right */}
              <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '3px 9px', borderRadius: radius.full, fontSize: '11px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Icon name="star" filled size={11} style={{ color: '#fbbf24' }} />
                {t.rating}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: 8 }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, flex: 1, lineHeight: 1.3 }}>{t.name}</h3>
                <span style={{ fontSize: '10px', fontWeight: 600, color: colors.primary, background: 'rgba(192,193,255,0.1)', padding: '2px 8px', borderRadius: radius.full, flexShrink: 0 }}>{t.cat}</span>
              </div>

              <p style={{ fontSize: '12px', color: colors.onSurfaceVariant, lineHeight: 1.5, margin: '0 0 10px' }}>{t.desc}</p>

              {/* Duration + platforms */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: colors.onSurfaceVariant, background: colors.surfaceContainerHighest, padding: '2px 8px', borderRadius: radius.full, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Icon name="schedule" size={10} />{t.duration}
                </span>
                {t.platforms.map(p => (
                  <span key={p} style={{ fontSize: '10px', fontWeight: 600, color: colors.primary, background: `${colors.primary}18`, padding: '2px 8px', borderRadius: radius.full }}>
                    {p}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '11px', color: colors.onSurfaceVariant, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Icon name="group" size={13} style={{ verticalAlign: 'middle' }} />
                  {t.uses} uses
                </span>
                <button
                  onClick={() => handleUse(t)}
                  style={{ padding: '6px 14px', borderRadius: radius.md, background: applied === t.id ? '#4ade80' : gradients.primary, color: applied === t.id ? '#000' : '#FAF7FF', border: 'none', fontWeight: 600, fontSize: '11px', cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'background 0.2s' }}
                >
                  {applied === t.id ? '✓ Applied!' : 'Use Template'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .templates-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 1024px) {
          .templates-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .templates-grid { grid-template-columns: 1fr; gap: 12px; }
        }
      `}</style>
    </DashboardLayout>
  );
}
