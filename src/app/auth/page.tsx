'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { colors, gradients, radius, inputField } from '@/lib/tokens';
export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const getStrength = (p: string) => { let s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return s; };
  const str = getStrength(password);
  const strLabel = ['','Weak','Fair','Good','Strong'][str]||'';
  const strColor = ['','#ef4444','#fbbf24','#89CEFF','#4ade80'][str]||'';
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); if(isSignUp){ setTimeout(()=>{setShowVerify(true);setLoading(false);},800); } else { setTimeout(()=>router.push('/dashboard'),800); } };
  const handleGoogle = () => { router.push('/dashboard'); };
  if (showVerify) return (
    <main style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:colors.background,fontFamily:"'Inter',sans-serif" }}>
      <div style={{ textAlign:'center',maxWidth:400,padding:32 }}>
        <div style={{ width:72,height:72,borderRadius:'50%',background:'rgba(74,222,128,0.1)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px' }}><Icon name="mark_email_read" size={36} style={{ color:'#4ade80' }} /></div>
        <h2 style={{ fontSize:24,fontWeight:700,marginBottom:8 }}>Check your email</h2>
        <p style={{ color:colors.onSurfaceVariant,fontSize:14,marginBottom:24,lineHeight:1.7 }}>We sent a verification link to <strong style={{ color:'#fff' }}>{email}</strong>. Click the link to activate your account.</p>
        <button onClick={()=>setShowVerify(false)} style={{ background:'none',border:'none',color:colors.primary,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Inter',sans-serif" }}>Didn&apos;t receive it? Resend</button>
      </div>
    </main>
  );
  return (
    <main style={{ minHeight:'100vh',display:'flex',fontFamily:"'Inter',sans-serif" }}>
      <section className="auth-left" style={{ position:'relative',flex:'0 0 55%',overflow:'hidden',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:48,background:'linear-gradient(135deg,'+colors.background+','+colors.surfaceContainer+',#430076)' }}>
        <div style={{ position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'radial-gradient(at 0% 0%,#9c48ea 0px,transparent 50%),radial-gradient(at 100% 0%,#17a8ec 0px,transparent 50%),radial-gradient(at 100% 100%,#cc97ff 0px,transparent 50%)',filter:'blur(80px)',opacity:0.4 }} />
        <div style={{ position:'relative',zIndex:10 }}><h1 onClick={()=>router.push('/')} style={{ fontSize:24,fontWeight:900,cursor:'pointer' }}>ContentClip</h1></div>
        <div style={{ position:'relative',zIndex:10,maxWidth:520 }}>
          <Icon name="format_quote" filled size={40} style={{ color:colors.primary,marginBottom:24 }} />
          <blockquote style={{ fontSize:'clamp(28px,3.5vw,44px)',fontWeight:700,lineHeight:1.15,marginBottom:32 }}>ContentClip turned my podcast into a TikTok growth machine.</blockquote>
          <div style={{ display:'flex',alignItems:'center',gap:16 }}>
            <div style={{ width:48,height:48,borderRadius:'50%',background:gradients.cta,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'#000' }}>A</div>
            <div><p style={{ fontWeight:600,fontSize:14 }}>Alex Nguyen</p><p style={{ fontSize:12,color:colors.onSurfaceVariant }}>Creator · 2.1M followers</p></div>
          </div>
        </div>
        <div />
      </section>
      <section className="auth-right" style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'48px 32px',background:colors.background }}>
        <div style={{ width:'100%',maxWidth:400 }}>
          <h2 style={{ fontSize:28,fontWeight:800,marginBottom:8 }}>{isSignUp?'Create your account':'Welcome back'}</h2>
          <p style={{ color:colors.onSurfaceVariant,fontSize:14,marginBottom:32 }}>{isSignUp?'Start creating viral clips.':'Sign in to your studio.'}</p>
          <button onClick={handleGoogle} style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:12,borderRadius:radius.md,background:colors.surfaceContainerHigh,border:'1px solid '+colors.outlineVariant,color:colors.onSurface,fontWeight:600,fontSize:14,cursor:'pointer',marginBottom:24,fontFamily:"'Inter',sans-serif" }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
          <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:24 }}><div style={{ flex:1,height:1,background:colors.outlineVariant }}/><span style={{ fontSize:12,color:colors.onSurfaceVariant }}>or</span><div style={{ flex:1,height:1,background:colors.outlineVariant }}/></div>
          <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:16 }}>
            {isSignUp&&<div><label style={{ fontSize:12,fontWeight:600,color:colors.onSurfaceVariant,display:'block',marginBottom:6 }}>Full Name</label><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" required style={inputField}/></div>}
            <div><label style={{ fontSize:12,fontWeight:600,color:colors.onSurfaceVariant,display:'block',marginBottom:6 }}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required style={inputField}/></div>
            <div>
              <label style={{ fontSize:12,fontWeight:600,color:colors.onSurfaceVariant,display:'block',marginBottom:6 }}>Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 8 chars, uppercase, number, symbol" required style={inputField}/>
              {password&&<div style={{ marginTop:8 }}><div style={{ display:'flex',gap:4,marginBottom:4 }}>{[1,2,3,4].map(i=><div key={i} style={{ flex:1,height:3,borderRadius:2,background:i<=str?strColor:colors.surfaceContainerHigh }}/>)}</div><p style={{ fontSize:11,color:strColor,fontWeight:600 }}>{strLabel}{str<3&&' — add uppercase, numbers, or symbols'}</p></div>}
            </div>
            <button type="submit" disabled={loading} style={{ background:gradients.primary,color:'#FAF7FF',fontWeight:700,padding:14,borderRadius:radius.md,border:'none',cursor:'pointer',fontSize:14,opacity:loading?0.7:1,marginTop:8,fontFamily:"'Inter',sans-serif" }}>{loading?'Please wait...':isSignUp?'Create Account':'Sign In'}</button>
          </form>
          <p style={{ textAlign:'center',fontSize:13,color:colors.onSurfaceVariant,marginTop:24 }}>{isSignUp?'Already have an account?':"Don't have an account?"}{' '}<button onClick={()=>setIsSignUp(!isSignUp)} style={{ background:'none',border:'none',color:colors.primary,fontWeight:600,cursor:'pointer',fontSize:13,fontFamily:"'Inter',sans-serif" }}>{isSignUp?'Sign in':'Create one'}</button></p>
        </div>
      </section>
      <style>{'@media(max-width:768px){.auth-left{display:none!important}}'}</style>
    </main>
  );
}
