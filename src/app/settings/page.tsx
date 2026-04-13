'use client';
import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { useRouter } from 'next/navigation';
import { colors, gradients, radius, inputField } from '@/lib/tokens';
const PLANS=[{n:'Solo Creator',p:9,f:['20 clips/mo','1080p','No watermark']},{n:'Professional',p:24,f:['100 clips/mo','4K','Full adjustments','Calendar']},{n:'Big Agency',p:79,f:['Unlimited','4K+ProRes','API','Team']}];
export default function SettingsPage(){
  const router=useRouter();
  const[tab,setTab]=useState('profile');
  const[avatar,setAvatar]=useState<string|null>(null);
  const[notifs,setNotifs]=useState({clips:true,weekly:true,published:false,templates:false});
  const[showUpgrade,setShowUpgrade]=useState(false);
  const[showCancel,setShowCancel]=useState(false);
  const[showDelete,setShowDelete]=useState(false);
  const[deleteConfirm,setDeleteConfirm]=useState('');
  const fileRef=useRef<HTMLInputElement>(null);
  const handleAvatar=(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=(ev)=>setAvatar(ev.target?.result as string);r.readAsDataURL(f);}};
  const toggleNotif=(key:keyof typeof notifs)=>setNotifs(p=>({...p,[key]:!p[key]}));
  const tabs=[{id:'profile',label:'Profile',icon:'person'},{id:'billing',label:'Billing',icon:'credit_card'},{id:'notifications',label:'Notifications',icon:'notifications'},{id:'integrations',label:'Integrations',icon:'extension'}];
  const integrations=[
    {name:'YouTube',icon:'smart_display',connected:true,color:'#FF0000',info:'Connect your YouTube channel to publish Shorts directly from ContentClip. You\'ll need to authorize with your Google account.'},
    {name:'TikTok',icon:'music_note',connected:false,color:'#fff',info:'Link your TikTok account to schedule and auto-publish clips. Requires a TikTok Business or Creator account.'},
    {name:'Instagram',icon:'photo_camera',connected:false,color:'#E1306C',info:'Connect Instagram to publish Reels. Requires a Professional Instagram account linked to a Facebook Business page.'},
    {name:'Google Drive',icon:'cloud',connected:true,color:'#4285F4',info:'Back up your exported clips to Google Drive automatically. Files are saved to a ContentClip folder.'},
  ];
  return(
    <DashboardLayout title="Account Settings" subtitle="Manage your profile, billing, and preferences.">
      <div style={{display:'flex',gap:'4px',marginBottom:'32px',background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'4px',width:'fit-content',flexWrap:'wrap'}}>
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'10px 20px',borderRadius:radius.md,background:tab===t.id?colors.surfaceContainerHighest:'transparent',color:tab===t.id?colors.onSurface:colors.onSurfaceVariant,border:'none',fontWeight:600,fontSize:'13px',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',fontFamily:"'Inter',sans-serif"}}><Icon name={t.icon} size={16}/>{t.label}</button>)}
      </div>

      {tab==='profile'&&<div style={{maxWidth:'640px'}}>
        <div style={{background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'32px',marginBottom:'16px'}}>
          <h3 style={{fontSize:'16px',fontWeight:700,marginBottom:'24px'}}>Personal Information</h3>
          <div style={{display:'flex',alignItems:'center',gap:'20px',marginBottom:'28px'}}>
            <div onClick={()=>fileRef.current?.click()} style={{width:72,height:72,borderRadius:'50%',background:avatar?`url(${avatar}) center/cover`:gradients.cta,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',fontWeight:800,color:'#000',cursor:'pointer',overflow:'hidden'}}>
              {avatar?<img src={avatar} alt="Avatar" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'V'}
            </div>
            <div>
              <button onClick={()=>fileRef.current?.click()} style={{padding:'8px 16px',borderRadius:radius.md,background:colors.surfaceContainer,border:'1px solid '+colors.outlineVariant,color:colors.onSurface,fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Change Avatar</button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{display:'none'}}/>
              <p style={{fontSize:'11px',color:colors.onSurfaceVariant,marginTop:'4px'}}>JPG, PNG. Max 2MB.</p>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
              <div><label style={{fontSize:'12px',fontWeight:600,color:colors.onSurfaceVariant,display:'block',marginBottom:'6px'}}>First Name</label><input defaultValue="Victor" style={inputField}/></div>
              <div><label style={{fontSize:'12px',fontWeight:600,color:colors.onSurfaceVariant,display:'block',marginBottom:'6px'}}>Last Name</label><input defaultValue="Ezenagu" style={inputField}/></div>
            </div>
            <div><label style={{fontSize:'12px',fontWeight:600,color:colors.onSurfaceVariant,display:'block',marginBottom:'6px'}}>Email</label><input defaultValue="victor@techduce.africa" style={inputField}/></div>
          </div>
          <button onClick={()=>alert('Changes saved! A confirmation email has been sent.')} style={{background:gradients.primary,color:'#FAF7FF',fontWeight:700,padding:'12px 28px',borderRadius:radius.md,border:'none',cursor:'pointer',fontSize:'13px',marginTop:'24px',fontFamily:"'Inter',sans-serif"}}>Save Changes</button>
        </div>
        <div style={{background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'32px',marginBottom:'16px'}}>
          <h3 style={{fontSize:'16px',fontWeight:700,marginBottom:'24px'}}>Change Password</h3>
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div><label style={{fontSize:'12px',fontWeight:600,color:colors.onSurfaceVariant,display:'block',marginBottom:'6px'}}>Current Password</label><input type="password" placeholder="••••••••" style={inputField}/></div>
            <div><label style={{fontSize:'12px',fontWeight:600,color:colors.onSurfaceVariant,display:'block',marginBottom:'6px'}}>New Password</label><input type="password" placeholder="Min 8 chars, uppercase, number, symbol" style={inputField}/><p style={{fontSize:'11px',color:colors.onSurfaceVariant,marginTop:'4px'}}>Use 8+ characters with uppercase, numbers, and symbols for a strong password.</p></div>
          </div>
          <button onClick={()=>alert('Password updated! Confirmation sent to your email.')} style={{background:colors.surfaceContainer,color:colors.onSurface,border:'1px solid '+colors.outlineVariant,fontWeight:600,padding:'10px 24px',borderRadius:radius.md,cursor:'pointer',fontSize:'13px',marginTop:'20px',fontFamily:"'Inter',sans-serif"}}>Update Password</button>
        </div>
        <div style={{background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'32px',border:'1px solid rgba(255,180,171,0.2)'}}>
          <h3 style={{fontSize:'16px',fontWeight:700,marginBottom:'8px',color:colors.error}}>Danger Zone</h3>
          <p style={{fontSize:'13px',color:colors.onSurfaceVariant,marginBottom:'16px'}}>Deleting your account is permanent. All projects, clips, and data will be erased. This cannot be undone.</p>
          <button onClick={()=>setShowDelete(true)} style={{background:'rgba(255,180,171,0.1)',color:colors.error,border:'1px solid rgba(255,180,171,0.3)',fontWeight:600,padding:'10px 24px',borderRadius:radius.md,cursor:'pointer',fontSize:'13px',fontFamily:"'Inter',sans-serif"}}>Delete Account</button>
        </div>
      </div>}

      {tab==='billing'&&<div style={{maxWidth:'640px'}}>
        <div style={{background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'32px',marginBottom:'16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
            <h3 style={{fontSize:'16px',fontWeight:700}}>Current Plan</h3>
            <span style={{fontSize:'11px',fontWeight:700,color:'#cc97ff',background:'rgba(156,72,234,0.15)',padding:'4px 12px',borderRadius:radius.full}}>PRO</span>
          </div>
          <p style={{fontSize:'32px',fontWeight:800,marginBottom:'4px'}}>$24 <span style={{fontSize:'14px',color:colors.onSurfaceVariant,fontWeight:500}}>/month</span></p>
          <p style={{fontSize:'13px',color:colors.onSurfaceVariant,marginBottom:'20px'}}>Professional plan · Renews Apr 30, 2026</p>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={()=>setShowUpgrade(true)} style={{padding:'10px 20px',borderRadius:radius.md,background:gradients.primary,color:'#FAF7FF',border:'none',fontWeight:600,fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Upgrade Plan</button>
            <button onClick={()=>setShowCancel(true)} style={{padding:'10px 20px',borderRadius:radius.md,background:'transparent',color:colors.onSurfaceVariant,border:'1px solid '+colors.outlineVariant,fontWeight:600,fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Cancel</button>
          </div>
        </div>
      </div>}

      {tab==='notifications'&&<div style={{maxWidth:'640px'}}>
        <div style={{background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'32px'}}>
          <h3 style={{fontSize:'16px',fontWeight:700,marginBottom:'24px'}}>Notification Preferences</h3>
          {([{key:'clips' as const,label:'Clip generation complete',desc:'Get notified when your clips are ready'},{key:'weekly' as const,label:'Weekly analytics report',desc:'Summary of your content performance'},{key:'published' as const,label:'Scheduled post published',desc:'Confirmation when posts go live'},{key:'templates' as const,label:'New template available',desc:'Discover trending clip formats'}]).map((n,i)=>
            <div key={n.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 0',borderBottom:i<3?'1px solid rgba(70,69,85,0.08)':'none'}}>
              <div><p style={{fontSize:'14px',fontWeight:600,marginBottom:'2px'}}>{n.label}</p><p style={{fontSize:'12px',color:colors.onSurfaceVariant}}>{n.desc}</p></div>
              <button onClick={()=>toggleNotif(n.key)} style={{width:44,height:24,borderRadius:radius.full,background:notifs[n.key]?colors.primary:colors.surfaceContainer,cursor:'pointer',position:'relative',border:'none',transition:'background 0.2s'}}>
                <div style={{width:18,height:18,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:notifs[n.key]?23:3,transition:'left 0.2s'}}/>
              </button>
            </div>
          )}
        </div>
      </div>}

      {tab==='integrations'&&<div style={{maxWidth:'640px'}}>
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          {integrations.map(int=><div key={int.name} style={{background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
                <div style={{width:44,height:44,borderRadius:radius.md,background:int.color+'15',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name={int.icon} size={22} style={{color:int.color}}/></div>
                <div><p style={{fontSize:'14px',fontWeight:600}}>{int.name}</p><p style={{fontSize:'12px',color:int.connected?'#4ade80':colors.onSurfaceVariant}}>{int.connected?'Connected':'Not connected'}</p></div>
              </div>
              <button onClick={()=>alert(int.connected?int.name+' disconnected':int.name+' connection started — you will be redirected to authorize.')} style={{padding:'8px 18px',borderRadius:radius.md,background:int.connected?'transparent':gradients.primary,color:int.connected?colors.onSurfaceVariant:'#FAF7FF',border:int.connected?'1px solid '+colors.outlineVariant:'none',fontWeight:600,fontSize:'12px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>{int.connected?'Disconnect':'Connect'}</button>
            </div>
            <div style={{background:colors.surfaceContainer,borderRadius:radius.md,padding:'12px',display:'flex',alignItems:'flex-start',gap:'8px'}}>
              <Icon name="info" size={16} style={{color:colors.primary,flexShrink:0,marginTop:'1px'}}/>
              <p style={{fontSize:'12px',color:colors.onSurfaceVariant,lineHeight:1.6}}>{int.info}</p>
            </div>
          </div>)}
        </div>
      </div>}

      {showUpgrade&&<div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}} onClick={()=>setShowUpgrade(false)}>
        <div onClick={e=>e.stopPropagation()} style={{background:colors.surfaceContainerHigh,borderRadius:radius.xl,padding:'32px',width:'100%',maxWidth:'500px'}}>
          <h3 style={{fontSize:'20px',fontWeight:700,marginBottom:'20px'}}>Upgrade Your Plan</h3>
          {PLANS.map(p=><button key={p.n} onClick={()=>{alert('Redirecting to Stripe checkout for '+p.n+'...');setShowUpgrade(false);}} style={{width:'100%',padding:'16px 20px',borderRadius:radius.lg,background:colors.surfaceContainer,border:'1px solid '+colors.outlineVariant,color:colors.onSurface,cursor:'pointer',marginBottom:'8px',display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:"'Inter',sans-serif"}}>
            <div style={{textAlign:'left'}}><p style={{fontSize:'15px',fontWeight:700}}>{p.n}</p><p style={{fontSize:'11px',color:colors.onSurfaceVariant}}>{p.f.join(' · ')}</p></div>
            <span style={{fontSize:'20px',fontWeight:800}}>${p.p}<span style={{fontSize:'12px',color:colors.onSurfaceVariant,fontWeight:500}}>/mo</span></span>
          </button>)}
        </div>
      </div>}

      {showCancel&&<div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}} onClick={()=>setShowCancel(false)}>
        <div onClick={e=>e.stopPropagation()} style={{background:colors.surfaceContainerHigh,borderRadius:radius.xl,padding:'32px',width:'100%',maxWidth:'440px'}}>
          <Icon name="warning" size={40} style={{color:'#fbbf24',marginBottom:'16px'}}/>
          <h3 style={{fontSize:'20px',fontWeight:700,marginBottom:'8px'}}>Cancel Your Plan?</h3>
          <p style={{fontSize:'14px',color:colors.onSurfaceVariant,lineHeight:1.7,marginBottom:'16px'}}>Your plan will remain active until your current billing cycle ends. After that, you&apos;ll lose access to all Pro features including 4K export, unlimited projects, analytics, and content calendar.</p>
          <p style={{fontSize:'13px',color:colors.onSurfaceVariant,marginBottom:'24px'}}>Your remaining credits will still be usable on the Free plan (3 watermarked clips/month, 720p).</p>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={()=>setShowCancel(false)} style={{flex:1,padding:'12px',borderRadius:radius.md,background:gradients.primary,color:'#FAF7FF',border:'none',fontWeight:700,fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Keep My Plan</button>
            <button onClick={()=>{alert('Plan cancelled. You will be notified by email.');setShowCancel(false);}} style={{flex:1,padding:'12px',borderRadius:radius.md,background:'transparent',color:colors.error,border:'1px solid rgba(255,180,171,0.3)',fontWeight:600,fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Cancel Plan</button>
          </div>
        </div>
      </div>}

      {showDelete&&<div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}} onClick={()=>setShowDelete(false)}>
        <div onClick={e=>e.stopPropagation()} style={{background:colors.surfaceContainerHigh,borderRadius:radius.xl,padding:'32px',width:'100%',maxWidth:'440px'}}>
          <Icon name="delete_forever" size={40} style={{color:colors.error,marginBottom:'16px'}}/>
          <h3 style={{fontSize:'20px',fontWeight:700,marginBottom:'8px'}}>Delete Your Account?</h3>
          <p style={{fontSize:'14px',color:colors.onSurfaceVariant,lineHeight:1.7,marginBottom:'16px'}}>This action is <strong style={{color:'#fff'}}>permanent and irreversible</strong>. All your projects, clips, analytics data, scheduled posts, and account information will be permanently erased. You will need to start completely from scratch.</p>
          <div style={{marginBottom:'16px'}}><label style={{fontSize:'12px',fontWeight:600,color:colors.onSurfaceVariant,display:'block',marginBottom:'6px'}}>Type DELETE to confirm</label><input value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} placeholder="DELETE" style={inputField}/></div>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={()=>{setShowDelete(false);setDeleteConfirm('');}} style={{flex:1,padding:'12px',borderRadius:radius.md,background:colors.surfaceContainer,color:colors.onSurface,border:'1px solid '+colors.outlineVariant,fontWeight:600,fontSize:'13px',cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>Cancel</button>
            <button disabled={deleteConfirm!=='DELETE'} onClick={()=>alert('Account deleted. Confirmation email sent.')} style={{flex:1,padding:'12px',borderRadius:radius.md,background:deleteConfirm==='DELETE'?colors.errorContainer:'rgba(255,180,171,0.05)',color:deleteConfirm==='DELETE'?'#fff':colors.onSurfaceVariant,border:'none',fontWeight:700,fontSize:'13px',cursor:deleteConfirm==='DELETE'?'pointer':'not-allowed',fontFamily:"'Inter',sans-serif",opacity:deleteConfirm==='DELETE'?1:0.4}}>Delete Permanently</button>
          </div>
        </div>
      </div>}
    </DashboardLayout>
  );
}
