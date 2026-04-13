'use client';
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { colors, gradients, radius } from '@/lib/tokens';
const DATA:Record<string,{month:string;views:number}[]> = {
  '7d':[{month:'Mon',views:1200},{month:'Tue',views:1800},{month:'Wed',views:2200},{month:'Thu',views:1900},{month:'Fri',views:2800},{month:'Sat',views:3200},{month:'Sun',views:2600}],
  '30d':[{month:'W1',views:4800},{month:'W2',views:6200},{month:'W3',views:7400},{month:'W4',views:9800}],
  '90d':[{month:'Jan',views:3400},{month:'Feb',views:6200},{month:'Mar',views:12400}],
  '1y':[{month:'Jan',views:1200},{month:'Feb',views:2100},{month:'Mar',views:3400},{month:'Apr',views:4800},{month:'May',views:6200},{month:'Jun',views:8100},{month:'Jul',views:7400},{month:'Aug',views:9800},{month:'Sep',views:12400},{month:'Oct',views:15600},{month:'Nov',views:19200},{month:'Dec',views:24800}],
};
const PLATS = [{name:'TikTok',pct:50,color:'#C0C1FF'},{name:'YouTube Shorts',pct:30,color:'#FF0000'},{name:'Instagram Reels',pct:20,color:'#E1306C'}];
const TOP = [{title:'The shocking truth about AI',views:'4.2K',eng:'6.8%',score:94},{title:'Why morning routines fail',views:'3.1K',eng:'5.2%',score:88},{title:'The $1 tool hack',views:'2.8K',eng:'4.9%',score:82},{title:'Remote work debate',views:'2.1K',eng:'4.3%',score:79},{title:'0 to 10K strategy',views:'1.9K',eng:'3.8%',score:76}];
export default function AnalyticsPage() {
  const [range,setRange] = useState('30d');
  const growth = DATA[range]||DATA['30d'];
  const max = Math.max(...growth.map(d=>d.views));
  return (
    <DashboardLayout title="Analytics" subtitle="Track your content performance." actions={
      <div style={{ display:'flex',gap:'4px',background:colors.surfaceContainerHigh,borderRadius:radius.full,padding:'3px' }}>
        {['7d','30d','90d','1y'].map(r=><button key={r} onClick={()=>setRange(r)} style={{ padding:'6px 14px',borderRadius:radius.full,border:'none',background:range===r?colors.primary:'transparent',color:range===r?'#000':colors.onSurfaceVariant,fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif" }}>{r}</button>)}
      </div>
    }>
      <div className="stats-grid" style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'24px' }}>
        {[{l:'Total Views',v:'24.8K',i:'visibility',c:'#89CEFF'},{l:'Watch Time',v:'312h',i:'schedule',c:'#ff97b5'},{l:'Subscribers',v:'+847',i:'person_add',c:'#4ade80'},{l:'Engagement',v:'4.7%',i:'trending_up',c:'#C0C1FF'}].map(s=><div key={s.l} style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'24px' }}>
          <div style={{ width:40,height:40,borderRadius:radius.md,background:s.c+'10',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px' }}><Icon name={s.i} size={20} style={{ color:s.c }}/></div>
          <p style={{ fontSize:'28px',fontWeight:800 }}>{s.v}</p><p style={{ fontSize:'12px',color:colors.onSurfaceVariant }}>{s.l}</p>
        </div>)}
      </div>
      <div className="analytics-cols" style={{ display:'grid',gridTemplateColumns:'1fr 340px',gap:'24px',marginBottom:'24px' }}>
        <div style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'24px' }}>
          <h3 style={{ fontSize:'16px',fontWeight:700,marginBottom:'24px' }}>Views Growth ({range})</h3>
          <div style={{ display:'flex',alignItems:'flex-end',gap:'8px',height:'200px' }}>
            {growth.map(d=><div key={d.month} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'8px' }}>
              <div style={{ width:'100%',borderRadius:'4px 4px 0 0',height:(d.views/max)*180+'px',background:gradients.primary,minHeight:'4px',transition:'height 0.3s' }}/>
              <span style={{ fontSize:'10px',color:colors.onSurfaceVariant }}>{d.month}</span>
            </div>)}
          </div>
        </div>
        <div style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'24px' }}>
          <h3 style={{ fontSize:'16px',fontWeight:700,marginBottom:'24px' }}>Platform Distribution</h3>
          <div style={{ width:160,height:160,margin:'0 auto 24px',position:'relative' }}>
            <svg viewBox="0 0 36 36" style={{ width:'100%',height:'100%',transform:'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={colors.surfaceContainer} strokeWidth="3"/>
              {(()=>{let o=0;return PLATS.map(p=>{const d=(p.pct/100)*100;const el=<circle key={p.name} cx="18" cy="18" r="15.9" fill="none" stroke={p.color} strokeWidth="3" strokeDasharray={d+' '+(100-d)} strokeDashoffset={-o+''}strokeLinecap="round"/>;o+=d;return el;});})()}
            </svg>
            <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}><p style={{ fontSize:'22px',fontWeight:800 }}>24.8K</p><p style={{ fontSize:'10px',color:colors.onSurfaceVariant }}>total views</p></div>
          </div>
          {PLATS.map(p=><div key={p.name} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'8px' }}><div style={{ width:10,height:10,borderRadius:'50%',background:p.color }}/><span style={{ fontSize:'13px' }}>{p.name}</span></div>
            <span style={{ fontSize:'13px',fontWeight:600,color:colors.onSurfaceVariant }}>{p.pct}%</span>
          </div>)}
        </div>
      </div>
      <div style={{ background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'24px' }}>
        <h3 style={{ fontSize:'16px',fontWeight:700,marginBottom:'16px' }}>Top Performing Clips</h3>
        <table style={{ width:'100%',borderCollapse:'collapse' }}>
          <thead><tr>{['Clip','Views','Engagement','Score'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 12px',fontSize:'11px',fontWeight:600,color:colors.onSurfaceVariant,textTransform:'uppercase',borderBottom:'1px solid rgba(70,69,85,0.1)' }}>{h}</th>)}</tr></thead>
          <tbody>{TOP.map((c,i)=><tr key={i}><td style={{ padding:'12px',fontSize:'13px',fontWeight:500 }}>#{i+1} {c.title}</td><td style={{ padding:'12px',fontSize:'13px',color:colors.onSurfaceVariant }}>{c.views}</td><td style={{ padding:'12px',fontSize:'13px',color:colors.onSurfaceVariant }}>{c.eng}</td><td style={{ padding:'12px' }}><span style={{ fontSize:'12px',fontWeight:700,color:c.score>=85?'#4ade80':'#C0C1FF',background:c.score>=85?'rgba(74,222,128,0.1)':'rgba(192,193,255,0.1)',padding:'4px 12px',borderRadius:radius.full }}>{c.score}</span></td></tr>)}</tbody>
        </table>
      </div>
      <style>{'@media(max-width:1024px){.stats-grid{grid-template-columns:repeat(2,1fr)!important}.analytics-cols{grid-template-columns:1fr!important}}'}</style>
    </DashboardLayout>
  );
}
