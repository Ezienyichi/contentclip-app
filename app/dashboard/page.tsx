"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DEMO_CLIPS = [
  { id: "c1", title: "The AI Revolution Nobody Talks About", hook: "Everyone is focused on ChatGPT, but the real AI revolution is happening in video...", duration: 47, virality: 94, hookStr: 92, engagement: 8.7, transcript: "Everyone is focused on ChatGPT, but the real AI revolution is happening in video production. Let me show you why creators who adopt AI editing tools are seeing 300% more engagement..." },
  { id: "c2", title: "Why Your Videos Get Zero Views", hook: "I analyzed 10,000 short-form videos and found the #1 reason most creators fail...", duration: 58, virality: 91, hookStr: 89, engagement: 7.9, transcript: "I analyzed 10,000 short-form videos and found the #1 reason most creators fail..." },
  { id: "c3", title: "The Hook Formula That Went Viral", hook: "This 3-word hook formula generated 2.3 million views in 48 hours...", duration: 34, virality: 89, hookStr: 95, engagement: 9.2, transcript: "This 3-word hook formula generated 2.3 million views in 48 hours..." },
  { id: "c4", title: "Stop Editing Videos Like It's 2020", hook: "If you're still manually cutting your content, you're wasting 40 hours a month...", duration: 62, virality: 87, hookStr: 84, engagement: 7.4, transcript: "If you're still manually cutting your long-form content..." },
  { id: "c5", title: "I Made 30 Clips From One Podcast", hook: "One 45-minute podcast episode just became my entire month of content...", duration: 41, virality: 86, hookStr: 88, engagement: 8.1, transcript: "One 45-minute podcast episode just became my entire month of content..." },
  { id: "c6", title: "The Caption Style Getting 3x Engagement", hook: "After testing 12 caption styles, one style dominated...", duration: 39, virality: 84, hookStr: 82, engagement: 7.6, transcript: "After testing 12 caption styles across 500 videos, one style dominated..." },
  { id: "c7", title: "Auto-Reframing: The Vertical Video Secret", hook: "The difference between a viral clip and a forgettable one is the framing...", duration: 52, virality: 82, hookStr: 79, engagement: 7.1, transcript: "The difference between a viral clip and a forgettable one is often just the framing..." },
  { id: "c8", title: "B-Roll That Makes Videos Premium", hook: "Professional creators spend $500+ on B-Roll. AI does it free...", duration: 44, virality: 80, hookStr: 81, engagement: 7.3, transcript: "Professional creators spend $500+ on B-Roll footage..." },
  { id: "c9", title: "Delete Your Filler Words Automatically", hook: "Every um and uh kills watch time. AI removes them instantly...", duration: 31, virality: 78, hookStr: 77, engagement: 6.9, transcript: "Filler words kill watch time..." },
  { id: "c10", title: "Brand Kit: One Click Professional Look", hook: "Agencies charge $200 to brand-kit a video. AI does it in 3 seconds...", duration: 36, virality: 76, hookStr: 74, engagement: 6.7, transcript: "It takes agencies hours to brand-kit a video..." },
  { id: "c11", title: "Voice Cloning for Global Reach", hook: "Your voice, in 20 languages. AI voice cloning changes everything...", duration: 55, virality: 74, hookStr: 76, engagement: 7.0, transcript: "Your voice, in 20 languages..." },
  { id: "c12", title: "The 60fps Export Advantage", hook: "99% of creators export at 30fps. Here's why 60fps doubles quality...", duration: 28, virality: 71, hookStr: 68, engagement: 6.2, transcript: "99% of creators export at 30fps..." },
];

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  credits: number;
  daily_credits: number;
  plan: string;
  email_verified: boolean;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState("clips");
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("virality");
  const [loading, setLoading] = useState(true);
  const [clipTab, setClipTab] = useState("captions");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data as Profile);
      } else {
        setProfile({
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || user.email || "",
          credits: 30,
          daily_credits: 30,
          plan: "free",
          email_verified: false,
        });
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const credits = profile ? (profile.plan === "free" ? profile.daily_credits : profile.credits) : 0;

  const handleDownload = async (clipId: string, title: string) => {
    if (credits < 1) {
      alert("No credits remaining! Upgrade your plan.");
      return;
    }

    try {
      const res = await fetch("/api/credits/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clip_id: clipId, amount: 1, type: "download" }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Downloaded "${title}" — 1 credit used. ${data.remaining} remaining.`);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (p) setProfile(p as Profile);
        }
      } else {
        alert(data.error || "Failed to download");
      }
    } catch {
      alert("Download failed. Check your connection.");
    }
  };

  const sorted = [...DEMO_CLIPS].sort((a, b) =>
    sortBy === "virality" ? b.virality - a.virality :
    sortBy === "hook" ? b.hookStr - a.hookStr :
    a.duration - b.duration
  );

  const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const scoreColor = (s: number) => s >= 85 ? "#34D399" : s >= 70 ? "#FBBF24" : "#F87171";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B0E1A", color: "#E8E9ED" }}>
        Loading dashboard...
      </div>
    );
  }

  const sidebarItems = [
    { id: "clips", label: "My Clips", icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
    { id: "projects", label: "Projects", icon: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" },
    { id: "brandkit", label: "Brand Kit", icon: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10" },
    { id: "schedule", label: "Schedule", icon: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18" },
    { id: "analytics", label: "Analytics", icon: "M12 20V10M18 20V4M6 20v-4" },
    { id: "settings", label: "Settings", icon: "M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0" },
  ];

  const selectedClipData = DEMO_CLIPS.find(c => c.id === selectedClip);

  return (
    <div className="min-h-screen" style={{ background: "#0B0E1A" }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8" style={{ background: "rgba(11,14,26,.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                <line x1="20" y1="4" x2="8.12" y2="15.88"/>
                <line x1="14.47" y1="14.48" x2="20" y2="20"/>
              </svg>
            </div>
            <span className="text-lg font-extrabold text-white" style={{ fontFamily: "Georgia, serif" }}>HelpEdit</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(124,58,237,.15)", border: "1px solid rgba(124,58,237,.25)", color: "#A78BFA" }}>
              {credits} credits
            </div>
            <span className="text-xs text-gray-500 hidden sm:inline">{profile?.plan === "free" ? "Free Plan" : profile?.plan?.charAt(0).toUpperCase() + profile?.plan?.slice(1) + " Plan"}</span>
            <button onClick={handleLogout} className="text-xs font-semibold px-3 py-1.5 rounded-xl text-gray-400 border border-white/10 hover:border-purple-500/25 transition-all">
              Log out
            </button>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* SIDEBAR */}
        <aside className="hidden md:block w-52 shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto" style={{ background: "#101428", borderRight: "1px solid rgba(255,255,255,.06)" }}>
          <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#6E7282", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
            Dashboard
          </div>
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedClip(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all border-l-[3px]"
              style={{
                borderColor: activeTab === item.id ? "#7C3AED" : "transparent",
                color: activeTab === item.id ? "#A78BFA" : "#6E7282",
                background: activeTab === item.id ? "rgba(124,58,237,.15)" : "transparent",
              }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4"><path d={item.icon}/></svg>
              {item.label}
            </button>
          ))}

          {/* Credits box */}
          <div className="p-4 mt-4" style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
            <div className="p-3 rounded-xl" style={{ background: "rgba(124,58,237,.15)", border: "1px solid rgba(124,58,237,.25)" }}>
              <div className="text-[11px] font-semibold mb-1" style={{ color: "#A78BFA" }}>Credits</div>
              <div className="text-xl font-extrabold text-white">{credits}</div>
              <div className="text-[10px] mt-1" style={{ color: "#6E7282" }}>{profile?.plan === "free" ? "Daily reset" : "Monthly"}</div>
              <Link href="/#pricing" className="block w-full text-center mt-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-800">
                Get More
              </Link>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto min-h-[calc(100vh-64px)]">

          {/* ── CLIPS TAB ── */}
          {activeTab === "clips" && (
            <>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h1 className="text-xl font-bold text-white">My AI Clips</h1>
                  <p className="text-xs mt-0.5" style={{ color: "#6E7282" }}>{DEMO_CLIPS.length} clips · AI-ranked by virality</p>
                </div>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs text-white" style={{ background: "#1A1F35", border: "1px solid rgba(255,255,255,.06)" }}>
                  <option value="virality">Sort by Virality</option>
                  <option value="hook">Sort by Hook Strength</option>
                  <option value="duration">Sort by Duration</option>
                </select>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Total Clips", val: DEMO_CLIPS.length, color: "white" },
                  { label: "Avg Virality", val: Math.round(DEMO_CLIPS.reduce((a, c) => a + c.virality, 0) / DEMO_CLIPS.length), color: "#34D399" },
                  { label: "Credits Left", val: credits, color: "#A78BFA" },
                  { label: "Plan", val: profile?.plan === "free" ? "Free" : profile?.plan?.charAt(0).toUpperCase() + profile?.plan?.slice(1), color: "white" },
                ].map(s => (
                  <div key={s.label} className="p-4 rounded-xl" style={{ background: "#101428", border: "1px solid rgba(255,255,255,.06)" }}>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: "#6E7282" }}>{s.label}</div>
                    <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Clips grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {sorted.map(c => (
                  <div key={c.id} onClick={() => setSelectedClip(c.id)}
                    className="rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
                    style={{ background: "#101428", border: "1px solid rgba(255,255,255,.06)" }}>
                    {/* Thumbnail */}
                    <div className="w-full h-32 relative flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, hsl(${c.virality * 2.5},40%,14%), #1E2440)` }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 opacity-20" style={{ color: "#6E7282" }}>
                        <rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
                      </svg>
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: scoreColor(c.virality) + "20", color: scoreColor(c.virality), border: `1px solid ${scoreColor(c.virality)}30` }}>
                        {c.virality}
                      </span>
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono bg-black/70 text-white">
                        {fmtDur(c.duration)}
                      </span>
                    </div>
                    {/* Body */}
                    <div className="p-3">
                      <div className="text-xs font-semibold text-white truncate">{c.title}</div>
                      <div className="text-[11px] truncate mt-0.5" style={{ color: "#6E7282" }}>{c.hook}</div>
                    </div>
                    {/* Footer */}
                    <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
                      <span className="text-[11px]" style={{ color: "#6E7282" }}>Hook: {c.hookStr}</span>
                      <button onClick={(e) => { e.stopPropagation(); handleDownload(c.id, c.title); }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-800">
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── PROJECTS TAB ── */}
          {activeTab === "projects" && (
            <div>
              <h1 className="text-xl font-bold text-white mb-4">Projects</h1>
              <div className="p-6 rounded-xl" style={{ background: "#101428", border: "1px solid rgba(255,255,255,.06)" }}>
                <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                  <div>
                    <div className="font-semibold text-white">Demo Project</div>
                    <div className="text-xs" style={{ color: "#6E7282" }}>{DEMO_CLIPS.length} clips generated</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: "rgba(52,211,153,.1)", color: "#34D399", border: "1px solid rgba(52,211,153,.2)" }}>
                    Completed
                  </span>
                </div>
                <p className="text-center py-8 text-sm" style={{ color: "#6E7282" }}>Upload more videos to create projects.</p>
              </div>
            </div>
          )}

          {/* ── BRAND KIT TAB ── */}
          {activeTab === "brandkit" && (
            <div>
              <h1 className="text-xl font-bold text-white mb-4">Brand Kit</h1>
              <div className="p-6 rounded-xl" style={{ background: "#101428", border: "1px solid rgba(255,255,255,.06)" }}>
                <h3 className="font-semibold text-white mb-4">Default Kit</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9B9EAA" }}>Primary Color</label>
                    <div className="flex gap-2">
                      <input type="color" defaultValue="#7C3AED" className="w-10 h-10 rounded-lg border-none cursor-pointer" />
                      <input type="text" defaultValue="#7C3AED" className="flex-1 px-3 py-2 rounded-lg text-sm text-white" style={{ background: "#1A1F35", border: "1px solid rgba(255,255,255,.06)" }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9B9EAA" }}>Secondary Color</label>
                    <div className="flex gap-2">
                      <input type="color" defaultValue="#A78BFA" className="w-10 h-10 rounded-lg border-none cursor-pointer" />
                      <input type="text" defaultValue="#A78BFA" className="flex-1 px-3 py-2 rounded-lg text-sm text-white" style={{ background: "#1A1F35", border: "1px solid rgba(255,255,255,.06)" }} />
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9B9EAA" }}>Logo Upload</label>
                  <div className="p-6 rounded-xl text-center cursor-pointer" style={{ border: "1px dashed rgba(255,255,255,.12)" }}>
                    <p className="text-xs" style={{ color: "#6E7282" }}>Click to upload logo (PNG, SVG)</p>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9B9EAA" }}>Font</label>
                  <select className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: "#1A1F35", border: "1px solid rgba(255,255,255,.06)" }}>
                    <option>Sora</option><option>Inter</option><option>Montserrat</option><option>Poppins</option>
                  </select>
                </div>
                <button onClick={() => alert("Brand kit saved!")} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-800">
                  Save Brand Kit
                </button>
              </div>
            </div>
          )}

          {/* ── SCHEDULE TAB ── */}
          {activeTab === "schedule" && (
            <div>
              <h1 className="text-xl font-bold text-white mb-4">Schedule</h1>
              <div className="p-12 rounded-xl text-center" style={{ background: "#101428", border: "1px solid rgba(255,255,255,.06)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-12 h-12 mx-auto mb-4" style={{ color: "#6E7282" }}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <h3 className="font-semibold text-white mb-2">Content Calendar</h3>
                <p className="text-sm mb-4" style={{ color: "#6E7282" }}>Connect your social accounts to schedule AI-optimized posts to YouTube, TikTok, Instagram, and LinkedIn.</p>
                <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-300 border border-white/10 hover:border-purple-500/25 transition-all">
                  Connect Accounts
                </button>
              </div>
            </div>
          )}

          {/* ── ANALYTICS TAB ── */}
          {activeTab === "analytics" && (
            <div>
              <h1 className="text-xl font-bold text-white mb-4">Analytics</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { l: "Clips This Month", v: DEMO_CLIPS.length },
                  { l: "Downloads", v: profile ? (profile.plan === "free" ? 30 - profile.daily_credits : 0) : 0 },
                  { l: "Avg Virality", v: Math.round(DEMO_CLIPS.reduce((a, c) => a + c.virality, 0) / DEMO_CLIPS.length), color: "#34D399" },
                  { l: "Processing", v: "4.2 min" },
                ].map(s => (
                  <div key={s.l} className="p-4 rounded-xl" style={{ background: "#101428", border: "1px solid rgba(255,255,255,.06)" }}>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: "#6E7282" }}>{s.l}</div>
                    <div className="text-2xl font-extrabold" style={{ color: (s as {color?: string}).color || "white" }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div className="p-5 rounded-xl" style={{ background: "#101428", border: "1px solid rgba(255,255,255,.06)" }}>
                <h3 className="font-semibold text-white mb-3">Virality Distribution</h3>
                <div className="flex gap-1.5 items-end h-24">
                  {DEMO_CLIPS.map(c => (
                    <div key={c.id} className="flex-1 rounded-t" title={`${c.title}: ${c.virality}`}
                      style={{ height: `${c.virality}%`, background: "linear-gradient(to top, #7C3AED, #A78BFA)", opacity: 0.8, minWidth: 8 }} />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px]" style={{ color: "#6E7282" }}>Clips ranked by virality</span>
                  <span className="text-[10px]" style={{ color: "#6E7282" }}>Score 0-100</span>
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === "settings" && (
            <div>
              <h1 className="text-xl font-bold text-white mb-4">Settings</h1>
              <div className="p-5 rounded-xl mb-3" style={{ background: "#101428", border: "1px solid rgba(255,255,255,.06)" }}>
                <h3 className="font-semibold text-white mb-3">Account</h3>
                <div className="space-y-0">
                  {[
                    { label: "Email", value: profile?.email || "" },
                    { label: "Name", value: profile?.full_name || "" },
                    { label: "Verification", value: profile?.email_verified ? "Verified" : "Not verified" },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                      <div>
                        <div className="text-sm text-white">{row.label}</div>
                        <div className="text-xs" style={{ color: "#6E7282" }}>{row.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-xl mb-3" style={{ background: "#101428", border: "1px solid rgba(255,255,255,.06)" }}>
                <h3 className="font-semibold text-white mb-3">Plan & Billing</h3>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm text-white">Current Plan</div>
                    <div className="text-xs" style={{ color: "#6E7282" }}>
                      {profile?.plan === "free" ? "Free" : profile?.plan?.charAt(0).toUpperCase() + profile?.plan?.slice(1)} — {credits} credits
                    </div>
                  </div>
                  <Link href="/#pricing" className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-800">
                    Upgrade
                  </Link>
                </div>
              </div>
              <div className="p-5 rounded-xl" style={{ background: "#101428", border: "1px solid rgba(255,255,255,.06)" }}>
                <h3 className="font-semibold text-white mb-3">Danger Zone</h3>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm text-red-400">Delete Account</div>
                    <div className="text-xs" style={{ color: "#6E7282" }}>Permanently delete your account and data</div>
                  </div>
                  <button className="px-4 py-2 rounded-xl text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ── CLIP DETAIL PANEL ── */}
        {selectedClipData && (
          <aside className="fixed top-16 right-0 w-[420px] max-w-[95vw] h-[calc(100vh-64px)] overflow-y-auto z-40"
            style={{ background: "#101428", borderLeft: "1px solid rgba(255,255,255,.06)", boxShadow: "-8px 0 40px rgba(0,0,0,.4)" }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
              <h3 className="text-sm font-semibold text-white truncate pr-4">{selectedClipData.title}</h3>
              <button onClick={() => setSelectedClip(null)} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "#1E2440", color: "#6E7282" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Preview */}
            <div className="w-full aspect-[9/16] max-h-64 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, hsl(${selectedClipData.virality * 2.5},40%,12%), #1E2440)` }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 opacity-30" style={{ color: "#6E7282" }}>
                <polygon points="5 3 19 12 5 21"/>
              </svg>
            </div>

            {/* Stats */}
            <div className="flex gap-4 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
              {[
                { l: "Virality", v: selectedClipData.virality, c: scoreColor(selectedClipData.virality) },
                { l: "Hook", v: selectedClipData.hookStr, c: "white" },
                { l: "Duration", v: fmtDur(selectedClipData.duration), c: "white" },
                { l: "Engage", v: `${selectedClipData.engagement}/10`, c: "#A78BFA" },
              ].map(s => (
                <div key={s.l}>
                  <div className="text-[10px]" style={{ color: "#6E7282" }}>{s.l}</div>
                  <div className="text-sm font-bold" style={{ color: s.c }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
              {["captions", "reframe", "broll", "brand", "export"].map(t => (
                <button key={t} onClick={() => setClipTab(t)}
                  className="flex-1 py-2.5 text-center text-[11px] font-semibold transition-all"
                  style={{
                    color: clipTab === t ? "#A78BFA" : "#6E7282",
                    borderBottom: clipTab === t ? "2px solid #7C3AED" : "2px solid transparent",
                  }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4 space-y-4">
              {clipTab === "captions" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9B9EAA" }}>Caption Style</label>
                    <select className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: "#1A1F35", border: "1px solid rgba(255,255,255,.06)" }}>
                      <option>Bold</option><option>Minimal</option><option>Karaoke</option><option>Dynamic</option><option>Subtitles</option><option>Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9B9EAA" }}>Language</label>
                    <select className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: "#1A1F35", border: "1px solid rgba(255,255,255,.06)" }}>
                      <option>English</option><option>Spanish</option><option>French</option><option>Portuguese</option><option>German</option><option>Japanese</option><option>Korean</option><option>Chinese</option><option>Arabic</option><option>Hindi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9B9EAA" }}>Transcript</label>
                    <textarea className="w-full px-3 py-2 rounded-lg text-sm text-white h-24 resize-y" style={{ background: "#1A1F35", border: "1px solid rgba(255,255,255,.06)" }} defaultValue={selectedClipData.transcript} />
                  </div>
                  <button onClick={() => alert("Captions applied!")} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-800">
                    Apply Captions
                  </button>
                </>
              )}
              {clipTab === "reframe" && (
                <>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9B9EAA" }}>Aspect Ratio</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["9:16 (Shorts)", "1:1 (Instagram)", "4:5 (Feed)", "16:9 (YouTube)"].map((r, i) => (
                      <div key={r} className="p-3 rounded-lg text-center cursor-pointer text-xs"
                        style={{ background: i === 0 ? "rgba(124,58,237,.15)" : "#161B33", border: `1px solid ${i === 0 ? "rgba(124,58,237,.25)" : "rgba(255,255,255,.06)"}`, color: i === 0 ? "#A78BFA" : "#9B9EAA" }}>
                        {r}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => alert("Reframe applied!")} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-800 mt-3">
                    Apply Reframe
                  </button>
                </>
              )}
              {clipTab === "broll" && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-5 rounded-full bg-purple-600 relative cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5" />
                    </div>
                    <span className="text-xs" style={{ color: "#9B9EAA" }}>AI B-Roll auto-insert enabled</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9B9EAA" }}>Transition</label>
                    <select className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: "#1A1F35", border: "1px solid rgba(255,255,255,.06)" }}>
                      <option>Cross-dissolve</option><option>Hard cut</option><option>Zoom</option>
                    </select>
                  </div>
                  <button onClick={() => alert("B-Roll saved!")} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-800">
                    Apply B-Roll
                  </button>
                </>
              )}
              {clipTab === "brand" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9B9EAA" }}>Brand Kit</label>
                    <select className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: "#1A1F35", border: "1px solid rgba(255,255,255,.06)" }}>
                      <option>Default</option>
                    </select>
                  </div>
                  <button onClick={() => alert("Brand applied!")} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-800">
                    Apply Brand
                  </button>
                </>
              )}
              {clipTab === "export" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#9B9EAA" }}>Format</label>
                    <select className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: "#1A1F35", border: "1px solid rgba(255,255,255,.06)" }}>
                      <option>MP4 1080p 30fps</option><option>MP4 1080p 60fps</option><option>MP4 4K 60fps</option><option>MOV ProRes</option><option>Premiere XML</option><option>DaVinci XML</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    {["YouTube Shorts", "TikTok", "Instagram Reels", "LinkedIn"].map(p => (
                      <label key={p} className="flex items-center gap-1.5 text-[11px] cursor-pointer" style={{ color: "#9B9EAA" }}>
                        <input type="checkbox" className="accent-purple-600" /> {p.split(" ")[0]}
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Download button */}
            <div className="p-4">
              <button onClick={() => handleDownload(selectedClipData.id, selectedClipData.title)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #059669, #10B981)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download (1 credit)
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 flex z-40" style={{ background: "#101428", borderTop: "1px solid rgba(255,255,255,.06)" }}>
        {sidebarItems.slice(0, 5).map(item => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedClip(null); }}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] transition-all"
            style={{ color: activeTab === item.id ? "#A78BFA" : "#6E7282" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5"><path d={item.icon}/></svg>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}