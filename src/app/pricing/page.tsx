'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { colors, gradients, radius, shadows } from '@/lib/tokens';
const P=[{n:'Free',p:0,d:'Try it out',f:{'Clips/month':'3','Export':'720p MP4','Watermark':'Yes','Projects':'1','Captions':'Basic','Hook Detection':'âœ“','9:16 Reframe':'âœ“','Adjustments':'â€”','Calendar':'â€”','Analytics':'â€”','Templates':'5 basic','Priority':'â€”','API':'â€”','Team':'â€”'},pop:false},
{n:'Solo Creator',p:9,d:'Individual creators',f:{'Clips/month':'20','Export':'1080p MP4','Watermark':'No','Projects':'5','Captions':'Custom','Hook Detection':'âœ“','9:16 Reframe':'âœ“','Adjustments':'Basic','Calendar':'âœ“','Analytics':'Basic','Templates':'All','Priority':'â€”','API':'â€”','Team':'â€”'},pop:false},
{n:'Professional',p:24,d:'Serious creators',f:{'Clips/month':'100','Export':'2K & 4K','Watermark':'No','Projects':'Unlimited','Captions':'Animated','Hook Detection':'âœ“','9:16 Reframe':'âœ“','Adjustments':'Full suite','Calendar':'âœ“','Analytics':'Full','Templates':'All+Premium','Priority':'âœ“','API':'â€”','Team':'â€”'},pop:true},
{n:'Big Agency',p:79,d:'Teams & agencies',f:{'Clips/month':'Unlimited','Export':'4K+ProRes','Watermark':'No','Projects':'Unlimited','Captions':'All styles','Hook Detection':'âœ“','9:16 Reframe':'âœ“','Adjustments':'Full suite','Calendar':'âœ“','Analytics':'Full+Reports','Templates':'All+Custom','Priority':'âœ“','API':'âœ“','Team':'Up to 10'},pop:false}];
export default function PricingPage(){
  const router=useRouter();
  const[annual,setAnnual]=useState(false);
  const keys=Object.keys(P[0].f);
  return(
    <div style={{background:colors.background,color:colors.onSurface,fontFamily:"'Inter',sans-serif",minHeight:'100vh'}}>
      <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 24px',maxWidth:1200,margin:'0 auto'}}>
        <div onClick={()=>router.push('/')} style={{display:'flex',alignItems:'center',gap:'10px',cursor:'pointer'}}>
          <div style={{width:32,height:32,borderRadius:radius.md,background:gradients.cta,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="auto_awesome" size={18} style={{color:'#fff'}}/></div>
          <span style={{fontSize:'18px',fontWeight:800}}>HookClip</span>
        </div>
        <button onClick={()=>router.push('/auth')} style={{background:'#fff',color:'#000',fontSize:'13px',fontWeight:700,padding:'8px 18px',borderRadius:radius.md,border:'none',cursor:'pointer'}}>Get Started</button>
      </nav>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'48px 24px 96px'}}>
        <div style={{textAlign:'center',marginBottom:'48px'}}>
          <h1 style={{fontSize:'40px',fontWeight:800,marginBottom:'12px'}}>Choose Your Plan</h1>
          <p style={{color:colors.onSurfaceVariant,fontSize:'16px',marginBottom:'28px'}}>Start free. Upgrade when you&apos;re ready.</p>
          <div style={{display:'inline-flex',background:colors.surfaceContainerHigh,borderRadius:radius.full,padding:'4px'}}>
            <button onClick={()=>setAnnual(false)} style={{padding:'8px 20px',borderRadius:radius.full,border:'none',cursor:'pointer',background:!annual?colors.primary:'transparent',color:!annual?'#000':colors.onSurfaceVariant,fontWeight:600,fontSize:'13px',fontFamily:"'Inter',sans-serif"}}>Monthly</button>
            <button onClick={()=>setAnnual(true)} style={{padding:'8px 20px',borderRadius:radius.full,border:'none',cursor:'pointer',background:annual?colors.primary:'transparent',color:annual?'#000':colors.onSurfaceVariant,fontWeight:600,fontSize:'13px',fontFamily:"'Inter',sans-serif"}}>Annual <span style={{color:annual?'#000':'#4ade80',fontSize:'11px'}}>-25%</span></button>
          </div>
        </div>
        <div className="pricing-cards" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'64px'}}>
          {P.map(plan=>{const dp=annual?Math.round(plan.p*0.75):plan.p;return<div key={plan.n} style={{background:plan.pop?colors.surfaceContainerHigh:colors.surfaceContainerLow,borderRadius:radius.xl,padding:'32px',border:plan.pop?'1px solid '+colors.primary+'40':'1px solid transparent',position:'relative',boxShadow:plan.pop?shadows.glow:'none'}}>
            {plan.pop&&<div style={{position:'absolute',top:'-12px',left:'50%',transform:'translateX(-50%)',background:gradients.primary,color:'#000',fontSize:'11px',fontWeight:700,padding:'4px 16px',borderRadius:radius.full}}>Most Popular</div>}
            <h3 style={{fontSize:'18px',fontWeight:700,marginBottom:'4px'}}>{plan.n}</h3>
            <p style={{fontSize:'12px',color:colors.onSurfaceVariant,marginBottom:'20px'}}>{plan.d}</p>
            <div style={{marginBottom:'24px'}}><span style={{fontSize:'40px',fontWeight:800}}>${dp}</span><span style={{fontSize:'14px',color:colors.onSurfaceVariant}}>/mo</span></div>
            <button onClick={()=>router.push('/auth')} style={{width:'100%',background:plan.pop?gradients.primary:colors.surfaceContainer,color:plan.pop?'#FAF7FF':colors.onSurface,border:plan.pop?'none':'1px solid '+colors.outlineVariant,padding:'12px',borderRadius:radius.md,fontWeight:700,fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>{plan.p===0?'Get Started':'Start Trial'}</button>
          </div>;})}
        </div>
        <div style={{background:colors.surfaceContainerHigh,borderRadius:radius.xl,padding:'32px',overflow:'auto'}}>
          <h2 style={{fontSize:'22px',fontWeight:700,marginBottom:'24px'}}>Feature Comparison</h2>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:'600px'}}>
            <thead><tr><th style={{textAlign:'left',padding:'12px',fontSize:'12px',fontWeight:600,color:colors.onSurfaceVariant,borderBottom:'1px solid rgba(70,69,85,0.1)'}}>Feature</th>
            {P.map(p=><th key={p.n} style={{textAlign:'center',padding:'12px',fontSize:'13px',fontWeight:700,color:p.pop?colors.primary:colors.onSurface,borderBottom:'1px solid rgba(70,69,85,0.1)'}}>{p.n}</th>)}</tr></thead>
            <tbody>{keys.map((key,i)=><tr key={key}><td style={{padding:'12px',fontSize:'13px',color:colors.onSurfaceVariant,borderBottom:i<keys.length-1?'1px solid rgba(70,69,85,0.05)':'none'}}>{key}</td>
            {P.map(p=>{const v=p.f[key as keyof typeof p.f];return<td key={p.n} style={{textAlign:'center',padding:'12px',fontSize:'13px',borderBottom:i<keys.length-1?'1px solid rgba(70,69,85,0.05)':'none',color:v==='â€”'?colors.outlineVariant:v==='âœ“'?'#4ade80':colors.onSurface}}>
              {v==='âœ“'?<Icon name="check" size={16} style={{color:'#4ade80'}}/>:v}
            </td>;})}</tr>)}</tbody>
          </table>
        </div>
      </div>
      <style>{'@media(max-width:768px){.pricing-cards{grid-template-columns:1fr!important}}'}</style>
    </div>
  );
}
