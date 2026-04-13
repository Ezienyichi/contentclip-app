'use client';
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors, gradients, radius, inputField, shadows } from '@/lib/tokens';
export default function ImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const handleImport = () => { if(!url.trim())return; setLoading(true); setTimeout(()=>router.push('/processing'),600); };
  const imports = [
    { id:'1',title:'How AI is Changing Everything',status:'complete',clips:8,date:'2h ago' },
    { id:'2',title:'Morning Routine 2026',status:'complete',clips:5,date:'1d ago' },
    { id:'3',title:'Tech Review: Galaxy S26',status:'processing',clips:0,date:'3h ago' },
  ];
  const sc:Record<string,{bg:string;text:string;label:string}> = { complete:{bg:'rgba(74,222,128,0.1)',text:'#4ade80',label:'Complete'}, processing:{bg:'rgba(192,193,255,0.1)',text:'#C0C1FF',label:'Processing'}, error:{bg:'rgba(255,180,171,0.1)',text:'#FFB4AB',label:'Error'} };
  return (
    <DashboardLayout title="Import Video" subtitle="Paste a video link to start generating clips.">
      <div style={{ background:colors.surfaceContainerHigh,borderRadius:radius.xl,padding:'48px',maxWidth:'720px',margin:'0 auto 48px',textAlign:'center',boxShadow:shadows.glow }}>
        <div style={{ width:72,height:72,borderRadius:'50%',background:'rgba(192,193,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px' }}><Icon name="link" size={32} style={{ color:colors.primary }}/></div>
        <h2 style={{ fontSize:'22px',fontWeight:700,marginBottom:'8px' }}>Paste a Video Link</h2>
        <p style={{ fontSize:'14px',color:colors.onSurfaceVariant,marginBottom:'28px' }}>Supports YouTube, Vimeo, and TikTok. No file uploads needed.</p>
        <div style={{ display:'flex',gap:'12px',maxWidth:'560px',margin:'0 auto' }}>
          <input type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." onKeyDown={e=>e.key==='Enter'&&handleImport()} style={{ ...inputField,flex:1,padding:'14px 18px',fontSize:'15px',borderRadius:radius.lg }}/>
          <button onClick={handleImport} disabled={loading||!url.trim()} style={{ background:gradients.primary,color:'#FAF7FF',fontWeight:700,padding:'14px 28px',borderRadius:radius.lg,border:'none',cursor:url.trim()?'pointer':'not-allowed',fontSize:'14px',opacity:!url.trim()?0.5:1,whiteSpace:'nowrap',fontFamily:"'Inter',sans-serif" }}>{loading?'Starting...':'Generate Clips'}</button>
        </div>
        <div style={{ display:'flex',justifyContent:'center',gap:'24px',marginTop:'24px' }}>
          {['YouTube','Vimeo','TikTok'].map(p=><span key={p} style={{ fontSize:'12px',color:colors.onSurfaceVariant,display:'flex',alignItems:'center',gap:'4px' }}><Icon name="check_circle" size={14} style={{ color:colors.primary }} filled/> {p}</span>)}
        </div>
      </div>
      <h2 style={{ fontSize:'18px',fontWeight:700,marginBottom:'16px' }}>Recent Imports</h2>
      <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
        {imports.map(imp=>{const s=sc[imp.status];return <div key={imp.id} onClick={()=>imp.status==='complete'&&router.push('/clips')} style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'16px 20px',display:'flex',alignItems:'center',gap:'16px',cursor:imp.status==='complete'?'pointer':'default' }}>
          <div style={{ width:44,height:44,borderRadius:radius.md,background:colors.surfaceContainer,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Icon name="smart_display" size={22} style={{ color:colors.onSurfaceVariant }}/></div>
          <div style={{ flex:1,minWidth:0 }}><p style={{ fontSize:'14px',fontWeight:600,marginBottom:'2px' }}>{imp.title}</p></div>
          <span style={{ fontSize:'11px',fontWeight:600,color:s.text,background:s.bg,padding:'4px 12px',borderRadius:radius.full }}>{s.label}</span>
          {imp.status==='complete'&&<span style={{ fontSize:'12px',color:colors.onSurfaceVariant }}>{imp.clips} clips</span>}
          <span style={{ fontSize:'11px',color:colors.onSurfaceVariant }}>{imp.date}</span>
        </div>;})}
      </div>
    </DashboardLayout>
  );
}
