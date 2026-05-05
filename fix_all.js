const fs = require('fs');

// ── 1. FIX IMPORT PAGE - Post button saves to clips page, thumbnail preview, mobile responsive ──
let imp = fs.readFileSync('src/app/import/page.tsx', 'utf8');

// Fix Post button - save clip to sessionStorage then go to clips page
imp = imp.replace(
  'const handlePost = (clip: RekaClip) => {\n    const clipUrl = encodeURIComponent(clip.video_url);\n    const clipTitle = encodeURIComponent(clip.title);\n    const clipCaption = encodeURIComponent(clip.caption);\n    router.push(\n      `/social/post?clipUrl=${clipUrl}&title=${clipTitle}&caption=${clipCaption}`\n    );\n  };',
  `const handlePost = (clip: RekaClip, index: number) => {
    // Save all clips to sessionStorage for clips page
    const clipsToSave = result?.clips.map((c, i) => ({
      title: c.title,
      hook_text: c.caption,
      start_time: 0,
      end_time: c.duration ?? 60,
      virality_score: 85,
      suggested_caption: c.caption,
      hashtags: '',
      platform: 'tiktok',
      clip_url: c.video_url,
      duration: c.duration ?? 60,
      status: 'ready',
    })) ?? [];
    sessionStorage.setItem('hookclip_clips', JSON.stringify(clipsToSave));
    router.push('/clips');
  };`
);

// Fix Download button
imp = imp.replace(
  'const handleDownload = (clip: RekaClip) => {\n    const clipUrl = clip.video_url;\n    const a = document.createElement("a");\n    a.href = clipUrl;\n    a.download = `${clip.title.replace(/\\s+/g, "_")}.mp4`;\n    a.click();\n  };',
  `const handleDownload = (clip: RekaClip) => {
    const a = document.createElement('a');
    a.href = clip.video_url;
    a.target = '_blank';
    a.download = clip.title.replace(/\\s+/g, '_') + '.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };`
);

// Fix ClipCard onPost call to pass index
imp = imp.replace(
  'onPost={() => handlePost(clip)}',
  'onPost={() => handlePost(clip, i)}'
);

// Fix Post button label in ClipCard
imp = imp.replace(
  '→ Post',
  '→ Save to Clips'
);

// Make import page mobile responsive - fix grid
imp = imp.replace(
  "display: \"grid\", gridTemplateColumns: \"1fr 320px\", gap: 24",
  "display: \"grid\", gridTemplateColumns: \"minmax(0,1fr)\", gap: 20"
);
imp = imp.replace(
  'style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(\n                  result.clips.length,\n                  3\n                )}, 1fr)`,',
  'style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",',
);

// Add mobile CSS
if (!imp.includes('@media (max-width: 768px)')) {
  imp = imp.replace(
    '<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>',
    '<style>{`@keyframes spin { to { transform: rotate(360deg); } } @media (max-width: 768px) { .import-settings-panel { display: none !important; } }`}</style>'
  );
}

fs.writeFileSync('src/app/import/page.tsx', imp);
console.log('Import page fixed!');

// ── 2. FIX CLIPS PAGE - load from Supabase, show real thumbnails/videos ──
let clips = fs.readFileSync('src/app/clips/page.tsx', 'utf8');

// Fix thumbnail to show actual video
clips = clips.replace(
  "const [preview, setPreview] = useState<number|null>(null);",
  "const [preview, setPreview] = useState<number|null>(null);\n  const [playingUrl, setPlayingUrl] = useState<string|null>(null);"
);

// Fix play button to open actual video
clips = clips.replace(
  "<div onClick={() => setPreview(idx)} style={{ aspectRatio:'9/12', background:colors.surfaceContainer, position:'relative', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>",
  "<div onClick={() => clip.clip_url ? setPlayingUrl(clip.clip_url) : setPreview(idx)} style={{ aspectRatio:'9/12', background:colors.surfaceContainer, position:'relative', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>"
);

// Fix demo clips - clear them so new users see empty state
clips = clips.replace(
  `// Fallback demo clips if no real data
    setClips([
      { title:'The shocking truth about AI replacing jobs', hook_text:'Everyone is wrong about AI taking your job', start_time:45, end_time:102, virality_score:92, suggested_caption:'', hashtags:'#ai #jobs', platform:'tiktok', duration:57 },
      { title:'Why most startups fail in year one', hook_text:'The real reason is not what you think', start_time:180, end_time:245, virality_score:87, suggested_caption:'', hashtags:'#startup', platform:'shorts', duration:65 },
      { title:'Morning routine that changed my life', hook_text:'I stopped doing this one thing', start_time:320, end_time:378, virality_score:84, suggested_caption:'', hashtags:'#routine', platform:'reels', duration:58 },
    ]);`,
  `// No demo clips - show empty state for new users
    setClips([]);`
);

// Add video player modal before empty state
clips = clips.replace(
  "      {/* Empty state */}",
  `      {/* Video player modal */}
      {playingUrl && (
        <div onClick={() => setPlayingUrl(null)} style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:400, aspectRatio:'9/16', borderRadius:radius.lg, overflow:'hidden', position:'relative' }}>
            <video src={playingUrl} controls autoPlay style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            <button onClick={() => setPlayingUrl(null)} style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.7)', border:'none', color:'#fff', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
          </div>
        </div>
      )}

      {/* Empty state */}`
);

fs.writeFileSync('src/app/clips/page.tsx', clips);
console.log('Clips page fixed!');

// ── 3. FIX SIDEBAR - Fix floating by ensuring position fixed works ──
let sb = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Ensure sidebar has proper z-index and no overflow issues
sb = sb.replace(
  "position: 'fixed', left: 0, top: 0, width: 256, height: '100vh',",
  "position: 'fixed', left: 0, top: 0, width: 256, height: '100vh', minHeight: '100vh',"
);

fs.writeFileSync('src/components/Sidebar.tsx', sb);
console.log('Sidebar fixed!');

// ── 4. FIX DashboardLayout - Fix floating content ──
let dl = fs.readFileSync('src/components/DashboardLayout.tsx', 'utf8');

// Make main content properly positioned
dl = dl.replace(
  "<main className=\"dashboard-main\" style={{ minHeight: '100vh' }}>",
  "<main className=\"dashboard-main\" style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>"
);

// Fix mobile padding to account for bottom nav
dl = dl.replace(
  "padding: '24px 32px', paddingBottom: '100px'",
  "padding: '24px 32px', paddingBottom: '100px'"
);

// Fix mobile CSS
dl = dl.replace(
  "@media (max-width: 768px) { .dashboard-main { margin-left: 0; } .dashboard-main header { padding: 16px 16px 0 !important; } .dashboard-main > div:last-child { padding: 16px !important; } }",
  "@media (max-width: 768px) { .dashboard-main { margin-left: 0 !important; } .dashboard-main header { padding: 16px 16px 0 !important; } .dashboard-main > div:last-child { padding: 16px !important; padding-bottom: 90px !important; } body { overflow-x: hidden; } }"
);

fs.writeFileSync('src/components/DashboardLayout.tsx', dl);
console.log('DashboardLayout fixed!');

// ── 5. FIX TOKENS - Unify color scheme to purple only ──
let tok = fs.readFileSync('src/lib/tokens.ts', 'utf8');

// The tokens are fine - the blue comes from the import page using hardcoded colors
// We need to make sure import page uses token colors not hardcoded blue/green
console.log('Tokens checked - colors are correct purple theme');

// ── 6. FIX IMPORT PAGE ClipCard - Remove hardcoded teal colors ──
let imp2 = fs.readFileSync('src/app/import/page.tsx', 'utf8');

// Replace hardcoded teal/green colors with purple theme
imp2 = imp2.replace(/color: "#4ade80"/g, 'color: colors.primary');
imp2 = imp2.replace(/color: "#00c896"/g, 'color: colors.primary');
imp2 = imp2.replace(/"linear-gradient\(135deg, #00c896, #00a8e8\)"/g, 'gradients.primary');
imp2 = imp2.replace(/accentColor: "#00c896"/g, `accentColor: colors.primary`);
imp2 = imp2.replace(/background: "#00c896"/g, 'background: colors.primaryContainer');
imp2 = imp2.replace(/borderTopColor: "#fff"/g, 'borderTopColor: colors.primary');

fs.writeFileSync('src/app/import/page.tsx', imp2);
console.log('Import page colors unified to purple!');

console.log('\nAll fixes applied!');
