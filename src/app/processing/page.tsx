'use client';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors, gradients, radius } from '@/lib/tokens';
const STEPS = [{l:'Downloading video',i:'cloud_download',d:3000},{l:'Transcribing audio',i:'mic',d:5000},{l:'Detecting viral hooks',i:'auto_awesome',d:4000},{l:'Scoring clip potential',i:'trending_up',d:3000},{l:'Generating clips',i:'movie_edit',d:4000},{l:'Adding captions',i:'closed_caption',d:2000},{l:'Reframing to 9:16',i:'aspect_ratio',d:3000}];
export default function ProcessingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const total = STEPS.reduce((s,x)=>s+x.d,0);
    let elapsed = 0;
    const iv = setInterval(() => {
      elapsed += 100;
      setProgress(Math.min((elapsed/total)*100,100));
      let cum = 0;
      for(let i=0;i<STEPS.length;i++){cum+=STEPS[i].d;if(elapsed<cum){setStep(i);break;}if(i===STEPS.length-1)setStep(i);}
      if(elapsed>=total){clearInterval(iv);setTimeout(()=>router.push('/clips'),500);}
    }, 100);
    return () => clearInterval(iv);
  }, [router]);
  return (
    <DashboardLayout>
      <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'70vh',textAlign:'center',padding:'32px' }}>
        <div style={{ width:120,height:120,borderRadius:'50%',background:'rgba(192,193,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'40px',position:'relative',animation:'pulse-glow 2s ease-in-out infinite' }}>
          <div style={{ width:80,height:80,borderRadius:'50%',background:'rgba(192,193,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center' }}><Icon name={STEPS[step].i} size={36} style={{ color:colors.primary }}/></div>
          <div style={{ position:'absolute',inset:0,borderRadius:'50%',border:'2px solid transparent',borderTopColor:colors.primary,animation:'spin-slow 1.5s linear infinite' }}/>
        </div>
        <h2 style={{ fontSize:'24px',fontWeight:700,marginBottom:'8px' }}>{STEPS[step].l}...</h2>
        <p style={{ fontSize:'14px',color:colors.onSurfaceVariant,marginBottom:'40px' }}>AI is analyzing your video for the most engaging moments.</p>
        <div style={{ width:'100%',maxWidth:'480px',marginBottom:'40px' }}>
          <div style={{ width:'100%',height:'6px',background:colors.surfaceContainerHigh,borderRadius:radius.full,overflow:'hidden' }}>
            <div style={{ width:progress+'%',height:'100%',background:gradients.primary,borderRadius:radius.full,transition:'width 0.3s' }}/>
          </div>
          <div style={{ display:'flex',justifyContent:'space-between',marginTop:'8px' }}><span style={{ fontSize:'12px',color:colors.onSurfaceVariant }}>Step {step+1} of {STEPS.length}</span><span style={{ fontSize:'12px',color:colors.primary,fontWeight:600 }}>{Math.round(progress)}%</span></div>
        </div>
        <div style={{ width:'100%',maxWidth:'400px' }}>
          {STEPS.map((s,i)=>{const done=i<step;const active=i===step;return <div key={s.l} style={{ display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',opacity:done?0.5:active?1:0.3 }}>
            <div style={{ width:28,height:28,borderRadius:'50%',background:done?'rgba(74,222,128,0.15)':active?'rgba(192,193,255,0.15)':colors.surfaceContainerHigh,display:'flex',alignItems:'center',justifyContent:'center' }}>{done?<Icon name="check" size={16} style={{ color:'#4ade80' }}/>:<Icon name={s.i} size={16} style={{ color:active?colors.primary:colors.onSurfaceVariant }}/>}</div>
            <span style={{ fontSize:'13px',fontWeight:active?600:400,color:active?colors.onSurface:colors.onSurfaceVariant }}>{s.l}</span>
          </div>;})}
        </div>
      </div>
    </DashboardLayout>
  );
}
