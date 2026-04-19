'use client';
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors, gradients, radius } from '@/lib/tokens';
const CLIPS = [
  { id:'1',title:'The shocking truth about AI replacing jobs',hook:'You won\'t believe what happened next...',score:94,duration:'0:47',status:'ready',platform:'tiktok' },
  { id:'2',title:'Why morning routines are overrated',hook:'Stop doing this every morning',score:88,duration:'0:32',status:'ready',platform:'reels' },
  { id:'3',title:'The $1 tool that changed my workflow',hook:'This cheap tool outperforms everything',score:82,duration:'0:55',status:'ready',platform:'shorts' },
  { id:'4',title:'Debate: Is remote work dying?',hook:'CEOs don\'t want you to know this',score:79,duration:'0:41',status:'ready',platform:'tiktok' },
  { id:'5',title:'How to grow from 0 to 10K followers',hook:'The strategy nobody talks about',score:76,duration:'1:02',status:'ready',platform:'reels' },
  { id:'6',title:'Unpopular opinion about productivity',hook:'Working less actually works better',score:71,duration:'0:38',status:'ready',platform:'shorts' },
];
const SORTS = ['Most Viral','Newest','Longest','Shortest'];
const PLATS = ['All','TikTok','Reels','Shorts'];
export default function ClipsPage() {
  const router = useRouter();
  const [sort,setSort] = useState('Most Viral');
  const [plat,setPlat] = useState('All');
  const [preview,setPreview] = useState<string|null>(null);
  const [showDl,setShowDl] = useState<string|null>(null);
  const filtered = CLIPS.filter(c=>plat==='All'||c.platform.toLowerCase()===plat.toLowerCase()).sort((a,b)=>sort==='Most Viral'?b.score-a.score:0);
  const sc = (s:number) => s>=85?'#4ade80':s>=70?'#C0C1FF':'#fbbf24';
  const handleShare = (clip:typeof CLIPS[0]) => { navigator.clipboard.writeText('https://hookclip.app/share/'+clip.id); alert('Share link copied to clipboard!'); };
  return (
    <DashboardLayout title="Generated Clips" subtitle={CLIPS.length+' clips from "How AI is Changing Everything"'}>
      <div className="clips-filters" style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px',flexWrap:'wrap',gap:'12px' }}>
        <div style={{ display:'flex',gap:'8px' }}>{SORTS.map(o=><button key={o} onClick={()=>setSort(o)} style={{ padding:'8px 16px',borderRadius:radius.full,background:sort===o?colors.primary:colors.surfaceContainerHigh,color:sort===o?'#000':colors.onSurfaceVariant,border:'none',fontWeight:600,fontSize:'12px',cursor:'pointer',fontFamily:"'Inter',sans-serif" }}>{o}</button>)}</div>
        <div style={{ display:'flex',gap:'8px' }}>{PLATS.map(p=><button key={p} onClick={()=>setPlat(p)} style={{ padding:'8px 14px',borderRadius:radius.full,background:plat===p?colors.surfaceContainerHighest:'transparent',color:plat===p?colors.onSurface:colors.onSurfaceVariant,border:plat===p?'1px solid '+colors.outlineVariant:'1px solid transparent',fontWeight:500,fontSize:'12px',cursor:'pointer',fontFamily:"'Inter',sans-serif" }}>{p}</button>)}</div>
      </div>
      <div className="clips-grid" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'16px' }}>
        {filtered.map(clip=><div key={clip.id} style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,overflow:'hidden' }}>
          <div onClick={()=>setPreview(clip.id)} style={{ aspectRatio:'9/12',background:colors.surfaceContainer,position:'relative',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
            <div style={{ position:'absolute',top:12,left:12,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',padding:'4px 10px',borderRadius:radius.full,display:'flex',alignItems:'center',gap:'4px' }}><Icon name="local_fire_department" size={14} style={{ color:sc(clip.score) }} filled/><span style={{ fontSize:'12px',fontWeight:700,color:sc(clip.score) }}>{clip.score}</span></div>
            <div style={{ position:'absolute',top:12,right:12,background:'rgba(0,0,0,0.7)',padding:'4px 8px',borderRadius:radius.sm,fontSize:'11px',color:'#fff',fontWeight:600 }}>{clip.duration}</div>
            <div style={{ width:56,height:56,borderRadius:'50%',background:'rgba(255,255,255,0.1)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center' }}><Icon name="play_arrow" filled size={28} style={{ color:'#fff' }}/></div>
            <div style={{ position:'absolute',bottom:12,left:12,right:12,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',padding:'8px 12px',borderRadius:radius.md }}><p style={{ fontSize:'11px',color:'#fff',fontWeight:500,lineHeight:1.4 }}>&ldquo;{clip.hook}&rdquo;</p></div>
          </div>
          <div style={{ padding:'16px' }}>
            <p style={{ fontSize:'13px',fontWeight:600,marginBottom:'4px',lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any }}>{clip.title}</p>
            <p style={{ fontSize:'11px',color:colors.onSurfaceVariant,textTransform:'capitalize',marginBottom:'12px' }}><Icon name="smart_display" size={12} style={{ verticalAlign:'middle',marginRight:4 }}/>{clip.platform}</p>
            <div style={{ display:'flex',gap:'8px' }}>
              <button onClick={()=>router.push('/editor')} style={{ flex:1,padding:'8px',borderRadius:radius.md,background:colors.surfaceContainer,border:'1px solid '+colors.outlineVariant,color:colors.onSurface,fontSize:'12px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'4px',fontFamily:"'Inter',sans-serif" }}><Icon name="edit" size={14}/> Edit</button>
              <button onClick={()=>setShowDl(clip.id)} style={{ flex:1,padding:'8px',borderRadius:radius.md,background:gradients.primary,color:'#FAF7FF',border:'none',fontSize:'12px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'4px',fontFamily:"'Inter',sans-serif" }}><Icon name="download" size={14}/> Download</button>
              <button onClick={()=>handleShare(clip)} style={{ padding:'8px',borderRadius:radius.md,background:colors.surfaceContainer,border:'1px solid '+colors.outlineVariant,color:colors.onSurfaceVariant,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><Icon name="share" size={14}/></button>
            </div>
          </div>
        </div>)}
      </div>
      {preview&&<div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px' }} onClick={()=>setPreview(null)}>
        <div onClick={e=>e.stopPropagation()} style={{ width:320,borderRadius:radius.xl,overflow:'hidden',background:colors.surfaceContainerHigh }}>
          <div style={{ aspectRatio:'9/16',background:'linear-gradient(180deg,'+colors.surfaceContainer+',rgba(93,96,235,0.1))',display:'flex',alignItems:'center',justifyContent:'center',position:'relative' }}>
            <div style={{ width:64,height:64,borderRadius:'50%',background:'rgba(255,255,255,0.12)',display:'flex',alignItems:'center',justifyContent:'center' }}><Icon name="play_arrow" filled size={32} style={{ color:'#fff' }}/></div>
            <div style={{ position:'absolute',bottom:16,left:16,right:16,background:'rgba(0,0,0,0.7)',padding:'8px 12px',borderRadius:radius.md }}><p style={{ fontSize:'13px',color:'#fff',fontWeight:600 }}>{CLIPS.find(c=>c.id===preview)?.title}</p></div>
          </div>
          <div style={{ padding:'16px',display:'flex',gap:'8px' }}>
            <button onClick={()=>{setPreview(null);router.push('/editor');}} style={{ flex:1,padding:'10px',borderRadius:radius.md,background:gradients.primary,color:'#FAF7FF',border:'none',fontWeight:600,fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',sans-serif" }}>Edit Clip</button>
            <button onClick={()=>setPreview(null)} style={{ padding:'10px',borderRadius:radius.md,background:colors.surfaceContainer,border:'1px solid '+colors.outlineVariant,color:colors.onSurface,cursor:'pointer' }}><Icon name="close" size={18}/></button>
          </div>
        </div>
      </div>}
      {showDl&&<div style={{ position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px' }} onClick={()=>setShowDl(null)}>
        <div onClick={e=>e.stopPropagation()} style={{ background:colors.surfaceContainerHigh,borderRadius:radius.xl,padding:'32px',width:'100%',maxWidth:'400px' }}>
          <h3 style={{ fontSize:'18px',fontWeight:700,marginBottom:'20px' }}>Download Options</h3>
          {[{label:'MP4 720p',sub:'Free plan',icon:'sd',disabled:false},{label:'MP4 1080p',sub:'Solo Creator+',icon:'hd',disabled:false},{label:'MP4 2K',sub:'Professional+',icon:'4k',disabled:false},{label:'MP4 4K',sub:'Professional+',icon:'4k',disabled:false},{label:'ProRes 4K',sub:'Agency only',icon:'movie',disabled:false}].map(opt=><button key={opt.label} onClick={()=>{alert('Downloading '+opt.label+'...');setShowDl(null);}} style={{ width:'100%',padding:'14px 16px',borderRadius:radius.md,background:colors.surfaceContainer,border:'1px solid '+colors.outlineVariant,color:colors.onSurface,fontSize:'14px',fontWeight:600,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px',fontFamily:"'Inter',sans-serif" }}>
            <div style={{ display:'flex',alignItems:'center',gap:'12px' }}><Icon name={opt.icon} size={20} style={{ color:colors.primary }}/><span>{opt.label}</span></div>
            <span style={{ fontSize:'11px',color:colors.onSurfaceVariant }}>{opt.sub}</span>
          </button>)}
          <button onClick={()=>setShowDl(null)} style={{ width:'100%',padding:'10px',borderRadius:radius.md,background:'transparent',border:'1px solid '+colors.outlineVariant,color:colors.onSurfaceVariant,fontSize:'13px',cursor:'pointer',marginTop:'8px',fontFamily:"'Inter',sans-serif" }}>Cancel</button>
        </div>
      </div>}
    </DashboardLayout>
  );
}
