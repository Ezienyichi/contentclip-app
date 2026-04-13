'use client';
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { colors, gradients, radius, inputField } from '@/lib/tokens';
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const HOURS=Array.from({length:13},(_,i)=>i+6);
const SCHED=[{day:1,hour:9,title:'AI Truth Clip',platform:'tiktok',color:'#C0C1FF'},{day:1,hour:14,title:'Morning Routine',platform:'reels',color:'#E1306C'},{day:3,hour:10,title:'Tech Review',platform:'shorts',color:'#FF0000'},{day:4,hour:11,title:'Podcast Highlights',platform:'tiktok',color:'#C0C1FF'},{day:5,hour:15,title:'Productivity Tips',platform:'reels',color:'#E1306C'}];
export default function CalendarPage(){
  const[showModal,setShowModal]=useState(false);
  return(
    <DashboardLayout title="Content Calendar" subtitle="Schedule your clips across platforms." actions={<button onClick={()=>setShowModal(true)} style={{background:gradients.cta,color:'#000',padding:'10px 20px',borderRadius:radius.md,fontWeight:700,fontSize:'13px',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',fontFamily:"'Inter',sans-serif"}}><Icon name="add" size={18}/> Schedule Post</button>}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <button style={{background:'none',border:'none',cursor:'pointer',color:colors.onSurfaceVariant}}><Icon name="chevron_left" size={24}/></button>
          <h3 style={{fontSize:'18px',fontWeight:700}}>April 7 – 13, 2026</h3>
          <button style={{background:'none',border:'none',cursor:'pointer',color:colors.onSurfaceVariant}}><Icon name="chevron_right" size={24}/></button>
        </div>
        <button style={{padding:'8px 16px',borderRadius:radius.md,background:colors.surfaceContainerHigh,border:'1px solid '+colors.outlineVariant,color:colors.onSurface,fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Today</button>
      </div>
      <div style={{background:colors.surfaceContainerHigh,borderRadius:radius.xl,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'60px repeat(7,1fr)'}}>
          <div style={{padding:'12px',background:colors.surfaceContainerHighest}}/>
          {DAYS.map((d,i)=><div key={d} style={{padding:'12px 8px',textAlign:'center',background:colors.surfaceContainerHighest,borderLeft:i>0?'1px solid rgba(70,69,85,0.1)':'none'}}>
            <p style={{fontSize:'11px',fontWeight:600,color:colors.onSurfaceVariant,textTransform:'uppercase',letterSpacing:'0.05em'}}>{d}</p>
            <p style={{fontSize:'18px',fontWeight:700,marginTop:'2px'}}>{7+i}</p>
          </div>)}
        </div>
        <div style={{maxHeight:'500px',overflowY:'auto'}}>
          {HOURS.map(hour=><div key={hour} style={{display:'grid',gridTemplateColumns:'60px repeat(7,1fr)',minHeight:'56px'}}>
            <div style={{padding:'8px',fontSize:'11px',color:colors.onSurfaceVariant,fontWeight:500,textAlign:'right',paddingRight:'12px',borderTop:'1px solid rgba(70,69,85,0.08)'}}>
              {hour>12?(hour-12)+'PM':hour===12?'12PM':hour+'AM'}
            </div>
            {DAYS.map((_,dayIdx)=>{const ev=SCHED.find(s=>s.day===dayIdx&&s.hour===hour);return<div key={dayIdx} onClick={()=>setShowModal(true)} style={{borderTop:'1px solid rgba(70,69,85,0.08)',borderLeft:'1px solid rgba(70,69,85,0.05)',padding:'4px',cursor:'pointer'}}>
              {ev&&<div style={{background:ev.color+'15',borderLeft:'3px solid '+ev.color,borderRadius:'0 4px 4px 0',padding:'6px 8px'}}>
                <p style={{fontSize:'11px',fontWeight:600,color:ev.color,lineHeight:1.3}}>{ev.title}</p>
                <p style={{fontSize:'10px',color:colors.onSurfaceVariant,textTransform:'capitalize'}}>{ev.platform}</p>
              </div>}
            </div>;})}
          </div>)}
        </div>
      </div>
      {showModal&&<div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}} onClick={()=>setShowModal(false)}>
        <div onClick={e=>e.stopPropagation()} style={{background:colors.surfaceContainerHigh,borderRadius:radius.xl,padding:'32px',width:'100%',maxWidth:'480px',animation:'fadeInUp 0.25s ease-out'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}><h3 style={{fontSize:'20px',fontWeight:700}}>Schedule Post</h3><button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:colors.onSurfaceVariant}}><Icon name="close" size={22}/></button></div>
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div><label style={{fontSize:'12px',fontWeight:600,color:colors.onSurfaceVariant,display:'block',marginBottom:'6px'}}>Select Clip</label><select style={{...inputField}}><option>The shocking truth about AI</option><option>Morning routine clip</option><option>Tech review highlight</option></select></div>
            <div><label style={{fontSize:'12px',fontWeight:600,color:colors.onSurfaceVariant,display:'block',marginBottom:'6px'}}>Caption</label><textarea rows={3} placeholder="Write your post caption..." style={{...inputField,resize:'vertical' as any,minHeight:'80px'}}/></div>
            <div><label style={{fontSize:'12px',fontWeight:600,color:colors.onSurfaceVariant,display:'block',marginBottom:'6px'}}>Hashtags</label><input placeholder="#ai #tech #viral" style={inputField}/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              <div><label style={{fontSize:'12px',fontWeight:600,color:colors.onSurfaceVariant,display:'block',marginBottom:'6px'}}>Date</label><input type="date" style={inputField}/></div>
              <div><label style={{fontSize:'12px',fontWeight:600,color:colors.onSurfaceVariant,display:'block',marginBottom:'6px'}}>Time</label><input type="time" style={inputField}/></div>
            </div>
            <div><label style={{fontSize:'12px',fontWeight:600,color:colors.onSurfaceVariant,display:'block',marginBottom:'6px'}}>Platforms</label>
              <div style={{display:'flex',gap:'8px'}}>{[{n:'TikTok',i:'music_note'},{n:'Reels',i:'photo_camera'},{n:'Shorts',i:'smart_display'}].map(p=><button key={p.n} style={{flex:1,padding:'10px',borderRadius:radius.md,background:colors.surfaceContainer,border:'1px solid '+colors.outlineVariant,color:colors.onSurface,fontSize:'12px',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',fontFamily:"'Inter',sans-serif"}}><Icon name={p.i} size={16}/>{p.n}</button>)}</div>
            </div>
            <button onClick={()=>{alert('Post scheduled!');setShowModal(false);}} style={{background:gradients.primary,color:'#FAF7FF',fontWeight:700,padding:'14px',borderRadius:radius.md,border:'none',cursor:'pointer',fontSize:'14px',marginTop:'8px',fontFamily:"'Inter',sans-serif"}}>Schedule Post</button>
          </div>
        </div>
      </div>}
      <style>{'@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}'}</style>
    </DashboardLayout>
  );
}
