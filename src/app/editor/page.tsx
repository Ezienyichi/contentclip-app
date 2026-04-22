'use client';
import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors, gradients, radius, inputField } from '@/lib/tokens';

const CAPTIONS = [{name:'Bold Pop',fw:900,c:'#fff',bg:'rgba(0,0,0,0.8)'},{name:'Minimal',fw:500,c:'#fff',bg:'transparent'},{name:'Neon',fw:800,c:'#C0C1FF',bg:'rgba(0,0,0,0.6)'},{name:'Gradient',fw:800,c:'#fff',bg:'linear-gradient(135deg,rgba(93,96,235,0.8),rgba(192,193,255,0.5))'}];
const ADJUSTMENTS = [{cat:'Color',items:['Color Match','Color Correction','Brightness','Contrast','Saturation','Brilliance']},{cat:'Detail',items:['Sharpen','Clarity','HSL','Highlights','Shadows','Whites','Blacks']},{cat:'Atmosphere',items:['Temp','Hue','Fade','Vignette','Grain']},{cat:'Video Quality',items:['Enhance Quality','Reduce Noise','Auto Adjust','Stabilize','Optical Flow','Remove Flicker']}];
const LANGUAGES = ['English','Spanish','French','German','Portuguese','Chinese','Japanese','Korean','Arabic','Hindi','Italian','Dutch','Russian','Turkish','Polish','Swedish'];
const TRANSITIONS = ['Cut','Dissolve','Fade','Slide Left','Slide Up','Zoom In','Zoom Out','Spin','Glitch','Flash'];

type Overlay = { id: string; url: string; name: string; opacity: number };

export default function EditorPage() {
  const router = useRouter();
  const [playing, setPlaying] = useState(false);
  const [capStyle, setCapStyle] = useState(0);
  const [format, setFormat] = useState('9:16');
  const [time, setTime] = useState(12);
  const [tab, setTab] = useState<'style'|'adjust'|'overlay'|'export'>('style');
  const [lang, setLang] = useState('English');
  const [transition, setTransition] = useState('Cut');
  const [showExport, setShowExport] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  // Overlay/Logo state
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [removeBg, setRemoveBg] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Schedule state
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('12:00');
  const [schedCaption, setSchedCaption] = useState('');
  const [schedHashtags, setSchedHashtags] = useState('');
  const [schedPlatforms, setSchedPlatforms] = useState<string[]>(['tiktok']);

  const total = 47;

  // ── Logo Upload with optional BG removal ──
  async function handleLogoUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', 'current_user');
      formData.append('removeBg', removeBg ? 'true' : 'false');

      const res = await fetch('/api/upload/overlay', { method: 'POST', body: formData });

      if (res.ok) {
        const data = await res.json();
        setOverlays(prev => [...prev, {
          id: 'ov_' + Date.now(),
          url: data.url,
          name: file.name,
          opacity: 100,
        }]);
      } else {
        // Fallback: use local preview if API not available
        const localUrl = URL.createObjectURL(file);
        setOverlays(prev => [...prev, {
          id: 'ov_' + Date.now(),
          url: localUrl,
          name: file.name,
          opacity: 100,
        }]);
      }
    } catch {
      // Fallback: local preview
      const localUrl = URL.createObjectURL(file);
      setOverlays(prev => [...prev, {
        id: 'ov_' + Date.now(),
        url: localUrl,
        name: file.name,
        opacity: 100,
      }]);
    } finally {
      setUploading(false);
    }
  }

  function removeOverlay(id: string) {
    setOverlays(prev => prev.filter(o => o.id !== id));
  }

  function updateOverlayOpacity(id: string, opacity: number) {
    setOverlays(prev => prev.map(o => o.id === id ? { ...o, opacity } : o));
  }

  // ── Schedule to Calendar ──
  function togglePlatform(p: string) {
    setSchedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function handleSchedule() {
    if (!schedDate) { alert('Please select a date'); return; }
    const existing = JSON.parse(sessionStorage.getItem('hookclip_scheduled') || '[]');
    existing.push({
      id: Date.now().toString(),
      clip_title: 'Edited Clip',
      hook_text: 'The shocking truth about AI',
      virality_score: 94,
      caption: schedCaption,
      hashtags: schedHashtags,
      platforms: schedPlatforms,
      scheduled_date: schedDate,
      scheduled_time: schedTime,
      status: 'scheduled',
    });
    sessionStorage.setItem('hookclip_scheduled', JSON.stringify(existing));
    setShowSchedule(false);
    router.push('/calendar');
  }

  return (
    <DashboardLayout title="Clip Editor">
      <div className="editor-layout" style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:'24px' }}>
        {/* ═══ LEFT: Video Preview ═══ */}
        <div>
          <div style={{ maxWidth:320, margin:'0 auto 24px', borderRadius:radius.xl, overflow:'hidden', background:colors.surfaceContainerHigh, position:'relative' }}>
            <div style={{ aspectRatio:format==='9:16'?'9/16':format==='1:1'?'1/1':format==='4:5'?'4/5':'16/9', background:'linear-gradient(180deg,'+colors.surfaceContainerLow+','+colors.surfaceContainer+',rgba(93,96,235,0.05))', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', transition:'aspect-ratio 0.3s' }}>

              {/* Overlays rendered on preview */}
              {overlays.map(ov => (
                <img key={ov.id} src={ov.url} alt={ov.name} style={{
                  position:'absolute', top:16, right:16, width:80, height:'auto',
                  opacity: ov.opacity / 100, objectFit:'contain', pointerEvents:'none',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                }}/>
              ))}

              {/* Caption preview */}
              <div style={{ position:'absolute', bottom:60, left:16, right:16, textAlign:'center' }}>
                <span style={{ fontSize:CAPTIONS[capStyle].name==='Minimal'?'18px':'22px', fontWeight:CAPTIONS[capStyle].fw, color:CAPTIONS[capStyle].c, background:CAPTIONS[capStyle].bg, padding:'4px 12px', borderRadius:'6px', display:'inline-block' }}>The shocking truth about AI</span>
              </div>

              {/* Play button */}
              <button onClick={() => setPlaying(!playing)} style={{ width:64, height:64, borderRadius:'50%', background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'absolute' }}>
                <Icon name={playing?'pause':'play_arrow'} filled size={32} style={{ color:'#fff' }}/>
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background:colors.surfaceContainerHigh, borderRadius:radius.lg, padding:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
              <button onClick={() => setPlaying(!playing)} style={{ background:'none', border:'none', cursor:'pointer', color:colors.onSurface }}><Icon name={playing?'pause':'play_arrow'} filled size={24}/></button>
              <span style={{ fontSize:'13px', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>0:{time.toString().padStart(2,'0')}</span>
              <input type="range" min={0} max={total} value={time} onChange={e => setTime(Number(e.target.value))} style={{ flex:1, accentColor:colors.primary }}/>
              <span style={{ fontSize:'13px', color:colors.onSurfaceVariant }}>0:{total}</span>
            </div>
            <div style={{ display:'flex', gap:'2px', alignItems:'end', height:'40px' }}>
              {Array.from({length:60}).map((_,i) => { const h = Math.random()*30+10; const a = (i/60)*total<=time; return <div key={i} style={{ flex:1, height:h+'px', borderRadius:'1px', background:a?colors.primary:colors.surfaceContainer, opacity:a?1:0.4 }}/>; })}
            </div>
          </div>

          {/* ═══ BOTTOM ACTION BAR ═══ */}
          <div style={{ display:'flex', gap:'8px', marginTop:'16px' }}>
            <button onClick={() => alert('Clip saved!')} style={{ flex:1, padding:'12px', borderRadius:radius.md, background:colors.surfaceContainerHigh, border:'1px solid '+colors.outlineVariant, color:colors.onSurface, fontSize:'13px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontFamily:"'Inter',sans-serif" }}>
              <Icon name="save" size={16}/> Save
            </button>
            <button onClick={() => setShowSchedule(true)} style={{ flex:1, padding:'12px', borderRadius:radius.md, background:'rgba(37,211,102,0.1)', border:'1px solid rgba(37,211,102,0.2)', color:'#25D366', fontSize:'13px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontFamily:"'Inter',sans-serif" }}>
              <Icon name="calendar_month" size={16}/> Move to Scheduler
            </button>
          </div>
        </div>

        {/* ═══ RIGHT: Controls Panel ═══ */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {/* Tab bar — added 'overlay' tab */}
          <div style={{ display:'flex', gap:'4px', background:colors.surfaceContainerHigh, borderRadius:radius.md, padding:'3px' }}>
            {(['style','adjust','overlay','export'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'8px', borderRadius:radius.sm, background:tab===t?colors.surfaceContainerHighest:'transparent', color:tab===t?colors.onSurface:colors.onSurfaceVariant, border:'none', fontWeight:600, fontSize:'11px', cursor:'pointer', fontFamily:"'Inter',sans-serif", textTransform:'capitalize' }}>
                {t === 'overlay' ? 'Logo' : t}
              </button>
            ))}
          </div>

          {/* ═══ STYLE TAB ═══ */}
          {tab==='style' && <>
            <div style={{ background:colors.surfaceContainerHigh, borderRadius:radius.lg, padding:'20px' }}>
              <h3 style={{ fontSize:'14px', fontWeight:700, marginBottom:'12px' }}>Format</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px' }}>
                {['9:16','1:1','4:5','16:9'].map(f => <button key={f} onClick={() => setFormat(f)} style={{ padding:'8px', borderRadius:radius.md, background:format===f?colors.primary:colors.surfaceContainer, color:format===f?'#000':colors.onSurfaceVariant, border:'none', fontWeight:600, fontSize:'12px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>{f}</button>)}
              </div>
              <p style={{ fontSize:'10px', color:colors.onSurfaceVariant, marginTop:'8px' }}>{format==='9:16'?'TikTok, Reels, Shorts':format==='1:1'?'Instagram Feed, Twitter':format==='4:5'?'Instagram, Facebook':'YouTube, Landscape'}</p>
            </div>
            <div style={{ background:colors.surfaceContainerHigh, borderRadius:radius.lg, padding:'20px' }}>
              <h3 style={{ fontSize:'14px', fontWeight:700, marginBottom:'12px' }}>Caption Style</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                {CAPTIONS.map((cs,i) => <button key={cs.name} onClick={() => setCapStyle(i)} style={{ padding:'12px', borderRadius:radius.md, background:capStyle===i?'rgba(192,193,255,0.1)':colors.surfaceContainer, border:capStyle===i?'1px solid rgba(192,193,255,0.3)':'1px solid transparent', cursor:'pointer' }}><span style={{ fontSize:'14px', fontWeight:cs.fw, color:cs.c==='#C0C1FF'?cs.c:'#fff' }}>{cs.name}</span></button>)}
              </div>
            </div>
            <div style={{ background:colors.surfaceContainerHigh, borderRadius:radius.lg, padding:'20px' }}>
              <h3 style={{ fontSize:'14px', fontWeight:700, marginBottom:'12px' }}>Language</h3>
              <select value={lang} onChange={e => setLang(e.target.value)} style={{ ...inputField, fontSize:'13px' }}>{LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}</select>
            </div>
            <div style={{ background:colors.surfaceContainerHigh, borderRadius:radius.lg, padding:'20px' }}>
              <h3 style={{ fontSize:'14px', fontWeight:700, marginBottom:'12px' }}>Transition</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'6px' }}>
                {TRANSITIONS.map(t => <button key={t} onClick={() => setTransition(t)} style={{ padding:'8px', borderRadius:radius.md, background:transition===t?'rgba(192,193,255,0.1)':colors.surfaceContainer, border:transition===t?'1px solid rgba(192,193,255,0.3)':'1px solid transparent', color:transition===t?colors.primary:colors.onSurfaceVariant, fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>{t}</button>)}
              </div>
            </div>
          </>}

          {/* ═══ ADJUST TAB ═══ */}
          {tab==='adjust' && <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {ADJUSTMENTS.map(cat => <div key={cat.cat} style={{ background:colors.surfaceContainerHigh, borderRadius:radius.lg, padding:'20px' }}>
              <h3 style={{ fontSize:'13px', fontWeight:700, marginBottom:'12px', color:colors.primary }}>{cat.cat}</h3>
              {cat.items.map(item => <div key={item} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                <span style={{ fontSize:'12px', color:colors.onSurfaceVariant }}>{item}</span>
                <input type="range" min={-100} max={100} defaultValue={0} style={{ width:'120px', accentColor:colors.primary }}/>
              </div>)}
            </div>)}
          </div>}

          {/* ═══ OVERLAY/LOGO TAB ═══ */}
          {tab==='overlay' && <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ background:colors.surfaceContainerHigh, borderRadius:radius.lg, padding:'20px' }}>
              <h3 style={{ fontSize:'14px', fontWeight:700, marginBottom:'6px' }}>Logo & Overlay</h3>
              <p style={{ fontSize:'12px', color:colors.onSurfaceVariant, marginBottom:'16px' }}>Upload your logo or watermark. Background removal is automatic.</p>

              {/* Remove BG toggle */}
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
                <div onClick={() => setRemoveBg(!removeBg)} style={{ width:40, height:22, borderRadius:11, padding:2, cursor:'pointer', background:removeBg?colors.primary:colors.surfaceContainer, transition:'all 0.2s' }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', transform:removeBg?'translateX(18px)':'translateX(0)', transition:'transform 0.2s' }}/>
                </div>
                <span style={{ fontSize:'12px', color:colors.onSurfaceVariant }}>Auto-remove background</span>
              </div>

              {/* Upload area */}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}/>
              <div onClick={() => fileRef.current?.click()} style={{ border:'2px dashed '+colors.outlineVariant, borderRadius:radius.lg, padding:'28px 16px', textAlign:'center', cursor:'pointer', transition:'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = colors.primary)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = colors.outlineVariant)}>
                {uploading ? (
                  <p style={{ color:colors.primary, fontSize:'13px', fontWeight:500 }}>{removeBg ? 'Removing background...' : 'Uploading...'}</p>
                ) : (
                  <>
                    <Icon name="cloud_upload" size={28} style={{ color:colors.onSurfaceVariant, margin:'0 auto 8px', display:'block' }}/>
                    <p style={{ fontSize:'13px', color:colors.onSurfaceVariant, fontWeight:500 }}>Click to upload logo</p>
                    <p style={{ fontSize:'11px', color:colors.onSurfaceVariant, marginTop:'4px' }}>PNG, JPG, SVG — max 10MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Active overlays */}
            {overlays.length > 0 && (
              <div style={{ background:colors.surfaceContainerHigh, borderRadius:radius.lg, padding:'20px' }}>
                <h3 style={{ fontSize:'13px', fontWeight:700, marginBottom:'12px' }}>Active Overlays</h3>
                {overlays.map(ov => (
                  <div key={ov.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px', background:colors.surfaceContainer, borderRadius:radius.md, marginBottom:'8px' }}>
                    <img src={ov.url} alt={ov.name} style={{ width:36, height:36, borderRadius:6, objectFit:'contain', background:colors.surfaceContainerHigh }}/>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:'11px', color:colors.onSurface, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ov.name}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'4px' }}>
                        <span style={{ fontSize:'10px', color:colors.onSurfaceVariant }}>{ov.opacity}%</span>
                        <input type="range" min={10} max={100} value={ov.opacity} onChange={e => updateOverlayOpacity(ov.id, +e.target.value)} style={{ width:'80px', accentColor:colors.primary }}/>
                      </div>
                    </div>
                    <button onClick={() => removeOverlay(ov.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', padding:4, fontSize:16 }}>
                      <Icon name="delete" size={16}/>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Logo position guide */}
            <div style={{ background:colors.surfaceContainerHigh, borderRadius:radius.lg, padding:'20px' }}>
              <h3 style={{ fontSize:'13px', fontWeight:700, marginBottom:'12px' }}>Logo Position</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px' }}>
                {['Top Left','Top Center','Top Right','Mid Left','Center','Mid Right','Bot Left','Bot Center','Bot Right'].map(pos => (
                  <button key={pos} style={{ padding:'8px', borderRadius:radius.md, background:pos==='Top Right'?'rgba(192,193,255,0.1)':colors.surfaceContainer, border:pos==='Top Right'?'1px solid rgba(192,193,255,0.3)':'1px solid transparent', color:pos==='Top Right'?colors.primary:colors.onSurfaceVariant, fontSize:'10px', fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>{pos}</button>
                ))}
              </div>
            </div>
          </div>}

          {/* ═══ EXPORT TAB ═══ */}
          {tab==='export' && <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ background:colors.surfaceContainerHigh, borderRadius:radius.lg, padding:'20px', textAlign:'center' }}>
              <p style={{ fontSize:'11px', fontWeight:600, color:colors.onSurfaceVariant, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px' }}>Virality Score</p>
              <p style={{ fontSize:'48px', fontWeight:900, color:'#4ade80' }}>94</p>
            </div>

            {/* Export button */}
            <button onClick={() => setShowExport(true)} style={{ background:gradients.primary, color:'#FAF7FF', fontWeight:700, padding:'14px', borderRadius:radius.md, border:'none', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:"'Inter',sans-serif" }}>
              <Icon name="download" size={18}/> Export Clip
            </button>

            {/* Platform quick export */}
            <div style={{ display:'flex', gap:'8px' }}>
              {[{i:'smart_display',l:'Shorts',c:'#FF0000'},{i:'music_note',l:'TikTok',c:'#fff'},{i:'photo_camera',l:'Reels',c:'#E1306C'}].map(p => (
                <button key={p.l} onClick={() => alert('Exporting to '+p.l+'...')} style={{ flex:1, padding:'10px', borderRadius:radius.md, background:colors.surfaceContainer, border:'1px solid '+colors.outlineVariant, color:colors.onSurface, fontSize:'11px', fontWeight:600, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', fontFamily:"'Inter',sans-serif" }}>
                  <Icon name={p.i} size={18} style={{ color:p.c }}/>{p.l}
                </button>
              ))}
            </div>

            {/* ═══ MOVE TO SCHEDULER ═══ */}
            <div style={{ borderTop:'1px solid '+colors.outlineVariant, paddingTop:'16px', marginTop:'4px' }}>
              <p style={{ fontSize:'12px', fontWeight:600, color:colors.onSurfaceVariant, marginBottom:'10px' }}>Or schedule this clip for later:</p>
              <button onClick={() => setShowSchedule(true)} style={{ width:'100%', padding:'14px', borderRadius:radius.md, background:'rgba(37,211,102,0.08)', border:'1px solid rgba(37,211,102,0.2)', color:'#25D366', fontSize:'14px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:"'Inter',sans-serif" }}>
                <Icon name="calendar_month" size={18}/> Move to Scheduler →
              </button>
            </div>
          </div>}
        </div>
      </div>

      {/* ═══ EXPORT MODAL ═══ */}
      {showExport && <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }} onClick={() => setShowExport(false)}>
        <div onClick={e => e.stopPropagation()} style={{ background:colors.surfaceContainerHigh, borderRadius:radius.xl, padding:'32px', width:'100%', maxWidth:'400px' }}>
          <h3 style={{ fontSize:'18px', fontWeight:700, marginBottom:'20px' }}>Export Quality</h3>
          {[{l:'MP4 720p',s:'Free'},{l:'MP4 1080p',s:'Solo+'},{l:'MP4 2K',s:'Pro+'},{l:'MP4 4K',s:'Pro+'},{l:'ProRes 4K',s:'Agency'}].map(o => (
            <button key={o.l} onClick={() => { alert('Exporting '+o.l); setShowExport(false); }} style={{ width:'100%', padding:'14px 16px', borderRadius:radius.md, background:colors.surfaceContainer, border:'1px solid '+colors.outlineVariant, color:colors.onSurface, fontSize:'14px', fontWeight:600, cursor:'pointer', display:'flex', justifyContent:'space-between', marginBottom:'8px', fontFamily:"'Inter',sans-serif" }}>
              <span>{o.l}</span><span style={{ fontSize:'11px', color:colors.onSurfaceVariant }}>{o.s}</span>
            </button>
          ))}
        </div>
      </div>}

      {/* ═══ SCHEDULE MODAL ═══ */}
      {showSchedule && <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }} onClick={() => setShowSchedule(false)}>
        <div onClick={e => e.stopPropagation()} style={{ background:colors.surfaceContainerHigh, borderRadius:radius.xl, padding:'32px', width:'100%', maxWidth:'480px', animation:'fadeInUp 0.25s ease-out' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
            <h3 style={{ fontSize:'20px', fontWeight:700 }}>Schedule to Calendar</h3>
            <button onClick={() => setShowSchedule(false)} style={{ background:'none', border:'none', cursor:'pointer', color:colors.onSurfaceVariant }}><Icon name="close" size={22}/></button>
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
            <button onClick={handleSchedule} style={{ background:gradients.primary, color:'#FAF7FF', fontWeight:700, padding:'14px', borderRadius:radius.md, border:'none', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:"'Inter',sans-serif" }}>
              <Icon name="calendar_month" size={18}/> Schedule Post
            </button>
          </div>
        </div>
      </div>}

      <style>{'@media(max-width:768px){.editor-layout{grid-template-columns:1fr!important}}@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}'}</style>
    </DashboardLayout>
  );
}
