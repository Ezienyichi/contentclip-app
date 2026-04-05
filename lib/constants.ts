import type { PlanInfo } from "@/types";

export const PLANS: PlanInfo[] = [
  { id: "free", name: "Free", credits: "30 daily", price: 0, priceYearly: 0, popular: false, features: ["30 credits/day (~5 videos)", "AI virality scoring", "720p export", "Watermarked output", "2 credits to remove watermark", "Basic captions", "Community support"] },
  { id: "starter", name: "Starter", credits: 100, price: 9, priceYearly: 86, popular: false, features: ["100 credits/month", "AI hook detection", "1080p export", "No watermark", "3 editing styles", "Email support", "1 brand kit"] },
  { id: "creator", name: "Creator", credits: 300, price: 19, priceYearly: 182, popular: true, features: ["300 credits/month", "All 6 AI editing styles", "1080p 60fps export", "B-Roll insertion", "Filler word removal", "All transitions", "3 brand kits", "Priority support"] },
  { id: "business", name: "Business", credits: 1000, price: 49, priceYearly: 470, popular: false, features: ["1,000 credits/month", "4K 60fps export", "Voice cloning", "20+ languages", "Premiere/DaVinci XML", "5 team seats", "Unlimited brand kits", "Dedicated manager", "API access", "SLA guarantee"] },
];

export const AI_STYLES = [
  { id: "cinematic", name: "Cinematic", desc: "Dramatic pacing, cinematic bars, film grain overlay, slow transitions for impactful storytelling.", color: "#8B5CF6", emoji: "\u{1F3AC}" },
  { id: "energetic", name: "Energetic", desc: "Fast cuts, zoom effects, screen shake, bold text \u2014 built for high-energy content that stops the scroll.", color: "#EF4444", emoji: "\u26A1" },
  { id: "minimal", name: "Minimal Clean", desc: "Whitespace-forward, soft typography, gentle fades. Ideal for education, wellness, and professional content.", color: "#6B7280", emoji: "\u2728" },
  { id: "podcast", name: "Podcast Pro", desc: "Waveform visualizer, speaker tracking, side-by-side layout. Optimized for audio-first content.", color: "#F59E0B", emoji: "\u{1F399}" },
  { id: "social", name: "Social Native", desc: "Platform-native feel with trending overlays, reaction stickers, and engagement-optimized pacing.", color: "#EC4899", emoji: "\u{1F4F1}" },
  { id: "corporate", name: "Corporate", desc: "Clean transitions, lower-thirds, branded templates. Meeting compliance and executive presentation ready.", color: "#3B82F6", emoji: "\u{1F3E2}" },
];

export const INDUSTRIES = [
  { name: "Content Creators", desc: "Turn one long video into a month of short-form content. AI finds your best hooks and viral moments automatically.", icon: "\u{1F3AC}" },
  { name: "Media & Entertainment", desc: "Repurpose interviews, behind-the-scenes footage, and press clips into platform-optimized content at scale.", icon: "\u{1F4FA}" },
  { name: "Marketing Teams", desc: "Generate campaign assets from webinars, product demos, and brand videos. A/B test hooks with AI virality scoring.", icon: "\u{1F4CA}" },
  { name: "Podcasters", desc: "Every episode becomes 15-30 clips. AI detects quotable moments, adds waveform captions, and tracks speakers.", icon: "\u{1F399}" },
  { name: "Agencies & Studios", desc: "White-label clip production for clients. Brand kits, team seats, and batch processing for high-volume delivery.", icon: "\u{1F3E2}" },
  { name: "Livestreamers", desc: "AI monitors your stream VODs for highlight moments, rage clips, and clutch plays. Auto-clip while you sleep.", icon: "\u{1F3AE}" },
  { name: "Advertisers", desc: "Transform long-form ad creative into 15/30/60-second cuts optimized for each platform and placement.", icon: "\u{1F4E2}" },
  { name: "Churches & Ministries", desc: "Clip sermons, worship moments, and testimonials into shareable devotionals. Reach your community beyond Sunday.", icon: "\u26EA" },
  { name: "E-Commerce Brands", desc: "Turn product demos and unboxings into shoppable shorts. AI highlights product features and adds CTAs automatically.", icon: "\u{1F6D2}" },
  { name: "Real Estate Agents", desc: "Convert property walkthroughs into platform-ready tours. AI highlights key rooms and adds listing details as overlays.", icon: "\u{1F3E0}" },
];

export const EXPORT_FORMATS = [
  { name: "MP4", desc: "Universal format. Best for social media.", ext: ".mp4" },
  { name: "MOV", desc: "Apple ecosystem. ProRes quality.", ext: ".mov" },
  { name: "WebM", desc: "Web-optimized. Smaller files.", ext: ".webm" },
  { name: "GIF", desc: "Animated previews and memes.", ext: ".gif" },
  { name: "Premiere XML", desc: "Adobe Premiere Pro project file.", ext: ".xml" },
  { name: "DaVinci XML", desc: "DaVinci Resolve project file.", ext: ".xml" },
  { name: "SRT Subtitles", desc: "Standard subtitle format.", ext: ".srt" },
  { name: "VTT Subtitles", desc: "Web Video Text Tracks.", ext: ".vtt" },
];

export const TUTORIALS = [
  { title: "Getting Started with HelpEdit", desc: "Upload your first video and generate AI clips in under 5 minutes.", dur: "4:32", gradient: "from-purple-600 to-purple-400" },
  { title: "Mastering AI Editing Styles", desc: "Learn when to use Cinematic vs Energetic vs Social Native for maximum engagement.", dur: "7:15", gradient: "from-pink-500 to-pink-400" },
  { title: "Setting Up Your Brand Kit", desc: "Save your logo, colors, and intro/outro for one-click branding on every clip.", dur: "5:48", gradient: "from-amber-500 to-amber-400" },
  { title: "Multi-Platform Publishing", desc: "Schedule and auto-publish to YouTube Shorts, TikTok, Instagram Reels, and LinkedIn.", dur: "6:22", gradient: "from-emerald-500 to-emerald-400" },
  { title: "Understanding Virality Scores", desc: "How our AI predicts engagement and ranks your clips for maximum reach.", dur: "8:05", gradient: "from-blue-500 to-blue-400" },
  { title: "Pro Export Workflows", desc: "Export Premiere XML, DaVinci XML, SRT subtitles, and 4K 60fps files.", dur: "5:10", gradient: "from-red-500 to-red-400" },
];

export const DEMO_CLIPS = [
  { id: "c1", title: "The AI Revolution Nobody Talks About", hook: "Everyone is focused on ChatGPT, but the real AI revolution is happening in video...", duration: 47, virality_score: 94, hook_strength: 92, engagement_pred: 8.7, transcript: "Everyone is focused on ChatGPT, but the real AI revolution is happening in video production. Let me show you why creators who adopt AI editing tools are seeing 300% more engagement..." },
  { id: "c2", title: "Why Your Videos Get Zero Views", hook: "I analyzed 10,000 short-form videos and found the #1 reason most creators fail...", duration: 58, virality_score: 91, hook_strength: 89, engagement_pred: 7.9, transcript: "I analyzed 10,000 short-form videos and found the #1 reason most creators fail. It has nothing to do with content quality..." },
  { id: "c3", title: "The Hook Formula That Went Viral", hook: "This 3-word hook formula generated 2.3 million views in 48 hours...", duration: 34, virality_score: 89, hook_strength: 95, engagement_pred: 9.2, transcript: "This 3-word hook formula generated 2.3 million views in 48 hours. And the crazy part? Anyone can use it..." },
  { id: "c4", title: "Stop Editing Videos Like It's 2020", hook: "If you're still manually cutting your content, you're wasting 40 hours a month...", duration: 62, virality_score: 87, hook_strength: 84, engagement_pred: 7.4, transcript: "If you're still manually cutting your long-form content, you're wasting 40 hours a month..." },
  { id: "c5", title: "I Made 30 Clips From One Podcast", hook: "One 45-minute podcast episode just became my entire month of content...", duration: 41, virality_score: 86, hook_strength: 88, engagement_pred: 8.1, transcript: "One 45-minute podcast episode just became my entire month of content..." },
  { id: "c6", title: "The Caption Style Getting 3x Engagement", hook: "After testing 12 caption styles, one style dominated...", duration: 39, virality_score: 84, hook_strength: 82, engagement_pred: 7.6, transcript: "After testing 12 caption styles across 500 videos, one style dominated..." },
  { id: "c7", title: "Auto-Reframing: The Vertical Video Secret", hook: "The difference between a viral clip and a forgettable one is the framing...", duration: 52, virality_score: 82, hook_strength: 79, engagement_pred: 7.1, transcript: "The difference between a viral clip and a forgettable one is often just the framing..." },
  { id: "c8", title: "B-Roll That Makes Videos Premium", hook: "Professional creators spend $500+ on B-Roll. AI does it free...", duration: 44, virality_score: 80, hook_strength: 81, engagement_pred: 7.3, transcript: "Professional creators spend $500+ on B-Roll footage. AI inserts it automatically..." },
  { id: "c9", title: "Delete Your Filler Words Automatically", hook: "Every um and uh kills watch time. AI removes them instantly...", duration: 31, virality_score: 78, hook_strength: 77, engagement_pred: 6.9, transcript: "Filler words kill watch time. AI detects and removes them with seamless crossfades..." },
  { id: "c10", title: "Brand Kit: One Click Professional Look", hook: "Agencies charge $200 to brand-kit a video. AI does it in 3 seconds...", duration: 36, virality_score: 76, hook_strength: 74, engagement_pred: 6.7, transcript: "It takes agencies hours to brand-kit a video. With AI, 3 seconds..." },
  { id: "c11", title: "Voice Cloning for Global Reach", hook: "Your voice, in 20 languages. AI voice cloning changes everything...", duration: 55, virality_score: 74, hook_strength: 76, engagement_pred: 7.0, transcript: "Your voice, in 20 languages. AI voice cloning is changing how creators reach global audiences..." },
  { id: "c12", title: "The 60fps Export Advantage", hook: "99% of creators export at 30fps. Here's why 60fps doubles quality...", duration: 28, virality_score: 71, hook_strength: 68, engagement_pred: 6.2, transcript: "99% of creators export at 30fps. Here's why switching to 60fps doubles perceived quality..." },
];

export const TESTIMONIALS = [
  { name: "Sarah Chen", role: "Podcast Host \u00B7 340K subs", text: "HelpEdit turned my weekly podcast into a content machine. One episode gives me 25+ clips. My TikTok grew from 2K to 180K in 3 months.", metric: "+8900%", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
  { name: "Marcus Johnson", role: "YouTube Creator \u00B7 1.2M subs", text: "The AI virality scoring is scary accurate. I only post clips scored 85+ and my average views went from 50K to 400K per Short.", metric: "8x views", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
  { name: "Emma Rodriguez", role: "Agency Owner \u00B7 23 clients", text: "We replaced 3 full-time editors with HelpEdit Business plan. Saved \u00A3180K in the first year. The team seats feature is a game changer.", metric: "\u00A3180K saved", avatar: "https://randomuser.me/api/portraits/women/68.jpg" },
];

export const CASE_STUDIES = [
  { name: "Alex Kim", type: "Podcaster", before: "4 clips/week, manual editing", after: "28 clips/week, AI automated", growth: "+600%", time: "40hrs\u219220min", img: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=220&fit=crop" },
  { name: "Studio Bloom", type: "Creative Agency", before: "\u00A312K/mo editor costs", after: "\u00A349/mo Business plan", growth: "-99.6% cost", time: "3 days\u21925 min", img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=220&fit=crop" },
  { name: "Jay Patel", type: "YouTube Educator", before: "12K subs, 2 Shorts/week", after: "340K subs, 5 Shorts/day", growth: "+2700%", time: "6hrs\u219215min", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=220&fit=crop" },
];
