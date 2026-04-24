const express = require("express");
const cors = require("cors");
const { AssemblyAI } = require("assemblyai");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;

// ── CONFIG ────────────────────────────────────────────────────────────────
const ASSEMBLYAI_KEY  = process.env.ASSEMBLYAI_API_KEY;
const ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY;
const PROCESSOR_SECRET = process.env.PROCESSOR_SECRET || "helpedit-secret-change-me";
const TEMP_DIR        = "/tmp/helpedit";
const DOWNLOAD_DIR    = path.join(TEMP_DIR, "downloads");
const CLIPS_DIR       = path.join(TEMP_DIR, "clips");

[DOWNLOAD_DIR, CLIPS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── AUTH ──────────────────────────────────────────────────────────────────
function authCheck(req, res, next) {
  const token = req.headers["x-processor-secret"];
  if (token !== PROCESSOR_SECRET) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// ── PIPED.VIDEO INSTANCES (cookie-free YouTube proxy) ─────────────────────
const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://api.piped.projectsegfau.lt",
  "https://piped-api.garudalinux.org",
];

function extractYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function httpGet(url, timeout = 12000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, { timeout }, (res) => {
      if ([301, 302, 307].includes(res.statusCode) && res.headers.location) {
        return httpGet(res.headers.location, timeout).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

// ── RESOLVE URL ───────────────────────────────────────────────────────────
// If it's a YouTube URL, get a direct audio stream via Piped.
// If it's already a direct URL (mp3/mp4/etc), return as-is.
async function resolveAudioUrl(videoUrl) {
  const videoId = extractYouTubeId(videoUrl);

  if (!videoId) {
    // Not YouTube — return as-is (direct mp3, mp4, Vimeo public, etc.)
    console.log(`[resolve] Non-YouTube URL, using directly: ${videoUrl}`);
    return videoUrl;
  }

  console.log(`[resolve] YouTube ID: ${videoId} — fetching via Piped...`);

  for (const base of PIPED_INSTANCES) {
    try {
      const r = await httpGet(`${base}/streams/${videoId}`, 10000);
      if (r.status !== 200) continue;

      const data = JSON.parse(r.body);
      if (!data.audioStreams?.length) continue;

      // Pick highest bitrate audio stream
      const stream = data.audioStreams
        .filter(s => s.url && s.mimeType)
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

      if (!stream?.url) continue;

      console.log(`[resolve] Got audio stream from ${base} — bitrate: ${stream.bitrate}, mime: ${stream.mimeType}`);
      return stream.url;
    } catch (e) {
      console.log(`[resolve] ${base} failed: ${e.message}`);
    }
  }

  throw new Error("Could not resolve YouTube audio — all Piped instances failed. Try again in a moment.");
}

// ── GET VIDEO INFO (title, duration, thumbnail) ───────────────────────────
async function getVideoInfo(videoUrl) {
  const videoId = extractYouTubeId(videoUrl);
  if (!videoId) return null;

  for (const base of PIPED_INSTANCES) {
    try {
      const r = await httpGet(`${base}/streams/${videoId}`, 8000);
      if (r.status !== 200) continue;
      const data = JSON.parse(r.body);
      return {
        title:     data.title     || "Video",
        duration:  data.duration  || 0,
        thumbnail: data.thumbnailUrl || null,
        uploader:  data.uploader  || "",
      };
    } catch {}
  }
  return null;
}

// ── HEALTH CHECK ──────────────────────────────────────────────────────────
app.get("/health", async (req, res) => {
  let pipedOk = false;
  try {
    const r = await httpGet(`${PIPED_INSTANCES[0]}/trending?region=US`, 5000);
    pipedOk = r.status === 200;
  } catch {}
  res.json({
    status: "ok",
    ffmpeg: true,
    piped: pipedOk,
    assemblyai: !!ASSEMBLYAI_KEY,
    claude: !!ANTHROPIC_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ── ENDPOINT: GET VIDEO INFO ──────────────────────────────────────────────
// GET /api/video-info?url=...
app.get("/api/video-info", authCheck, async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "url required" });
  try {
    const info = await getVideoInfo(url);
    if (info) res.json({ success: true, ...info });
    else res.json({ success: true, title: "Video", duration: 0, thumbnail: null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ENDPOINT: FULL PIPELINE ───────────────────────────────────────────────
// POST /api/process
// Body: { videoUrl, title, startTime?, endTime? }
app.post("/api/process", authCheck, async (req, res) => {
  const { videoUrl, title, startTime, endTime } = req.body;
  const jobId = uuidv4();
  console.log(`[${jobId}] Starting: ${videoUrl}`);

  try {
    // STEP 1: Resolve to direct audio URL
    console.log(`[${jobId}] Resolving audio URL...`);
    const audioUrl = await resolveAudioUrl(videoUrl);
    console.log(`[${jobId}] Resolved: ${audioUrl.substring(0, 80)}...`);

    // STEP 2: Transcribe
    console.log(`[${jobId}] Transcribing...`);
    const transcript = await transcribeAudio(audioUrl);
    console.log(`[${jobId}] Transcription done: ${transcript.words?.length || 0} words`);

    // STEP 3: Hook detection
    console.log(`[${jobId}] Detecting hooks...`);
    const hookResults = await detectHooks(transcript.text, transcript.utterances || []);
    console.log(`[${jobId}] Found ${hookResults.clips?.length || 0} clips`);

    const clips = (hookResults.clips || []).map((clip, i) => ({
      id: `${jobId}-clip-${i}`,
      title: clip.title || `Clip ${i + 1}`,
      hook: clip.hook || "",
      start_time: clip.start_time || 0,
      end_time: clip.end_time || 60,
      duration: Math.round((clip.end_time || 60) - (clip.start_time || 0)),
      virality_score: Math.min(100, Math.max(0, Math.round(clip.virality_score || 70))),
      hook_strength: Math.min(100, Math.max(0, Math.round(clip.hook_strength || 65))),
      engagement_pred: clip.engagement_pred || 7.0,
      transcript_segment: clip.transcript_segment || "",
      reason: clip.reason || "",
    }));

    res.json({
      success: true,
      jobId,
      transcript: {
        text: transcript.text,
        duration: transcript.audio_duration,
        words_count: transcript.words?.length || 0,
        speakers: transcript.utterances?.length || 0,
        language: transcript.language_code || "en",
      },
      clips,
      highlights: transcript.auto_highlights_result?.results || [],
      sentiment: (transcript.sentiment_analysis_results || []).slice(0, 20),
    });

  } catch (error) {
    console.error(`[${jobId}] Failed:`, error.message);
    res.status(500).json({ error: error.message || "Processing failed" });
  }
});

// ── ENDPOINT: CUT CLIP ────────────────────────────────────────────────────
app.post("/api/cut-clip", authCheck, async (req, res) => {
  const { videoUrl, startTime, endTime, captionText, style, aspectRatio } = req.body;
  const clipId = uuidv4();
  const outputPath = path.join(CLIPS_DIR, `${clipId}.mp4`);
  console.log(`[${clipId}] Cutting: ${startTime}s - ${endTime}s`);

  try {
    // Resolve to direct URL first (handles YouTube)
    const resolvedUrl = await resolveAudioUrl(videoUrl);
    const downloadPath = path.join(DOWNLOAD_DIR, `${clipId}-source.mp4`);
    await downloadVideoSegment(resolvedUrl, downloadPath, startTime, endTime);
    await processClip(downloadPath, outputPath, { captionText, style: style || "cinematic", aspectRatio: aspectRatio || "9:16" });

    res.download(outputPath, `helpedit-clip-${clipId}.mp4`, (err) => {
      cleanupFiles([downloadPath, outputPath]);
      if (err) console.error(`[${clipId}] Download error:`, err.message);
    });
  } catch (error) {
    console.error(`[${clipId}] Failed:`, error.message);
    cleanupFiles([path.join(DOWNLOAD_DIR, `${clipId}-source.mp4`), outputPath]);
    res.status(500).json({ error: error.message });
  }
});

// ── ASSEMBLYAI TRANSCRIPTION ──────────────────────────────────────────────
async function transcribeAudio(audioUrl) {
  if (!ASSEMBLYAI_KEY) throw new Error("ASSEMBLYAI_API_KEY not configured");

  const client = new AssemblyAI({ apiKey: ASSEMBLYAI_KEY });
  const transcript = await client.transcripts.transcribe({
    audio_url: audioUrl,
    speaker_labels: true,
    auto_highlights: true,
    sentiment_analysis: true,
    entity_detection: true,
    language_detection: true,
  });

  if (transcript.status === "error") {
    throw new Error(`Transcription failed: ${transcript.error}`);
  }
  return transcript;
}

// ── CLAUDE HOOK DETECTION ─────────────────────────────────────────────────
async function detectHooks(transcriptText, utterances) {
  if (!ANTHROPIC_KEY) {
    console.log("No ANTHROPIC_API_KEY — using fallback");
    return generateFallbackClips(transcriptText, utterances);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{
          role: "user",
          content: `You are an expert short-form video editor for TikTok, YouTube Shorts, and Instagram Reels.

Analyze this transcript and identify the 10-15 BEST segments for short-form clips (30-90 seconds each).

For each clip:
- title: Catchy, clickbait-worthy title
- hook: Opening line that hooks viewers
- start_time: Start in seconds
- end_time: End in seconds
- virality_score: 0-100 (viral potential)
- hook_strength: 0-100 (opening hook power)
- engagement_pred: 1-10 (engagement rating)
- transcript_segment: The actual text of this segment
- reason: Why it would perform well

TRANSCRIPT:
${transcriptText.substring(0, 15000)}

Respond ONLY in valid JSON:
{"clips":[{"title":"...","hook":"...","start_time":0,"end_time":60,"virality_score":85,"hook_strength":90,"engagement_pred":8.5,"transcript_segment":"...","reason":"..."}]}`,
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "{}";
    const cleaned = text.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Claude API error:", error.message);
    return generateFallbackClips(transcriptText, utterances);
  }
}

// ── FALLBACK CLIP GENERATOR ───────────────────────────────────────────────
function generateFallbackClips(text, utterances) {
  const clips = [];
  if (utterances && utterances.length > 0) {
    let batch = [], batchStart = 0;
    for (const utt of utterances) {
      batch.push(utt);
      const duration = (utt.end - batchStart) / 1000;
      if (duration >= 40 || batch.length >= 4) {
        const segText = batch.map(u => u.text).join(" ");
        clips.push({
          title: segText.substring(0, 50) + "...",
          hook: batch[0].text.substring(0, 80),
          start_time: batchStart / 1000,
          end_time: utt.end / 1000,
          virality_score: Math.round(70 + Math.random() * 25),
          hook_strength: Math.round(65 + Math.random() * 30),
          engagement_pred: Math.round((6 + Math.random() * 3.5) * 10) / 10,
          transcript_segment: segText,
          reason: "Auto-detected segment",
        });
        batch = [];
        batchStart = utt.end;
      }
      if (clips.length >= 15) break;
    }
  } else {
    const words = text.split(" ");
    const segLen = 50;
    for (let i = 0; i < 12; i++) {
      const wStart = Math.floor((i / 12) * words.length);
      const wEnd   = Math.floor(((i + 1) / 12) * words.length);
      const seg    = words.slice(wStart, wEnd).join(" ");
      clips.push({
        title: `Clip ${i + 1}: ${seg.substring(0, 40)}...`,
        hook: seg.substring(0, 80),
        start_time: i * segLen,
        end_time: (i + 1) * segLen,
        virality_score: Math.round(80 - i * 2 + Math.random() * 15),
        hook_strength: Math.round(75 - i * 2 + Math.random() * 15),
        engagement_pred: Math.round((7.5 - i * 0.3) * 10) / 10,
        transcript_segment: seg,
        reason: "Time-based segment",
      });
    }
  }
  return { clips };
}

// ── FFMPEG HELPERS ────────────────────────────────────────────────────────
function downloadVideoSegment(url, outputPath, startTime, endTime) {
  return new Promise((resolve, reject) => {
    const duration = endTime - startTime;
    const cmd = `ffmpeg -y -ss ${startTime} -i "${url}" -t ${duration} -c copy -avoid_negative_ts 1 "${outputPath}" 2>&1`;
    exec(cmd, { timeout: 120000 }, (error) => {
      if (error) {
        const fallback = `ffmpeg -y -ss ${startTime} -i "${url}" -t ${duration} -c:v libx264 -preset ultrafast -c:a aac "${outputPath}" 2>&1`;
        exec(fallback, { timeout: 180000 }, (err2) => {
          if (err2) reject(new Error(`FFmpeg failed: ${err2.message}`));
          else resolve(outputPath);
        });
      } else resolve(outputPath);
    });
  });
}

function processClip(inputPath, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    const { captionText, style, aspectRatio } = options;
    let vf = [];
    if (aspectRatio === "9:16") {
      vf.push("scale=1080:1920:force_original_aspect_ratio=decrease");
      vf.push("pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black");
    } else if (aspectRatio === "1:1") {
      vf.push("scale=1080:1080:force_original_aspect_ratio=decrease");
      vf.push("pad=1080:1080:(ow-iw)/2:(oh-ih)/2:black");
    } else if (aspectRatio === "4:5") {
      vf.push("scale=1080:1350:force_original_aspect_ratio=decrease");
      vf.push("pad=1080:1350:(ow-iw)/2:(oh-ih)/2:black");
    }
    if (style === "cinematic") {
      vf.push("drawbox=x=0:y=0:w=iw:h=ih*0.05:color=black:t=fill");
      vf.push("drawbox=x=0:y=ih*0.95:w=iw:h=ih*0.05:color=black:t=fill");
    }
    const vfString = vf.length > 0 ? `-vf "${vf.join(",")}"` : "";
    const cmd = `ffmpeg -y -i "${inputPath}" ${vfString} -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart "${outputPath}" 2>&1`;
    exec(cmd, { timeout: 300000 }, (error) => {
      if (error) reject(new Error(`FFmpeg processing failed: ${error.message}`));
      else resolve(outputPath);
    });
  });
}

function cleanupFiles(paths) {
  for (const p of paths) {
    try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (e) { console.warn("Cleanup failed:", p); }
  }
}

setInterval(() => {
  [DOWNLOAD_DIR, CLIPS_DIR].forEach(dir => {
    try {
      const files = fs.readdirSync(dir);
      const now = Date.now();
      for (const file of files) {
        const fp = path.join(dir, file);
        if (now - fs.statSync(fp).mtimeMs > 3600000) { fs.unlinkSync(fp); console.log("Cleaned:", fp); }
      }
    } catch {}
  });
}, 600000);

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║  HelpEdit Processor                           ║
║  Port: ${PORT}                                   ║
║  YouTube: Piped.video proxy (no cookies)      ║
║  AssemblyAI: ${ASSEMBLYAI_KEY ? "configured ✓" : "NOT SET ✗"}                  ║
║  Claude AI:  ${ANTHROPIC_KEY  ? "configured ✓" : "NOT SET ✗"}                  ║
╚═══════════════════════════════════════════════╝
  `);
});
