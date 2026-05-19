import OpenAI from "openai";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { createClient } from "@supabase/supabase-js";
import { createReadStream } from "fs";
import { unlink, mkdir, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

const ffmpegBin = ffmpegStatic as string | null;
if (ffmpegBin) ffmpeg.setFfmpegPath(ffmpegBin);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface DetectedClip {
  title: string;
  caption: string;
  hashtags: string[];
  ai_score: number;
  start_time: number;
  end_time: number;
  duration: number;
  video_url: string;
  thumbnail_url?: string;
}

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

interface VerboseTranscription {
  text: string;
  segments?: TranscriptionSegment[];
}

interface GptClipMoment {
  title: string;
  caption: string;
  hashtags: string[];
  ai_score: number;
  start_time: number;
  end_time: number;
}

function extractAudio(sourceUrl: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(sourceUrl)
      .noVideo()
      .audioFrequency(16000)
      .audioChannels(1)
      .audioCodec("pcm_s16le")
      .format("wav")
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .save(outputPath);
  });
}

function cutClip(
  sourceUrl: string,
  startTime: number,
  duration: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(sourceUrl)
      .inputOptions([`-ss ${startTime}`])
      .duration(duration)
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions(["-preset fast", "-crf 23", "-movflags +faststart"])
      .format("mp4")
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .save(outputPath);
  });
}

export async function detectClips(
  videoUrl: string,
  prompt: string,
  numClips: number,
  minDuration: number,
  maxDuration: number,
  timeRange: { start: number; end: number } | null,
  userId: string,
  jobId: string,
  onStatus: (status: string) => void
): Promise<DetectedClip[]> {
  const tmpDir = join(tmpdir(), `hookclip-${randomUUID()}`);
  await mkdir(tmpDir, { recursive: true });
  const audioPath = join(tmpDir, "audio.wav");

  try {
    // Resolve direct media URLs via ytdl-core (avoids re-fetching per clip)
    onStatus("preprocessing");
    const info = await ytdl.getInfo(videoUrl);

    const audioFormat = ytdl.chooseFormat(info.formats, {
      quality: "lowestaudio",
      filter: "audioonly",
    });

    let videoFormat;
    try {
      videoFormat = ytdl.chooseFormat(info.formats, { quality: "18" });
    } catch {
      videoFormat = ytdl.chooseFormat(info.formats, { quality: "highestvideo" });
    }

    // Download audio for Whisper
    await extractAudio(audioFormat.url, audioPath);

    // Transcribe with Whisper
    onStatus("transcribing");
    const transcription = (await openai.audio.transcriptions.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      file: createReadStream(audioPath) as any,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    })) as unknown as VerboseTranscription;

    await unlink(audioPath).catch(() => {});

    const segments = transcription.segments ?? [];
    const segmentsText =
      segments.length > 0
        ? segments
            .map((s) => `[${s.start.toFixed(1)}s-${s.end.toFixed(1)}s]: ${s.text.trim()}`)
            .join("\n")
        : transcription.text;

    // GPT-4o clip analysis
    onStatus("analyzing");
    const rangeNote = timeRange
      ? `\nOnly consider timestamps between ${timeRange.start}s and ${timeRange.end}s.`
      : "";

    const gptRes = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a viral short-form content expert. Identify the highest-impact moments from a video transcript. Return valid JSON only.",
        },
        {
          role: "user",
          content: `Find the top ${numClips} viral clip moments from this transcript.

Transcript:
${segmentsText}

Instructions: ${prompt}${rangeNote}
Each clip must be ${minDuration}–${maxDuration} seconds long.

Return this exact JSON:
{
  "clips": [
    {
      "title": "Catchy clip title",
      "caption": "Engaging social media caption (2-3 sentences)",
      "hashtags": ["viral", "fyp", "trending"],
      "ai_score": 88,
      "start_time": 12.5,
      "end_time": 47.0
    }
  ]
}`,
        },
      ],
    });

    const parsed = JSON.parse(gptRes.choices[0].message.content ?? "{}") as {
      clips: GptClipMoment[];
    };
    const moments = (parsed.clips ?? []).slice(0, numClips);

    // Cut and upload clips
    onStatus("processing");
    const results: DetectedClip[] = [];

    for (let i = 0; i < moments.length; i++) {
      const m = moments[i];
      const clipDuration = Math.max(
        Math.round(m.end_time - m.start_time),
        minDuration
      );
      const clipPath = join(tmpDir, `clip-${i}.mp4`);

      try {
        await cutClip(videoFormat.url, m.start_time, clipDuration, clipPath);

        const buffer = await readFile(clipPath);
        const storageKey = `clips/${userId}/${jobId}/clip-${i}.mp4`;

        const { error: uploadErr } = await supabase.storage
          .from("clips")
          .upload(storageKey, buffer, { contentType: "video/mp4", upsert: true });

        let clipVideoUrl = "";
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from("clips")
            .getPublicUrl(storageKey);
          clipVideoUrl = urlData.publicUrl;
        }

        results.push({
          title: m.title,
          caption: m.caption,
          hashtags: m.hashtags ?? [],
          ai_score: m.ai_score ?? 80,
          start_time: m.start_time,
          end_time: m.end_time,
          duration: clipDuration,
          video_url: clipVideoUrl,
        });

        await unlink(clipPath).catch(() => {});
      } catch (err) {
        console.error(`[detectClips] clip ${i} failed:`, err);
        results.push({
          title: m.title,
          caption: m.caption,
          hashtags: m.hashtags ?? [],
          ai_score: m.ai_score ?? 80,
          start_time: m.start_time,
          end_time: m.end_time,
          duration: clipDuration,
          video_url: "",
        });
      }
    }

    return results;
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
