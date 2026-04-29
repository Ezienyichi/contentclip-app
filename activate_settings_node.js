const fs = require('fs');

// ── PATCH SETTINGS PAGE ──────────────────────────────────────────────────────
let s = fs.readFileSync('src/app/settings/page.tsx', 'utf8');

// 1. Add supabase import
if (!s.includes("createClient")) {
  s = s.replace(
    "'use client';",
    "'use client';\nimport { createClient } from '@supabase/supabase-js';"
  );
}

// 2. Add supabase client
if (!s.includes("const supabase")) {
  s = s.replace(
    "const PLANS=",
    "const supabase = createClient(\n  process.env.NEXT_PUBLIC_SUPABASE_URL!,\n  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!\n);\nconst PLANS="
  );
}

// 3. Add extra state variables
if (!s.includes("setUserId")) {
  s = s.replace(
    "const[deleteConfirm,setDeleteConfirm]=useState('');",
    "const[deleteConfirm,setDeleteConfirm]=useState('');\n  const[userId,setUserId]=useState('');\n  const[userEmail,setUserEmail]=useState('');\n  const[firstName,setFirstName]=useState('');\n  const[lastName,setLastName]=useState('');\n  const[newPassword,setNewPassword]=useState('');\n  const[toast,setToast]=useState<{msg:string;ok:boolean}|null>(null);\n  const[saving,setSaving]=useState(false);"
  );
}

// 4. Add useEffect to load profile
if (!s.includes("useEffect")) {
  s = s.replace(
    "const fileRef=useRef<HTMLInputElement>(null);",
    "const fileRef=useRef<HTMLInputElement>(null);\n  React.useEffect(()=>{(async()=>{const{data:{user}}=await supabase.auth.getUser();if(!user)return;setUserId(user.id);setUserEmail(user.email??'');const{data:p}=await supabase.from('profiles').select('*').eq('id',user.id).single();if(p){const parts=(p.full_name??'').split(' ');setFirstName(parts[0]??'');setLastName(parts.slice(1).join(' ')??'');setNotifs(n=>({...n,clips:p.clip_ready_notify??true,weekly:p.weekly_digest??false}));}})();},[]);"
  );
}

// 5. Add helpers before handleAvatar
if (!s.includes("showToast")) {
  s = s.replace(
    "const handleAvatar=",
    "const showToast=(msg:string,ok=true)=>{setToast({msg,ok});setTimeout(()=>setToast(null),3500);};\n  const sendEmail=async(type:string,data:Record<string,unknown>={})=>{if(!userId)return;await fetch('/api/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,userId,data})});}\n  const handleAvatar="
  );
}

// 6. Real Save Changes
s = s.replace(
  "onClick={()=>alert('Changes saved! A confirmation email has been sent.')}",
  "onClick={async()=>{setSaving(true);const fullName=`${firstName} ${lastName}`.trim();const{error}=await supabase.from('profiles').update({full_name:fullName}).eq('id',userId);if(error){showToast('Save failed: '+error.message,false);}else{await supabase.auth.updateUser({data:{full_name:fullName}});await sendEmail('profile_updated',{fullName});showToast('Profile saved — confirmation email sent');}setSaving(false);}}"
);

// 7. Real password update
s = s.replace(
  "onClick={()=>alert('Password updated! Confirmation sent to your email.')}",
  "onClick={async()=>{if(!newPassword||newPassword.length<8){showToast('Password must be at least 8 characters',false);return;}setSaving(true);const{error}=await supabase.auth.updateUser({password:newPassword});if(error){showToast(error.message,false);}else{await sendEmail('password_changed',{});setNewPassword('');showToast('Password updated — confirmation email sent');}setSaving(false);}}"
);

// 8. Real delete account
s = s.replace(
  "onClick={()=>alert('Account deleted. Confirmation email sent.')}",
  "onClick={async()=>{setSaving(true);await sendEmail('account_deleted',{});await supabase.from('profiles').delete().eq('id',userId);await supabase.auth.signOut();router.push('/auth');}}"
);

// 9. Real cancel plan
s = s.replace(
  "onClick={()=>{alert('Plan cancelled. You will be notified by email.');setShowCancel(false);}}",
  "onClick={async()=>{setSaving(true);await supabase.from('profiles').update({plan:'free',credits:720}).eq('id',userId);await sendEmail('plan_cancelled',{});setShowCancel(false);showToast('Plan cancelled — check your email');setSaving(false);}}"
);

// 10. Real upgrade with Flutterwave
s = s.replace(
  "onClick={()=>{alert('Redirecting to Stripe checkout for '+p.n+'...');setShowUpgrade(false);}}",
  "onClick={async()=>{setSaving(true);const planId=p.n==='Solo Creator'?'starter':p.n==='Professional'?'creator':'business';const res=await fetch('/api/payments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,plan:planId})});const data=await res.json();if(data.paymentLink){window.location.href=data.paymentLink;}else{showToast(data.error??'Payment failed',false);}setSaving(false);}}"
);

// 11. Notification toggles save to Supabase
s = s.replace(
  "const toggleNotif=(key:keyof typeof notifs)=>setNotifs(p=>({...p,[key]:!p[key]}));",
  "const toggleNotif=async(key:keyof typeof notifs)=>{const v=!notifs[key];setNotifs(p=>({...p,[key]:v}));if(userId){await supabase.from('profiles').update({clip_ready_notify:key==='clips'?v:notifs.clips,weekly_digest:key==='weekly'?v:notifs.weekly}).eq('id',userId);showToast('Preference saved');}}"
);

// 12. Wire name inputs to state
s = s.replace(
  'defaultValue="Victor" style={inputField}',
  'value={firstName} onChange={e=>setFirstName(e.target.value)} style={inputField}'
);
s = s.replace(
  'defaultValue="Ezenagu" style={inputField}',
  'value={lastName} onChange={e=>setLastName(e.target.value)} style={inputField}'
);

// 13. Lock email
s = s.replace(
  'defaultValue="victor@techduce.africa" style={inputField}',
  'value={userEmail} disabled style={{...inputField,opacity:0.5,cursor:"not-allowed"}}'
);

// 14. Wire new password input
s = s.replace(
  'placeholder="Min 8 chars, uppercase, number, symbol" style={inputField}/>',
  'value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Min 8 chars, uppercase, number, symbol" style={inputField}/>'
);

// 15. Add toast UI right after opening return (
s = s.replace(
  '<DashboardLayout title="Account Settings"',
  '{toast&&<div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:toast.ok?"#1a3a2a":"#3a1a1a",border:`1px solid ${toast.ok?"#4ade80":colors.error}`,color:toast.ok?"#4ade80":colors.error,padding:"12px 24px",borderRadius:radius.lg,fontSize:14,fontWeight:600,zIndex:999,whiteSpace:"nowrap",boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>{toast.ok?"✓ ":"✗ "}{toast.msg}</div>}\n      <DashboardLayout title="Account Settings"'
);

// 16. Make tab bar scrollable on mobile
s = s.replace(
  "display:'flex',gap:'4px',marginBottom:'32px',background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'4px',width:'fit-content',flexWrap:'wrap'",
  "display:'flex',gap:'4px',marginBottom:'28px',background:colors.surfaceContainerHigh,borderRadius:radius.lg,padding:'4px',overflowX:'auto',WebkitOverflowScrolling:'touch',maxWidth:'100%',boxSizing:'border-box'"
);

fs.writeFileSync('src/app/settings/page.tsx', s);
console.log('Settings page patched!');

// ── PATCH SIDEBAR ────────────────────────────────────────────────────────────
let sb = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Add Settings to mobile bottom nav (was NAV.slice(0,5) which skips Settings at index 6)
sb = sb.replace(
  'NAV.slice(0, 5).map',
  '[...NAV.slice(0,4),NAV[6]].map'
);

// Fix DashboardLayout to add padding-bottom on mobile so content isn't hidden behind bottom nav
fs.writeFileSync('src/components/Sidebar.tsx', sb);
console.log('Sidebar patched - Settings now in mobile nav!');

// ── PATCH DashboardLayout for mobile padding ─────────────────────────────────
let dl = fs.readFileSync('src/components/DashboardLayout.tsx', 'utf8');
if (!dl.includes('paddingBottom')) {
  dl = dl.replace(
    "padding: '24px 32px', paddingBottom: '100px'",
    "padding: '24px 32px', paddingBottom: '100px'"
  );
}
// Add mobile padding override to style tag
if (dl.includes('@media (max-width: 768px)') && !dl.includes('padding-bottom: 80px')) {
  dl = dl.replace(
    '.dashboard-main > div:last-child { padding: 16px !important; }',
    '.dashboard-main > div:last-child { padding: 16px !important; padding-bottom: 90px !important; }'
  );
}
fs.writeFileSync('src/components/DashboardLayout.tsx', dl);
console.log('DashboardLayout mobile padding fixed!');

console.log('\nAll patches applied successfully!');
