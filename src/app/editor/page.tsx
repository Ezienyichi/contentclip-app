'use client';
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { colors, gradients, radius, inputField } from '@/lib/tokens';
const CAPTIONS = [{name:'Bold Pop',fw:900,c:'#fff',bg:'rgba(0,0,0,0.8)'},{name:'Minimal',fw:500,c:'#fff',bg:'transparent'},{name:'Neon',fw:800,c:'#C0C1FF',bg:'rgba(0,0,0,0.6)'},{name:'Gradient',fw:800,c:'#fff',bg:'linear-gradient(135deg,rgba(93,96,235,0.8),rgba(192,193,255,0.5))'}];
const ADJUSTMENTS = [{cat:'Color',items:['Color Match','Color Correction','Brightness','Contrast','Saturation','Brilliance']},{cat:'Detail',items:['Sharpen','Clarity','HSL','Highlights','Shadows','Whites','Blacks']},{cat:'Atmosphere',items:['Temp','Hue','Fade','Vignette','Grain']},{cat:'Video Quality',items:['Enhance Quality','Reduce Noise','Auto Adjust','Stabilize','Optical Flow','Remove Flicker']}];
const LANGUAGES = ['English','Spanish','French','German','Portuguese','Chinese','Japanese','Korean','Arabic','Hindi','Italian','Dutch','Russian','Turkish','Polish','Swedish'];
const TRANSITIONS = ['Cut','Dissolve','Fade','Slide Left','Slide Up','Zoom In','Zoom Out','Spin','Glitch','Flash'];
export default function EditorPage() {
  const [playing,setPlaying] = useState(false);
  const [capStyle,setCapStyle] = useState(0);
  const [format,setFormat] = useState('9:16');
  const [time,setTime] = useState(12);
  const [tab,setTab] = useState<'style'|'adjust'|'export'>('style');
  const [lang,setLang] = useState('English');
  const [transition,setTransition] = useState('Cut');
  const [showExport,setShowExport] = useState(false);
  const total = 47;
  return (
    <DashboardLayout title="Clip Editor">
      <div className="editor-layout" style={{ display:'grid',gridTemplateColumns:'1fr 360px',gap:'24px' }}>
        <div>
          <div style={{ maxWidth:320,margin:'0 auto 24px',borderRadius:radius.xl,overflow:'hidden',background:colors.surfaceContainerHigh,position:'relative' }}>
            <div style={{ aspectRatio:format==='9:16'?'9/16':format==='1:1'?'1/1':format==='4:5'?'4/5':'16/9',background:'linear-gradient(180deg,'+colors.surfaceContainerLow+','+colors.surfaceContainer+',rgba(93,96,235,0.05))',position:'relative',display:'flex',alignItems:'center',justifyContent:'center',transition:'aspect-ratio 0.3s' }}>
              <div style={{ position:'absolute',bottom:60,left:16,right:16,textAlign:'center' }}><span style={{ fontSize:CAPTIONS[capStyle].name==='Minimal'?'18px':'22px',fontWeight:CAPTIONS[capStyle].fw,color:CAPTIONS[capStyle].c,background:CAPTIONS[capStyle].bg,padding:'4px 12px',borderRadius:'6px',display:'inline-block' }}>The shocking truth about AI</span></div>
              <button onClick={()=>setPlaying(!playing)} style={{ width:64,height:64,borderRadius:'50%',background:'rgba(255,255,255,0.12)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',position:'absolute' }}><Icon name={playing?'pause':'play_arrow'} filled size={32} style={{ color:'#fff' }}/></button>
            </div>
          </div>
          <div style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'20px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px' }}>
              <button onClick={()=>setPlaying(!playing)} style={{ background:'none',border:'none',cursor:'pointer',color:colors.onSurface }}><Icon name={playing?'pause':'play_arrow'} filled size={24}/></button>
              <span style={{ fontSize:'13px',fontWeight:600,fontVariantNumeric:'tabular-nums' }}>0:{time.toString().padStart(2,'0')}</span>
              <input type="range" min={0} max={total} value={time} onChange={e=>setTime(Number(e.target.value))} style={{ flex:1,accentColor:colors.primary }}/>
              <span style={{ fontSize:'13px',color:colors.onSurfaceVariant }}>0:{total}</span>
            </div>
            <div style={{ display:'flex',gap:'2px',alignItems:'end',height:'40px' }}>
              {Array.from({length:60}).map((_,i)=>{const h=Math.random()*30+10;const a=(i/60)*total<=time;return <div key={i} style={{ flex:1,height:h+'px',borderRadius:'1px',background:a?colors.primary:colors.surfaceContainer,opacity:a?1:0.4 }}/>;})}
            </div>
          </div>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:'16px' }}>
          <div style={{ display:'flex',gap:'4px',background:colors.surfaceContainerHigh,borderRadius:radius.md,padding:'3px' }}>
            {(['style','adjust','export'] as const).map(t=><button key={t} onClick={()=>setTab(t)} style={{ flex:1,padding:'8px',borderRadius:radius.sm,background:tab===t?colors.surfaceContainerHighest:'transparent',color:tab===t?colors.onSurface:colors.onSurfaceVariant,border:'none',fontWeight:600,fontSize:'12px',cursor:'pointer',fontFamily:"'Inter',sans-serif",textTransform:'capitalize' }}>{t}</button>)}
          </div>
          {tab==='style'&&<>
            <div style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'20px' }}>
              <h3 style={{ fontSize:'14px',fontWeight:700,marginBottom:'12px' }}>Format</h3>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px' }}>
                {['9:16','1:1','4:5','16:9'].map(f=><button key={f} onClick={()=>setFormat(f)} style={{ padding:'8px',borderRadius:radius.md,background:format===f?colors.primary:colors.surfaceContainer,color:format===f?'#000':colors.onSurfaceVariant,border:'none',fontWeight:600,fontSize:'12px',cursor:'pointer',fontFamily:"'Inter',sans-serif" }}>{f}</button>)}
              </div>
              <p style={{ fontSize:'10px',color:colors.onSurfaceVariant,marginTop:'8px' }}>{format==='9:16'?'TikTok, Reels, Shorts':format==='1:1'?'Instagram Feed, Twitter':format==='4:5'?'Instagram, Facebook':'YouTube, Landscape'}</p>
            </div>
            <div style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'20px' }}>
              <h3 style={{ fontSize:'14px',fontWeight:700,marginBottom:'12px' }}>Caption Style</h3>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px' }}>{CAPTIONS.map((cs,i)=><button key={cs.name} onClick={()=>setCapStyle(i)} style={{ padding:'12px',borderRadius:radius.md,background:capStyle===i?'rgba(192,193,255,0.1)':colors.surfaceContainer,border:capStyle===i?'1px solid rgba(192,193,255,0.3)':'1px solid transparent',cursor:'pointer' }}><span style={{ fontSize:'14px',fontWeight:cs.fw,color:cs.c==='#C0C1FF'?cs.c:'#fff' }}>{cs.name}</span></button>)}</div>
            </div>
            <div style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'20px' }}>
              <h3 style={{ fontSize:'14px',fontWeight:700,marginBottom:'12px' }}>Language</h3>
              <select value={lang} onChange={e=>setLang(e.target.value)} style={{ ...inputField,fontSize:'13px' }}>{LANGUAGES.map(l=><option key={l} value={l}>{l}</option>)}</select>
            </div>
            <div style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'20px' }}>
              <h3 style={{ fontSize:'14px',fontWeight:700,marginBottom:'12px' }}>Transition</h3>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'6px' }}>{TRANSITIONS.map(t=><button key={t} onClick={()=>setTransition(t)} style={{ padding:'8px',borderRadius:radius.md,background:transition===t?'rgba(192,193,255,0.1)':colors.surfaceContainer,border:transition===t?'1px solid rgba(192,193,255,0.3)':'1px solid transparent',color:transition===t?colors.primary:colors.onSurfaceVariant,fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif" }}>{t}</button>)}</div>
            </div>
          </>}
          {tab==='adjust'&&<div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
            {ADJUSTMENTS.map(cat=><div key={cat.cat} style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'20px' }}>
              <h3 style={{ fontSize:'13px',fontWeight:700,marginBottom:'12px',color:colors.primary }}>{cat.cat}</h3>
              {cat.items.map(item=><div key={item} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px' }}>
                <span style={{ fontSize:'12px',color:colors.onSurfaceVariant }}>{item}</span>
                <input type="range" min={-100} max={100} defaultValue={0} style={{ width:'120px',accentColor:colors.primary }}/>
              </div>)}
            </div>)}
          </div>}
          {tab==='export'&&<div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
            <div style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'20px',textAlign:'center' }}>
              <p style={{ fontSize:'11px',fontWeight:600,color:colors.onSurfaceVariant,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'8px' }}>Virality Score</p>
              <p style={{ fontSize:'48px',fontWeight:900,color:'#4ade80' }}>94</p>
            </div>
            <button onClick={()=>setShowExport(true)} style={{ background:gradients.primary,color:'#FAF7FF',fontWeight:700,padding:'14px',borderRadius:radius.md,border:'none',cursor:'pointer',fontSize:'14px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',fontFamily:"'Inter',sans-serif" }}><Icon name="download" size={18}/> Export Clip</button>
            <div style={{ display:'flex',gap:'8px' }}>
              {[{i:'smart_display',l:'Shorts',c:'#FF0000'},{i:'music_note',l:'TikTok',c:'#fff'},{i:'photo_camera',l:'Reels',c:'#E1306C'}].map(p=><button key={p.l} onClick={()=>alert('Exporting to '+p.l+'...')} style={{ flex:1,padding:'10px',borderRadius:radius.md,background:colors.surfaceContainer,border:'1px solid '+colors.outlineVariant,color:colors.onSurface,fontSize:'11px',fontWeight:600,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',fontFamily:"'Inter',sans-serif" }}><Icon name={p.i} size={18} style={{ color:p.c }}/>{p.l}</button>)}
            </div>
          </div>}
        </div>
      </div>
      {showExport&&<div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px' }} onClick={()=>setShowExport(false)}>
        <div onClick={e=>e.stopPropagation()} style={{ background:colors.surfaceContainerHigh,borderRadius:radius.xl,padding:'32px',width:'100%',maxWidth:'400px' }}>
          <h3 style={{ fontSize:'18px',fontWeight:700,marginBottom:'20px' }}>Export Quality</h3>
          {[{l:'MP4 720p',s:'Free'},{l:'MP4 1080p',s:'Solo+'},{l:'MP4 2K',s:'Pro+'},{l:'MP4 4K',s:'Pro+'},{l:'ProRes 4K',s:'Agency'}].map(o=><button key={o.l} onClick={()=>{alert('Exporting '+o.l);setShowExport(false);}} style={{ width:'100%',padding:'14px 16px',borderRadius:radius.md,background:colors.surfaceContainer,border:'1px solid '+colors.outlineVariant,color:colors.onSurface,fontSize:'14px',fontWeight:600,cursor:'pointer',display:'flex',justifyContent:'space-between',marginBottom:'8px',fontFamily:"'Inter',sans-serif" }}><span>{o.l}</span><span style={{ fontSize:'11px',color:colors.onSurfaceVariant }}>{o.s}</span></button>)}
        </div>
      </div>}
      <style>{'@media(max-width:768px){.editor-layout{grid-template-columns:1fr!important}}'}</style>
    </DashboardLayout>
  );
}
