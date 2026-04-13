'use client';
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors, gradients, radius } from '@/lib/tokens';
const CATS=['All','Trending','Educational','Entertainment','Podcast','Marketing','Vlog'];
const TMPLS=[
  {id:'1',name:'Viral Hook Opener',cat:'Trending',desc:'Bold text hook with animated reveal',uses:'12.4K',rating:4.9,bg:'linear-gradient(135deg,#C0C1FF,#5D60EB)',icon:'bolt'},
  {id:'2',name:'Listicle Countdown',cat:'Educational',desc:'Numbered list with slide-in text',uses:'8.7K',rating:4.7,bg:'linear-gradient(135deg,#89CEFF,#0079AD)',icon:'format_list_numbered'},
  {id:'3',name:'Before/After Split',cat:'Marketing',desc:'Split screen with swipe transition',uses:'6.2K',rating:4.8,bg:'linear-gradient(135deg,#ff97b5,#E1306C)',icon:'compare'},
  {id:'4',name:'Podcast Soundbite',cat:'Podcast',desc:'Waveform animation with speaker',uses:'9.1K',rating:4.6,bg:'linear-gradient(135deg,#4ade80,#16a34a)',icon:'mic'},
  {id:'5',name:'Story Time',cat:'Entertainment',desc:'Facecam with cinematic bars',uses:'11.3K',rating:4.8,bg:'linear-gradient(135deg,#fbbf24,#f59e0b)',icon:'auto_stories'},
  {id:'6',name:'Tutorial Steps',cat:'Educational',desc:'Step-by-step numbered format',uses:'5.8K',rating:4.5,bg:'linear-gradient(135deg,#a78bfa,#7c3aed)',icon:'school'},
  {id:'7',name:'Product Showcase',cat:'Marketing',desc:'Clean product reveal with text',uses:'4.2K',rating:4.4,bg:'linear-gradient(135deg,#f472b6,#ec4899)',icon:'shopping_bag'},
  {id:'8',name:'Day in My Life',cat:'Vlog',desc:'Time-stamped segments with tags',uses:'7.6K',rating:4.7,bg:'linear-gradient(135deg,#38bdf8,#0284c7)',icon:'wb_sunny'},
  {id:'9',name:'News Flash',cat:'Trending',desc:'Breaking news style with ticker',uses:'3.9K',rating:4.3,bg:'linear-gradient(135deg,#ef4444,#b91c1c)',icon:'campaign'},
];
export default function TemplatesPage(){
  const router=useRouter();
  const[cat,setCat]=useState('All');
  const[search,setSearch]=useState('');
  const[applied,setApplied]=useState<string|null>(null);
  const filtered=TMPLS.filter(t=>(cat==='All'||t.cat===cat)&&(search===''||t.name.toLowerCase().includes(search.toLowerCase())));
  const handleUse=(tmpl:typeof TMPLS[0])=>{setApplied(tmpl.id);setTimeout(()=>{router.push('/editor');},600);};
  return(
    <DashboardLayout title="Templates Library" subtitle="Start with a proven format. Customize to your style.">
      <div style={{display:'flex',gap:'16px',marginBottom:'24px',flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:'240px',position:'relative'}}>
          <Icon name="search" size={18} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:colors.onSurfaceVariant}}/>
          <input placeholder="Search templates..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',background:colors.surfaceContainerLowest,color:colors.onSurface,border:'1px solid transparent',borderRadius:radius.md,padding:'12px 16px 12px 40px',fontSize:'14px',fontFamily:"'Inter',sans-serif",outline:'none'}}/>
        </div>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>{CATS.map(c=><button key={c} onClick={()=>setCat(c)} style={{padding:'8px 16px',borderRadius:radius.full,background:cat===c?colors.primary:colors.surfaceContainerHigh,color:cat===c?'#000':colors.onSurfaceVariant,border:'none',fontWeight:600,fontSize:'12px',cursor:'pointer',fontFamily:"'Inter',sans-serif",whiteSpace:'nowrap'}}>{c}</button>)}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'16px'}}>
        {filtered.map(t=><div key={t.id} style={{background:colors.surfaceContainerHigh,borderRadius:radius.lg,overflow:'hidden',border:applied===t.id?'2px solid '+colors.primary:'2px solid transparent',transition:'border-color 0.2s'}}>
          <div style={{aspectRatio:'16/10',background:t.bg,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
            <Icon name={t.icon} size={48} style={{color:'rgba(255,255,255,0.3)'}}/>
            <div style={{position:'absolute',bottom:12,right:12,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',padding:'4px 10px',borderRadius:radius.full,fontSize:'11px',fontWeight:600,color:'#fff',display:'flex',alignItems:'center',gap:'4px'}}><Icon name="star" filled size={12} style={{color:'#fbbf24'}}/> {t.rating}</div>
          </div>
          <div style={{padding:'16px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
              <h3 style={{fontSize:'15px',fontWeight:700}}>{t.name}</h3>
              <span style={{fontSize:'10px',fontWeight:600,color:colors.primary,background:'rgba(192,193,255,0.1)',padding:'2px 8px',borderRadius:radius.full}}>{t.cat}</span>
            </div>
            <p style={{fontSize:'12px',color:colors.onSurfaceVariant,lineHeight:1.5,marginBottom:'12px'}}>{t.desc}</p>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'11px',color:colors.onSurfaceVariant}}><Icon name="group" size={14} style={{verticalAlign:'middle',marginRight:4}}/>{t.uses} uses</span>
              <button onClick={()=>handleUse(t)} style={{padding:'6px 14px',borderRadius:radius.md,background:applied===t.id?'#4ade80':gradients.primary,color:applied===t.id?'#000':'#FAF7FF',border:'none',fontWeight:600,fontSize:'11px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>{applied===t.id?'Applied!':'Use Template'}</button>
            </div>
          </div>
        </div>)}
      </div>
    </DashboardLayout>
  );
}
