'use client';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors as _colors, gradients, radius } from '@/lib/tokens';

const colors = {
  ..._colors,
  background: '#E4E2DD',
  surfaceContainer: '#EFECEA',
  surfaceContainerHigh: '#EFECEA',
  surfaceContainerHighest: '#E8E5DF',
  surfaceContainerLowest: '#F5F3EF',
  onSurface: '#1A1714',
  onSurfaceVariant: '#6B6560',
  outlineVariant: 'rgba(0,0,0,0.12)',
};

type Clip = {
  id?: string; title: string; hook_text: string; start_time: number; end_time: number;
  virality_score: number; suggested_caption: string; hashtags: string;
  platform: string; clip_url?: string; video_url?: string; download_url?: string; thumbnail_url?: string; duration: number; status?: string;
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
  const [downloadingIdx, setDownloadingIdx] = useState<number|null>(null);

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

  async function handleClipDownload(clip: Clip, idx: number) {
    const url = clip.download_url || clip.clip_url || clip.video_url;
    if (!url) return;
    setDownloadingIdx(idx);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = (clip.title ? clip.title.replace(/\s+/g, '_') : 'clip') + '.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    } finally {
      setDownloadingIdx(null);
    }
  }

  return (
    <DashboardLayout title="Generated Clips" subtitle={clips.length + ' clips ready'} bg="#E4E2DD" titleColor="#1A1714" subtitleColor="#6B6560">
      {/* Filters */}
      <div className="clips-filters" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
        <div style={{ display:'flex', gap:'8px' }}>
          {SORTS.map(o => <button key={o} onClick={() => setSort(o)} style={{ padding:'8px 16px', borderRadius:radius.full, background:sort===o?colors.primary:'#EFECEA', color:sort===o?'#fff':colors.onSurfaceVariant, border:sort===o?'none':'1px solid rgba(0,0,0,0.08)', fontWeight:600, fontSize:'12px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>{o}</button>)}
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          {PLATS.map(p => <button key={p} onClick={() => setPlat(p)} style={{ padding:'8px 14px', borderRadius:radius.full, background:plat===p?colors.surfaceContainerHighest:'transparent', color:plat===p?colors.onSurface:colors.onSurfaceVariant, border:plat===p?'1px solid '+colors.outlineVariant:'1px solid transparent', fontWeight:500, fontSize:'12px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>{p}</button>)}
        </div>
      </div>

      {/* Clips grid */}
      <div className="clips-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'16px' }}>
        {filtered.map((clip, idx) => {
          const previewSrc = clip.clip_url || clip.video_url || '';
          return (
          <div key={idx} style={{ background:colors.surfaceContainerHigh, borderRadius:radius.lg, overflow:'hidden' }}>
            {/* Thumbnail */}
            <div onClick={() => previewSrc ? setPlayingUrl(previewSrc) : setPreview(idx)} style={{ aspectRatio:'9/12', background:colors.surfaceContainer, position:'relative', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden' }}>
              {clip.thumbnail_url ? (
                <img src={clip.thumbnail_url} alt={clip.title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>
              ) : previewSrc ? (
                <video src={previewSrc} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} muted playsInline preload="metadata"/>
              ) : null}
              <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', padding:'4px 10px', borderRadius:radius.full, display:'flex', alignItems:'center', gap:'4px', zIndex:2 }}>
                <Icon name="local_fire_department" size={14} style={{ color:sc(clip.virality_score) }} filled/>
                <span style={{ fontSize:'12px', fontWeight:700, color:sc(clip.virality_score) }}>{clip.virality_score}</span>
              </div>
              <div style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.7)', padding:'4px 8px', borderRadius:radius.sm, fontSize:'11px', color:'#fff', fontWeight:600, zIndex:2 }}>{formatDuration(clip.duration)}</div>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,0.1)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:2 }}>
                <Icon name="play_arrow" filled size={28} style={{ color:'#fff' }}/>
              </div>
              <div style={{ position:'absolute', bottom:12, left:12, right:12, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', padding:'8px 12px', borderRadius:radius.md, zIndex:2 }}>
                <p style={{ fontSize:'11px', color:'#fff', fontWeight:500, lineHeight:1.4 }}>&ldquo;{clip.hook_text}&rdquo;</p>
              </div>
            </div>

            {/* Info */}
            <div style={{ padding:'16px' }}>
              <p style={{ fontSize:'13px', fontWeight:600, marginBottom:'4px', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any, color:'#1A1714' }}>{clip.title}</p>
              <p style={{ fontSize:'11px', color:colors.onSurfaceVariant, textTransform:'capitalize', marginBottom:'12px' }}>
                <Icon name="smart_display" size={12} style={{ verticalAlign:'middle', marginRight:4 }}/>{platMap(clip.platform)}
              </p>

              {/* Action buttons */}
              <div style={{ display:'flex', gap:'6px' }}>
                <button onClick={() => { sessionStorage.setItem('editor_clip', JSON.stringify({ id: clip.id, video_url: clip.clip_url || clip.video_url || '', clip_url: clip.clip_url || '', download_url: clip.download_url || clip.clip_url || clip.video_url || '', thumbnail_url: clip.thumbnail_url || '', title: clip.title, hook_text: clip.hook_text || '', virality_score: clip.virality_score, caption: clip.suggested_caption || '', hashtags: clip.hashtags || '' })); router.push('/editor'); }} style={{ flex:1, padding:'8px', borderRadius:radius.md, background:colors.surfaceContainer, border:'1px solid '+colors.outlineVariant, color:colors.onSurface, fontSize:'11px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', fontFamily:"'Inter',sans-serif" }}>
                  <Icon name="edit" size={13}/> Edit
                </button>
                <button onClick={() => handleClipDownload(clip, idx)} disabled={downloadingIdx === idx || !(clip.download_url||clip.clip_url||clip.video_url)} style={{ padding:'8px 10px', borderRadius:radius.md, background:clip.download_url||clip.clip_url||clip.video_url ? gradients.primary : colors.surfaceContainer, color:'#FAF7FF', border:'none', fontSize:'11px', fontWeight:600, cursor:clip.download_url||clip.clip_url||clip.video_url ? 'pointer' : 'default', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', opacity:downloadingIdx===idx ? 0.5 : (clip.download_url||clip.clip_url||clip.video_url ? 1 : 0.4) }}>
                  <Icon name={downloadingIdx === idx ? 'hourglass_empty' : 'download'} size={13}/>
                </button>
              </div>
            </div>
          </div>
        );
        })}
      </div>

      {/* Video player modal */}
      {playingUrl && (
        <div onClick={() => setPlayingUrl(null)} style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:400, aspectRatio:'9/16', borderRadius:radius.lg, overflow:'hidden', position:'relative' }}>
            <video src={playingUrl} controls style={{ width:'100%', height:'100%', objectFit:'cover' }} />
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


      {/* Preview modal */}
      {preview !== null && filtered[preview] && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }} onClick={() => setPreview(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width:320, borderRadius:radius.xl, overflow:'hidden', background:colors.surfaceContainerHigh }}>
            <div style={{ aspectRatio:'9/16', background:'linear-gradient(180deg,'+colors.surfaceContainer+',rgba(93,96,235,0.1))', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="play_arrow" filled size={32} style={{ color:'#fff' }}/></div>
              <div style={{ position:'absolute', bottom:16, left:16, right:16, background:'rgba(0,0,0,0.7)', padding:'8px 12px', borderRadius:radius.md }}><p style={{ fontSize:'13px', color:'#fff', fontWeight:600 }}>{filtered[preview].title}</p></div>
            </div>
            <div style={{ padding:'16px', display:'flex', gap:'8px' }}>
              <button onClick={() => { const c = filtered[preview!]; sessionStorage.setItem('editor_clip', JSON.stringify({ id: c.id, video_url: c.clip_url || c.video_url || '', clip_url: c.clip_url || '', download_url: c.download_url || c.clip_url || c.video_url || '', thumbnail_url: c.thumbnail_url || '', title: c.title, hook_text: c.hook_text || '', virality_score: c.virality_score, caption: c.suggested_caption || '', hashtags: c.hashtags || '' })); setPreview(null); router.push('/editor'); }} style={{ flex:1, padding:'10px', borderRadius:radius.md, background:gradients.primary, color:'#FAF7FF', border:'none', fontWeight:600, fontSize:'13px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Edit Clip</button>
              <button onClick={() => setPreview(null)} style={{ padding:'10px', borderRadius:radius.md, background:colors.surfaceContainer, border:'1px solid '+colors.outlineVariant, color:colors.onSurface, cursor:'pointer' }}><Icon name="close" size={18}/></button>
            </div>
          </div>
        </div>
      )}

      <style>{'@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@media(max-width:640px){.clips-grid{grid-template-columns:1fr!important}}'}</style>
    </DashboardLayout>
  );
}
