'use client';
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors, gradients, radius } from '@/lib/tokens';
const STATS = [
  { label:'Total Clips',value:'147',change:'+12%',icon:'movie_edit',color:'#C0C1FF' },
  { label:'Total Views',value:'24.8K',change:'+8%',icon:'visibility',color:'#89CEFF' },
  { label:'Watch Time',value:'312h',change:'+15%',icon:'schedule',color:'#ff97b5' },
  { label:'Engagement',value:'4.7%',change:'+0.3%',icon:'trending_up',color:'#4ade80' },
];
const PROJECTS = [
  { id:'1',title:'How AI is Changing Everything',platform:'youtube',clips:8,status:'complete',date:'2h ago' },
  { id:'2',title:'Morning Routine 2026',platform:'tiktok',clips:5,status:'complete',date:'1d ago' },
  { id:'3',title:'Tech Review: Galaxy S26',platform:'youtube',clips:0,status:'processing',date:'3h ago' },
  { id:'4',title:'Podcast Ep. 42 Highlights',platform:'youtube',clips:12,status:'complete',date:'2d ago' },
];
const ACTIVITY = [
  { icon:'auto_awesome',text:'8 clips generated from "How AI is Changing Everything"',time:'2h ago',color:'#C0C1FF' },
  { icon:'publish',text:'Clip published to TikTok',time:'5h ago',color:'#4ade80' },
  { icon:'download',text:'3 clips downloaded in 1080p',time:'1d ago',color:'#89CEFF' },
  { icon:'calendar_month',text:'2 clips scheduled for tomorrow',time:'1d ago',color:'#ff97b5' },
];
export default function DashboardPage() {
  const router = useRouter();
  return (
    <DashboardLayout title="Welcome back" subtitle="Here's what's happening with your content today." actions={<button onClick={()=>router.push('/import')} style={{ background:gradients.cta,color:'#000',padding:'10px 20px',borderRadius:radius.md,fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',fontFamily:"'Inter',sans-serif" }}><Icon name="add_circle" size={18}/> New Project</button>}>
      <div className="stats-grid" style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'32px' }}>
        {STATS.map(s=><div key={s.label} style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'24px' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px' }}>
            <div style={{ width:40,height:40,borderRadius:radius.md,background:s.color+'10',display:'flex',alignItems:'center',justifyContent:'center' }}><Icon name={s.icon} size={20} style={{ color:s.color }}/></div>
            <span style={{ fontSize:'11px',fontWeight:600,color:'#4ade80',background:'rgba(74,222,128,0.1)',padding:'2px 8px',borderRadius:radius.full }}>{s.change}</span>
          </div>
          <p style={{ fontSize:'28px',fontWeight:800,letterSpacing:'-0.02em',marginBottom:'4px' }}>{s.value}</p>
          <p style={{ fontSize:'12px',color:colors.onSurfaceVariant }}>{s.label}</p>
        </div>)}
      </div>
      <div className="dash-cols" style={{ display:'grid',gridTemplateColumns:'1fr 380px',gap:'24px' }}>
        <div>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px' }}>
            <h2 style={{ fontSize:'18px',fontWeight:700 }}>Recent Projects</h2>
            <button onClick={()=>router.push('/import')} style={{ background:'none',border:'none',color:colors.primary,fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif" }}>View All</button>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
            {PROJECTS.map(p=><div key={p.id} onClick={()=>p.status==='complete'?router.push('/clips'):router.push('/processing')} style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'16px 20px',display:'flex',alignItems:'center',gap:'16px',cursor:'pointer' }}>
              <div style={{ width:56,height:42,borderRadius:radius.md,background:colors.surfaceContainer,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Icon name="play_circle" size={22} style={{ color:colors.onSurfaceVariant }}/></div>
              <div style={{ flex:1,minWidth:0 }}><p style={{ fontSize:'14px',fontWeight:600,marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.title}</p><span style={{ fontSize:'11px',color:colors.onSurfaceVariant }}>{p.platform} · {p.date}</span></div>
              <div style={{ textAlign:'right',flexShrink:0 }}>{p.status==='complete'?<span style={{ fontSize:'12px',fontWeight:600,color:'#4ade80' }}>{p.clips} clips</span>:<span style={{ fontSize:'12px',fontWeight:600,color:colors.primary }}>Processing...</span>}</div>
            </div>)}
          </div>
        </div>
        <div>
          <h2 style={{ fontSize:'18px',fontWeight:700,marginBottom:'16px' }}>Activity</h2>
          <div style={{ display:'flex',flexDirection:'column',gap:'4px' }}>
            {ACTIVITY.map((a,i)=><div key={i} style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'16px',display:'flex',gap:'12px' }}>
              <div style={{ width:36,height:36,borderRadius:radius.md,background:a.color+'10',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><Icon name={a.icon} size={18} style={{ color:a.color }}/></div>
              <div><p style={{ fontSize:'13px',lineHeight:1.5,marginBottom:'2px' }}>{a.text}</p><p style={{ fontSize:'11px',color:colors.onSurfaceVariant }}>{a.time}</p></div>
            </div>)}
          </div>
        </div>
      </div>
      <style>{'@media(max-width:1024px){.stats-grid{grid-template-columns:repeat(2,1fr)!important}.dash-cols{grid-template-columns:1fr!important}}@media(max-width:480px){.stats-grid{grid-template-columns:1fr!important}}'}</style>
    </DashboardLayout>
  );
}
