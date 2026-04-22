'use client';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Icon from '@/components/Icon';
import { colors, gradients, radius, inputField } from '@/lib/tokens';

type ScheduledPost = {
  id: string; clip_title: string; hook_text: string; virality_score: number;
  caption: string; hashtags: string; platforms: string[];
  scheduled_date: string; scheduled_time: string; status: string;
};

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const HOURS = Array.from({length:13},(_,i)=>i+6);

export default function CalendarPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost|null>(null);
  const [showModal, setShowModal] = useState(false);

  // Load scheduled posts from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('hookclip_scheduled');
      if (stored) {
        setPosts(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Get current week dates
  function getWeekDates() {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7);
    return Array.from({length:7}, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }

  const weekDates = getWeekDates();
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function isToday(date: Date) {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  }

  function getPostsForSlot(dayIdx: number, hour: number) {
    const date = weekDates[dayIdx];
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return posts.filter(p => {
      if (p.scheduled_date !== dateStr) return false;
      const postHour = parseInt(p.scheduled_time.split(':')[0]);
      return postHour === hour;
    });
  }

  function getPostsForDay(dayIdx: number) {
    const date = weekDates[dayIdx];
    const dateStr = date.toISOString().split('T')[0];
    return posts.filter(p => p.scheduled_date === dateStr);
  }

  function deletePost(id: string) {
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    sessionStorage.setItem('hookclip_scheduled', JSON.stringify(updated));
    setSelectedPost(null);
  }

  const weekLabel = `${monthNames[weekDates[0].getMonth()]} ${weekDates[0].getDate()} – ${monthNames[weekDates[6].getMonth()]} ${weekDates[6].getDate()}, ${weekDates[6].getFullYear()}`;

  const platColors: Record<string,string> = { tiktok:'#C0C1FF', reels:'#E1306C', shorts:'#FF0000' };
  const platNames: Record<string,string> = { tiktok:'TikTok', reels:'Reels', shorts:'Shorts' };

  return (
    <DashboardLayout title="Content Calendar" subtitle="Schedule and manage your clips across platforms." actions={
      <button onClick={() => window.location.href='/clips'} style={{ background:gradients.cta, color:'#000', padding:'10px 20px', borderRadius:radius.md, fontWeight:700, fontSize:'13px', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontFamily:"'Inter',sans-serif" }}>
        <Icon name="movie" size={18}/> Go to Clips
      </button>
    }>

      {/* Week navigation */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <button onClick={() => setWeekOffset(w => w-1)} style={{ background:'none', border:'none', cursor:'pointer', color:colors.onSurfaceVariant }}><Icon name="chevron_left" size={24}/></button>
          <h3 style={{ fontSize:'18px', fontWeight:700 }}>{weekLabel}</h3>
          <button onClick={() => setWeekOffset(w => w+1)} style={{ background:'none', border:'none', cursor:'pointer', color:colors.onSurfaceVariant }}><Icon name="chevron_right" size={24}/></button>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ padding:'8px 16px', borderRadius:radius.md, background:colors.surfaceContainerHigh, border:'1px solid '+colors.outlineVariant, color:colors.onSurface, fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Today</button>}
          <div style={{ padding:'8px 14px', borderRadius:radius.md, background:'rgba(192,193,255,0.08)', fontSize:'12px', fontWeight:600, color:colors.primary }}>
            {posts.length} scheduled
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ background:colors.surfaceContainerHigh, borderRadius:radius.xl, overflow:'hidden' }}>
        {/* Day headers */}
        <div style={{ display:'grid', gridTemplateColumns:'60px repeat(7,1fr)' }}>
          <div style={{ padding:'12px', background:colors.surfaceContainerHighest }}/>
          {weekDates.map((date, i) => (
            <div key={i} style={{ padding:'12px 8px', textAlign:'center', background:colors.surfaceContainerHighest, borderLeft:i>0?'1px solid rgba(70,69,85,0.1)':'none' }}>
              <p style={{ fontSize:'11px', fontWeight:600, color:colors.onSurfaceVariant, textTransform:'uppercase', letterSpacing:'0.05em' }}>{DAYS[i]}</p>
              <p style={{
                fontSize:'18px', fontWeight:700, marginTop:'2px',
                color: isToday(date) ? colors.primary : colors.onSurface,
                background: isToday(date) ? 'rgba(192,193,255,0.15)' : 'transparent',
                width:32, height:32, borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center',
              }}>{date.getDate()}</p>
              {getPostsForDay(i).length > 0 && (
                <p style={{ fontSize:'10px', color:colors.primary, fontWeight:600, marginTop:2 }}>{getPostsForDay(i).length} post{getPostsForDay(i).length > 1 ? 's' : ''}</p>
              )}
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div style={{ maxHeight:'500px', overflowY:'auto' }}>
          {HOURS.map(hour => (
            <div key={hour} style={{ display:'grid', gridTemplateColumns:'60px repeat(7,1fr)', minHeight:'56px' }}>
              <div style={{ padding:'8px', fontSize:'11px', color:colors.onSurfaceVariant, fontWeight:500, textAlign:'right', paddingRight:'12px', borderTop:'1px solid rgba(70,69,85,0.08)' }}>
                {hour > 12 ? (hour-12)+'PM' : hour === 12 ? '12PM' : hour+'AM'}
              </div>
              {DAYS.map((_, dayIdx) => {
                const slotPosts = getPostsForSlot(dayIdx, hour);
                return (
                  <div key={dayIdx} style={{ borderTop:'1px solid rgba(70,69,85,0.08)', borderLeft:'1px solid rgba(70,69,85,0.05)', padding:'2px', cursor:'pointer' }}>
                    {slotPosts.map(post => (
                      <div key={post.id} onClick={() => setSelectedPost(post)} style={{
                        background: (platColors[post.platforms[0]] || '#C0C1FF') + '15',
                        borderLeft: '3px solid ' + (platColors[post.platforms[0]] || '#C0C1FF'),
                        borderRadius:'0 4px 4px 0', padding:'5px 8px', marginBottom:2, cursor:'pointer',
                      }}>
                        <p style={{ fontSize:'10px', fontWeight:600, color:platColors[post.platforms[0]] || '#C0C1FF', lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.clip_title}</p>
                        <p style={{ fontSize:'9px', color:colors.onSurfaceVariant }}>
                          {post.platforms.map(p => platNames[p] || p).join(', ')} · {post.scheduled_time}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming list below calendar */}
      {posts.length > 0 && (
        <div style={{ marginTop:'32px' }}>
          <h3 style={{ fontSize:'16px', fontWeight:700, marginBottom:'16px' }}>All Scheduled Posts ({posts.length})</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {posts.sort((a,b) => (a.scheduled_date + a.scheduled_time).localeCompare(b.scheduled_date + b.scheduled_time)).map(post => (
              <div key={post.id} onClick={() => setSelectedPost(post)} style={{
                background:colors.surfaceContainerHigh, borderRadius:radius.lg, padding:'14px 18px',
                display:'flex', alignItems:'center', gap:'14px', cursor:'pointer',
                borderLeft: '3px solid ' + (platColors[post.platforms[0]] || '#C0C1FF'),
              }}>
                <div style={{ width:40, height:40, borderRadius:radius.md, background:'rgba(192,193,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon name="calendar_month" size={18} style={{ color:colors.primary }}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'13px', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.clip_title}</p>
                  <p style={{ fontSize:'11px', color:colors.onSurfaceVariant, marginTop:2 }}>
                    {post.scheduled_date} at {post.scheduled_time} · {post.platforms.map(p => platNames[p] || p).join(', ')}
                  </p>
                </div>
                <div style={{ padding:'4px 10px', borderRadius:radius.full, background:'rgba(74,222,128,0.1)', fontSize:'11px', fontWeight:600, color:'#4ade80', flexShrink:0 }}>
                  {post.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px 20px', marginTop:24 }}>
          <Icon name="calendar_month" size={48} style={{ color:colors.onSurfaceVariant, marginBottom:16 }}/>
          <p style={{ fontSize:'16px', fontWeight:600, marginBottom:8 }}>No scheduled posts</p>
          <p style={{ fontSize:'13px', color:colors.onSurfaceVariant, marginBottom:20 }}>Generate clips and use the Schedule button to add them here</p>
          <button onClick={() => window.location.href='/import'} style={{ padding:'12px 28px', borderRadius:radius.md, background:gradients.primary, color:'#FAF7FF', border:'none', fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Import Video</button>
        </div>
      )}

      {/* ═══ POST DETAIL MODAL ═══ */}
      {selectedPost && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }} onClick={() => setSelectedPost(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background:colors.surfaceContainerHigh, borderRadius:radius.xl, padding:'32px', width:'100%', maxWidth:'440px', animation:'fadeInUp 0.25s ease-out' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <h3 style={{ fontSize:'18px', fontWeight:700 }}>Scheduled Post</h3>
              <button onClick={() => setSelectedPost(null)} style={{ background:'none', border:'none', cursor:'pointer', color:colors.onSurfaceVariant }}><Icon name="close" size={22}/></button>
            </div>

            <div style={{ background:colors.surfaceContainer, borderRadius:radius.md, padding:'16px', marginBottom:'16px' }}>
              <p style={{ fontSize:'15px', fontWeight:600, marginBottom:6 }}>{selectedPost.clip_title}</p>
              <p style={{ fontSize:'12px', color:colors.onSurfaceVariant, fontStyle:'italic', marginBottom:8 }}>&ldquo;{selectedPost.hook_text}&rdquo;</p>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {selectedPost.platforms.map(p => (
                  <span key={p} style={{ padding:'3px 10px', borderRadius:radius.full, background:(platColors[p]||'#C0C1FF')+'15', color:platColors[p]||'#C0C1FF', fontSize:'11px', fontWeight:600 }}>
                    {platNames[p] || p}
                  </span>
                ))}
              </div>
            </div>

            {selectedPost.caption && (
              <div style={{ marginBottom:12 }}>
                <p style={{ fontSize:'11px', fontWeight:600, color:colors.onSurfaceVariant, marginBottom:4 }}>Caption</p>
                <p style={{ fontSize:'13px', color:colors.onSurface, lineHeight:1.5 }}>{selectedPost.caption}</p>
              </div>
            )}

            {selectedPost.hashtags && (
              <div style={{ marginBottom:12 }}>
                <p style={{ fontSize:'11px', fontWeight:600, color:colors.onSurfaceVariant, marginBottom:4 }}>Hashtags</p>
                <p style={{ fontSize:'13px', color:colors.primary }}>{selectedPost.hashtags}</p>
              </div>
            )}

            <div style={{ display:'flex', gap:16, marginBottom:20 }}>
              <div>
                <p style={{ fontSize:'11px', fontWeight:600, color:colors.onSurfaceVariant, marginBottom:4 }}>Date</p>
                <p style={{ fontSize:'13px', fontWeight:600 }}>{selectedPost.scheduled_date}</p>
              </div>
              <div>
                <p style={{ fontSize:'11px', fontWeight:600, color:colors.onSurfaceVariant, marginBottom:4 }}>Time</p>
                <p style={{ fontSize:'13px', fontWeight:600 }}>{selectedPost.scheduled_time}</p>
              </div>
              <div>
                <p style={{ fontSize:'11px', fontWeight:600, color:colors.onSurfaceVariant, marginBottom:4 }}>Virality</p>
                <p style={{ fontSize:'13px', fontWeight:700, color:selectedPost.virality_score >= 85 ? '#4ade80' : '#C0C1FF' }}>{selectedPost.virality_score}</p>
              </div>
            </div>

            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => deletePost(selectedPost.id)} style={{ flex:1, padding:'12px', borderRadius:radius.md, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444', fontWeight:600, fontSize:'13px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
                Delete
              </button>
              <button onClick={() => setSelectedPost(null)} style={{ flex:1, padding:'12px', borderRadius:radius.md, background:gradients.primary, border:'none', color:'#FAF7FF', fontWeight:600, fontSize:'13px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{'@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}'}</style>
    </DashboardLayout>
  );
}
