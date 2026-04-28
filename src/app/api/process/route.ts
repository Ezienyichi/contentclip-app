import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REKA_API_KEY = process.env.REKA_API_KEY!;
const REKA_BASE = "https://vision-agent.api.reka.ai/v1/creator/reels";

export interface RekaClip {
  video_url: string;
  title: string;
  caption: string;
  duration?: number;
  thumbnail_url?: string;
}

export interface ProcessRequest {
  videoUrl: string;
  userId: string;
  prompt?: string;
  numClips?: number;
  minDuration?: number;
  maxDuration?: number;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  subtitles?: boolean;
  timeRange?: { start: number; end: number } | null;
  template?: "moments" | "highlights" | "tutorial" | "promo";
}

// Submit job to Reka
async function submitRekaJob(params: ProcessRequest): Promise<string> {
  const {
    videoUrl,
    prompt = "Find the most engaging hook-worthy moments with high energy and emotional impact. Prioritize viral-worthy clips.",
    numClips = 3,
    minDuration = 15,
    maxDuration = 60,
    aspectRatio = "9:16",
    subtitles = true,
    template = "moments",
    timeRange,
  } = params;

  const body: Record<string, unknown> = {
    video_urls: [videoUrl],
    prompt,
    generation_config: {
      template,
      num_generations: numClips,
      min_duration_seconds: minDuration,
      max_duration_seconds: maxDuration,
      ...(timeRange
        ? {
            source_start_time: timeRange.start,
            source_end_time: timeRange.end,
          }
        : {}),
    },
    rendering_config: {
      subtitles,
      aspect_ratio: aspectRatio,
    },
  };

  const response = await fetch(REKA_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": REKA_API_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Reka submit error ${response.status}: ${JSON.stringify(data)}`
    );
  }

  if (!data.id) {
    throw new Error("Reka did not return a job ID");
  }

  return data.id as string;
}

// Poll Reka until completed or failed
async function pollRekaJob(jobId: string): Promise<RekaClip[]> {
  const maxAttempts = 40; // 40 x 15s = 10 minutes max
  const intervalMs = 15000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, attempt === 0 ? 5000 : intervalMs));

    const res = await fetch(`${REKA_BASE}/${jobId}`, {
      headers: { "X-Api-Key": REKA_API_KEY },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`Reka poll error ${res.status}: ${JSON.stringify(data)}`);
    }

    const status = data.status as string;

    if (status === "failed") {
      throw new Error(
        `Reka job failed: ${data.error_message ?? "unknown error"}`
      );
    }

    if (status === "completed") {
      // Extract clips from output
      const output = data.output ?? {};
      const rawClips =
        output.clips ??
        output.reels ??
        output.results ??
        (Array.isArray(output) ? output : []);

      const clips: RekaClip[] = rawClips.map(
        (clip: Record<string, unknown>, index: number) => ({
          video_url: (clip.video_url ?? clip.url ?? clip.signed_s3_video_url ?? clip.signed_s3_video_url ?? clip.download_url ?? "") as string,
          title: (clip.title ?? clip.name ?? `Clip ${index + 1}`) as string,
          caption: (clip.caption ?? clip.description ?? "") as string,
          duration: clip.duration as number | undefined,
          thumbnail_url: (clip.thumbnail_url ?? clip.thumbnail ?? "") as string,
        })
      );

      return clips;
    }

    // Still queued or processing — continue polling
    console.log(`[Reka] Job ${jobId} status: ${status} (attempt ${attempt + 1})`);
  }

  throw new Error("Reka job timed out after 10 minutes");
}

async function saveJobToSupabase(
  userId: string,
  videoUrl: string,
  params: ProcessRequest,
  clips: RekaClip[],
  rekaJobId: string
) {
  const { data: job, error: jobError } = await supabase
    .from("clip_jobs")
    .insert({
      user_id: userId,
      source_url: videoUrl,
      status: "completed",
      prompt: params.prompt,
      num_clips: clips.length,
      aspect_ratio: params.aspectRatio ?? "9:16",
      subtitles: params.subtitles ?? true,
      reka_job_id: rekaJobId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (jobError) throw new Error(`Supabase job insert: ${jobError.message}`);

  const clipInserts = clips.map((clip, index) => ({
    job_id: job.id,
    user_id: userId,
    clip_index: index,
    video_url: clip.video_url,
    title: clip.title,
    caption: clip.caption,
    duration: clip.duration ?? null,
    thumbnail_url: clip.thumbnail_url ?? null,
    status: "ready",
    created_at: new Date().toISOString(),
  }));

  const { error: clipsError } = await supabase
    .from("clips")
    .insert(clipInserts);

  if (clipsError) throw new Error(`Supabase clips insert: ${clipsError.message}`);

  return job;
}

export async function POST(req: NextRequest) {
  try {
    const body: ProcessRequest = await req.json();
    const { videoUrl, userId } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!REKA_API_KEY) {
      return NextResponse.json(
        { error: "REKA_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits, plan")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const creditCost = (body.numClips ?? 3) * 10;
    if (profile.credits < creditCost) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: creditCost,
          available: profile.credits,
          upgradeUrl: "/pricing",
        },
        { status: 402 }
      );
    }

    // Deduct credits
    await supabase
      .from("profiles")
      .update({ credits: profile.credits - creditCost })
      .eq("id", userId);

    // Submit Reka job
    let rekaJobId: string;
    try {
      rekaJobId = await submitRekaJob(body);
    } catch (err) {
      // Refund credits if submit failed
      await supabase
        .from("profiles")
        .update({ credits: profile.credits })
        .eq("id", userId);
      throw err;
    }

    // Poll until done
    let clips: RekaClip[];
    try {
      clips = await pollRekaJob(rekaJobId);
    } catch (err) {
      // Refund credits if processing failed
      await supabase
        .from("profiles")
        .update({ credits: profile.credits })
        .eq("id", userId);
      throw err;
    }

    if (!clips || clips.length === 0) {
      await supabase
        .from("profiles")
        .update({ credits: profile.credits })
        .eq("id", userId);
      return NextResponse.json(
        { error: "Reka completed but returned no clips for this video" },
        { status: 422 }
      );
    }

    // Save to Supabase
    const job = await saveJobToSupabase(userId, videoUrl, body, clips, rekaJobId);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      clips,
      creditsUsed: creditCost,
      creditsRemaining: profile.credits - creditCost,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/process] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: fetch previously generated clips
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  const userId = searchParams.get("userId");

  if (!jobId || !userId) {
    return NextResponse.json(
      { error: "jobId and userId are required" },
      { status: 400 }
    );
  }

  const { data: job, error: jobError } = await supabase
    .from("clip_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const { data: clips } = await supabase
    .from("clips")
    .select("*")
    .eq("job_id", jobId)
    .order("clip_index");

  return NextResponse.json({ job, clips: clips ?? [] });
}
