'use client';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors, gradients, radius, inputField } from '@/lib/tokens';

type Clip = {
  title: string; hook_text: string; start_time: number; end_time: number;
  virality_score: number; suggested_caption: string; hashtags: string;
  platform: string; clip_url?: string; duration: number; status?: string;
};

const SORTS = ['Most Viral','Newest','Longest','Shortest'];
const PLATS = ['All','TikTok','Reels','Shorts'];

export default function ClipsPage() {
  const router = useRouter();
  const [clips, setClips] = useState<Clip[]>([]);
  const [sort, setSort] = useState('Most Viral');
  const [plat, setPlat] = useState('All');
  const [preview, setPreview] = useState<number|null>(null);
  const [playingUrl, setPlayingUrl] = useState<string|null>(null);
  const [showDl, setShowDl] = useState<number|null>(null);
  const [scheduleClip, setScheduleClip] = useState<Clip|null>(null);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('12:00');
  const [schedPlatforms, setSchedPlatforms] = useState<string[]>(['tiktok']);
  const [schedCaption, setSchedCaption] = useState('');
  const [schedHashtags, setSchedHashtags] = useState('');

  // Load real clips from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('hookclip_clips');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClips(parsed);
          return;
        }
      }
    } catch {}
    // No demo clips - show empty state for new users
    setClips([]);
  }, []);

  const formatDuration = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  const sc = (s: number) => s >= 85 ? '#4ade80' : s >= 70 ? '#C0C1FF' : '#fbbf24';

  const platMap = (p: string) => {
    if (p.includes('tiktok')) return 'TikTok';
    if (p.includes('reels') || p.includes('instagram')) return 'Reels';
    if (p.includes('shorts') || p.includes('youtube')) return 'Shorts';
    return p;
  };

  const filtered = clips
    .filter(c => plat === 'All' || platMap(c.platform).toLowerCase() === plat.toLowerCase())
    .sort((a, b) => {
      if (sort === 'Most Viral') return b.virality_score - a.virality_score;
      if (sort === 'Longest') return b.duration - a.duration;
      if (sort === 'Shortest') return a.duration - b.duration;
      return 0;
    });

  function openSchedule(clip: Clip) {
    setScheduleClip(clip);
    setSchedCaption(clip.suggested_caption || '');
    setSchedHashtags(clip.hashtags || '');
    setSchedDate('');
    setSchedTime('12:00');
    setSchedPlatforms([clip.platform.includes('tiktok') ? 'tiktok' : clip.platform.includes('reels') ? 'reels' : 'shorts']);
  }

  function togglePlatform(p: string) {
    setSchedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function handleSchedule() {
    if (!scheduleClip || !schedDate) { alert('Please select a date'); return; }
    // Save to sessionStorage for calendar page
    const existing = JSON.parse(sessionStorage.getItem('hookclip_scheduled') || '[]');
    const newPost = {
      id: Date.now().toString(),
      clip_title: scheduleClip.title,
      hook_text: scheduleClip.hook_text,
      virality_score: scheduleClip.virality_score,
      caption: schedCaption,
      hashtags: schedHashtags,
      platforms: schedPlatforms,
      scheduled_date: schedDate,
      scheduled_time: schedTime,
      status: 'scheduled',
    };
    existing.push(newPost);
    sessionStorage.setItem('hookclip_scheduled', JSON.stringify(existing));
    setScheduleClip(null);
    alert('Clip scheduled! View it in your Content Calendar.');
  }

  return (
    <DashboardLayout title="Generated Clips" subtitle={clips.length + ' clips ready'}>
      {/* Filters */}
      <div className="clips-filters" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
        <div style={{ display:'flex', gap:'8px' }}>
          {SORTS.map(o => <button key={o} onClick={() => setSort(o)} style={{ padding:'8px 16px', borderRadius:radius.full, background:sort===o?colors.primary:colors.surfaceContainerHigh, color:sort===o?'#000':colors.onSurfaceVariant, border:'none', fontWeight:600, fontSize:'12px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>{o}</button>)}
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          {PLATS.map(p => <button key={p} onClick={() => setPlat(p)} style={{ padding:'8px 14px', borderRadius:radius.full, background:plat===p?colors.surfaceContainerHighest:'transparent', color:plat===p?colors.onSurface:colors.onSurfaceVariant, border:plat===p?'1px solid '+colors.outlineVariant:'1px solid transparent', fontWeight:500, fontSize:'12px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>{p}</button>)}
        </div>
      </div>

      {/* Clips grid */}
      <div className="clips-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'16px' }}>
        {filtered.map((clip, idx) => (
          <div key={idx} style={{ background:colors.surfaceContainerHigh, borderRadius:radius.lg, overflow:'hidden' }}>
            {/* Thumbnail */}
            <div onClick={() => clip.clip_url ? setPlayingUrl(clip.clip_url) : setPreview(idx)} style={{ aspectRatio:'9/12', background:colors.surfaceContainer, position:'relative', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', padding:'4px 10px', borderRadius:radius.full, display:'flex', alignItems:'center', gap:'4px' }}>
                <Icon name="local_fire_department" size={14} style={{ color:sc(clip.virality_score) }} filled/>
                <span style={{ fontSize:'12px', fontWeight:700, color:sc(clip.virality_score) }}>{clip.virality_score}</span>
              </div>
              <div style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.7)', padding:'4px 8px', borderRadius:radius.sm, fontSize:'11px', color:'#fff', fontWeight:600 }}>{formatDuration(clip.duration)}</div>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,0.1)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="play_arrow" filled size={28} style={{ color:'#fff' }}/>
              </div>
              <div style={{ position:'absolute', bottom:12, left:12, right:12, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', padding:'8px 12px', borderRadius:radius.md }}>
                <p style={{ fontSize:'11px', color:'#fff', fontWeight:500, lineHeight:1.4 }}>&ldquo;{clip.hook_text}&rdquo;</p>
              </div>
            </div>

            {/* Info */}
            <div style={{ padding:'16px' }}>
              <p style={{ fontSize:'13px', fontWeight:600, marginBottom:'4px', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any }}>{clip.title}</p>
              <p style={{ fontSize:'11px', color:colors.onSurfaceVariant, textTransform:'capitalize', marginBottom:'12px' }}>
                <Icon name="smart_display" size={12} style={{ verticalAlign:'middle', marginRight:4 }}/>{platMap(clip.platform)}
              </p>

              {/* Action buttons */}
              <div style={{ display:'flex', gap:'6px' }}>
                <button onClick={() => router.push('/editor')} style={{ flex:1, padding:'8px', borderRadius:radius.md, background:colors.surfaceContainer, border:'1px solid '+colors.outlineVariant, color:colors.onSurface, fontSize:'11px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', fontFamily:"'Inter',sans-serif" }}>
                  <Icon name="edit" size={13}/> Edit
                </button>
                <button onClick={() => openSchedule(clip)} style={{ flex:1, padding:'8px', borderRadius:radius.md, background:'rgba(37,211,102,0.1)', border:'1px solid rgba(37,211,102,0.2)', color:'#25D366', fontSize:'11px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', fontFamily:"'Inter',sans-serif" }}>
                  <Icon name="calendar_month" size={13}/> Schedule
                </button>
                <button onClick={() => setShowDl(idx)} style={{ padding:'8px 10px', borderRadius:radius.md, background:gradients.primary, color:'#FAF7FF', border:'none', fontSize:'11px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', fontFamily:"'Inter',sans-serif" }}>
                  <Icon name="download" size={13}/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video player modal */}
      {playingUrl && (
        <div onClick={() => setPlayingUrl(null)} style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:400, aspectRatio:'9/16', borderRadius:radius.lg, overflow:'hidden', position:'relative' }}>
            <video src={playingUrl} controls autoPlay style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            <button onClick={() => setPlayingUrl(null)} style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.7)', border:'none', color:'#fff', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'80px 20px' }}>
          <Icon name="movie_edit" size={48} style={{ color:colors.onSurfaceVariant, marginBottom:16 }}/>
          <p style={{ fontSize:'16px', fontWeight:600, marginBottom:8 }}>No clips yet</p>
          <p style={{ fontSize:'13px', color:colors.onSurfaceVariant, marginBottom:20 }}>Import a video to generate clips</p>
          <button onClick={() => router.push('/import')} style={{ padding:'12px 28px', borderRadius:radius.md, background:gradients.primary, color:'#FAF7FF', border:'none', fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Import Video</button>
        </div>
      )}

      {/* ═══ SCHEDULE MODAL ═══ */}
      {scheduleClip && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }} onClick={() => setScheduleClip(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background:colors.surfaceContainerHigh, borderRadius:radius.xl, padding:'32px', width:'100%', maxWidth:'480px', animation:'fadeInUp 0.25s ease-out' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <h3 style={{ fontSize:'20px', fontWeight:700 }}>Schedule to Calendar</h3>
              <button onClick={() => setScheduleClip(null)} style={{ background:'none', border:'none', cursor:'pointer', color:colors.onSurfaceVariant }}><Icon name="close" size={22}/></button>
            </div>

            {/* Clip preview */}
            <div style={{ background:colors.surfaceContainer, borderRadius:radius.md, padding:'14px', marginBottom:'20px', display:'flex', gap:'12px', alignItems:'center' }}>
              <div style={{ width:44, height:44, borderRadius:radius.md, background:'rgba(192,193,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name="movie" size={20} style={{ color:colors.primary }}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:'13px', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{scheduleClip.title}</p>
                <p style={{ fontSize:'11px', color:colors.onSurfaceVariant }}>Score: {scheduleClip.virality_score} · {formatDuration(scheduleClip.duration)}</p>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              {/* Caption */}
              <div>
                <label style={{ fontSize:'12px', fontWeight:600, color:colors.onSurfaceVariant, display:'block', marginBottom:'6px' }}>Caption</label>
                <textarea rows={3} value={schedCaption} onChange={e => setSchedCaption(e.target.value)} placeholder="Write your post caption..." style={{ ...inputField, resize:'vertical' as any, minHeight:'80px' }}/>
              </div>

              {/* Hashtags */}
              <div>
                <label style={{ fontSize:'12px', fontWeight:600, color:colors.onSurfaceVariant, display:'block', marginBottom:'6px' }}>Hashtags</label>
                <input value={schedHashtags} onChange={e => setSchedHashtags(e.target.value)} placeholder="#ai #viral #shorts" style={inputField}/>
              </div>

              {/* Date & Time */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:600, color:colors.onSurfaceVariant, display:'block', marginBottom:'6px' }}>Date</label>
                  <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} style={inputField}/>
                </div>
                <div>
                  <label style={{ fontSize:'12px', fontWeight:600, color:colors.onSurfaceVariant, display:'block', marginBottom:'6px' }}>Time</label>
                  <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} style={inputField}/>
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label style={{ fontSize:'12px', fontWeight:600, color:colors.onSurfaceVariant, display:'block', marginBottom:'6px' }}>Platforms</label>
                <div style={{ display:'flex', gap:'8px' }}>
                  {[{n:'TikTok',k:'tiktok',i:'music_note'},{n:'Reels',k:'reels',i:'photo_camera'},{n:'Shorts',k:'shorts',i:'smart_display'}].map(p => (
                    <button key={p.k} onClick={() => togglePlatform(p.k)} style={{
                      flex:1, padding:'10px', borderRadius:radius.md, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:600, border:'none',
                      background: schedPlatforms.includes(p.k) ? 'rgba(192,193,255,0.15)' : colors.surfaceContainer,
                      color: schedPlatforms.includes(p.k) ? colors.primary : colors.onSurfaceVariant,
                      outline: schedPlatforms.includes(p.k) ? '1px solid '+colors.primary : '1px solid '+colors.outlineVariant,
                    }}>
                      <Icon name={p.i} size={16}/>{p.n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule button */}
              <button onClick={handleSchedule} style={{ background:gradients.primary, color:'#FAF7FF', fontWeight:700, padding:'14px', borderRadius:radius.md, border:'none', cursor:'pointer', fontSize:'14px', marginTop:'8px', fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                <Icon name="calendar_month" size={18}/> Schedule Post
              </button>

              {/* Go to calendar link */}
              <button onClick={() => { setScheduleClip(null); router.push('/calendar'); }} style={{ background:'transparent', border:'1px solid '+colors.outlineVariant, color:colors.onSurfaceVariant, padding:'10px', borderRadius:radius.md, fontSize:'13px', cursor:'pointer', fontFamily:"'Inter',sans-serif", textAlign:'center' }}>
                View Content Calendar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {preview !== null && filtered[preview] && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }} onClick={() => setPreview(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width:320, borderRadius:radius.xl, overflow:'hidden', background:colors.surfaceContainerHigh }}>
            <div style={{ aspectRatio:'9/16', background:'linear-gradient(180deg,'+colors.surfaceContainer+',rgba(93,96,235,0.1))', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="play_arrow" filled size={32} style={{ color:'#fff' }}/></div>
              <div style={{ position:'absolute', bottom:16, left:16, right:16, background:'rgba(0,0,0,0.7)', padding:'8px 12px', borderRadius:radius.md }}><p style={{ fontSize:'13px', color:'#fff', fontWeight:600 }}>{filtered[preview].title}</p></div>
            </div>
            <div style={{ padding:'16px', display:'flex', gap:'8px' }}>
              <button onClick={() => { setPreview(null); router.push('/editor'); }} style={{ flex:1, padding:'10px', borderRadius:radius.md, background:gradients.primary, color:'#FAF7FF', border:'none', fontWeight:600, fontSize:'13px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Edit Clip</button>
              <button onClick={() => { openSchedule(filtered[preview]); setPreview(null); }} style={{ flex:1, padding:'10px', borderRadius:radius.md, background:'rgba(37,211,102,0.1)', border:'1px solid rgba(37,211,102,0.2)', color:'#25D366', fontWeight:600, fontSize:'13px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Schedule</button>
              <button onClick={() => setPreview(null)} style={{ padding:'10px', borderRadius:radius.md, background:colors.surfaceContainer, border:'1px solid '+colors.outlineVariant, color:colors.onSurface, cursor:'pointer' }}><Icon name="close" size={18}/></button>
            </div>
          </div>
        </div>
      )}

      {/* Download modal */}
      {showDl !== null && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }} onClick={() => setShowDl(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background:colors.surfaceContainerHigh, borderRadius:radius.xl, padding:'32px', width:'100%', maxWidth:'400px' }}>
            <h3 style={{ fontSize:'18px', fontWeight:700, marginBottom:'20px' }}>Download Options</h3>
            {[{label:'MP4 720p',sub:'Free plan'},{label:'MP4 1080p',sub:'Solo Creator+'},{label:'MP4 4K',sub:'Professional+'}].map(opt => (
              <button key={opt.label} onClick={() => { alert('Downloading '+opt.label+'...'); setShowDl(null); }} style={{ width:'100%', padding:'14px 16px', borderRadius:radius.md, background:colors.surfaceContainer, border:'1px solid '+colors.outlineVariant, color:colors.onSurface, fontSize:'14px', fontWeight:600, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', fontFamily:"'Inter',sans-serif" }}>
                <span>{opt.label}</span>
                <span style={{ fontSize:'11px', color:colors.onSurfaceVariant }}>{opt.sub}</span>
              </button>
            ))}
            <button onClick={() => setShowDl(null)} style={{ width:'100%', padding:'10px', borderRadius:radius.md, background:'transparent', border:'1px solid '+colors.outlineVariant, color:colors.onSurfaceVariant, fontSize:'13px', cursor:'pointer', marginTop:'8px', fontFamily:"'Inter',sans-serif" }}>Cancel</button>
          </div>
        </div>
      )}

      <style>{'@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@media(max-width:640px){.clips-grid{grid-template-columns:1fr!important}}'}</style>
    </DashboardLayout>
  );
}
