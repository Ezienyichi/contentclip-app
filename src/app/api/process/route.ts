import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REKA_API_KEY = process.env.REKA_API_KEY!;
const REKA_REELS_ENDPOINT = "https://vision-agent.api.reka.ai/v1/creator/reels";
export interface RekaClip {
  video_url: string;
  title: string;
  caption: string;
  duration?: number;
  thumbnail_url?: string;
}

export interface RekaResponse {
  clips: RekaClip[];
  job_id?: string;
  status?: string;
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

async function callRekaAPI(params: ProcessRequest): Promise<RekaResponse> {
  const {
    videoUrl,
    prompt = "Find the most engaging, hook-worthy moments with high energy and emotional impact. Prioritize viral-worthy clips.",
    numClips = 3,
    minDuration = 15,
    maxDuration = 60,
    aspectRatio = "9:16",
    subtitles = true,
    template = "moments",
  } = params;

  const body: Record<string, unknown> = {
    video_urls: [videoUrl],
    prompt,
    generation_config: {
      template,
      num_generations: numClips,
      min_duration_seconds: minDuration,
      max_duration_seconds: maxDuration,
    },
    rendering_config: {
      subtitles,
      aspect_ratio: aspectRatio,
    },
  };

  const response = await fetch(REKA_REELS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": REKA_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Reka API error ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  // Normalise Reka response → internal RekaResponse shape
  const clips: RekaClip[] = (data.clips ?? data.reels ?? data.results ?? []).map(
    (clip: Record<string, unknown>) => ({
      video_url: (clip.video_url ?? clip.url ?? "") as string,
      title: (clip.title ?? clip.name ?? "Untitled Clip") as string,
      caption: (clip.caption ?? clip.description ?? "") as string,
      duration: clip.duration as number | undefined,
      thumbnail_url: clip.thumbnail_url as string | undefined,
    })
  );

  return { clips, job_id: data.job_id, status: data.status ?? "completed" };
}

async function saveJobToSupabase(
  userId: string,
  videoUrl: string,
  params: ProcessRequest,
  result: RekaResponse
) {
  const { data: job, error: jobError } = await supabase
    .from("clip_jobs")
    .insert({
      user_id: userId,
      source_url: videoUrl,
      status: "completed",
      prompt: params.prompt,
      num_clips: params.numClips ?? 3,
      aspect_ratio: params.aspectRatio ?? "9:16",
      subtitles: params.subtitles ?? true,
      reka_job_id: result.job_id ?? null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (jobError) throw new Error(`Supabase job insert: ${jobError.message}`);

  const clipInserts = result.clips.map((clip, index) => ({
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

  const { error: clipsError } = await supabase.from("clips").insert(clipInserts);
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
        { error: "REKA_API_KEY is not configured on this server" },
        { status: 500 }
      );
    }

    // Deduct credits BEFORE processing
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits, plan")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const creditCost = (body.numClips ?? 3) * 10; // 10 credits per clip
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
    const { error: deductError } = await supabase
      .from("profiles")
      .update({ credits: profile.credits - creditCost })
      .eq("id", userId);

    if (deductError) {
      return NextResponse.json(
        { error: "Failed to deduct credits" },
        { status: 500 }
      );
    }

    // Call Reka
    const rekaResult = await callRekaAPI(body);

    if (!rekaResult.clips || rekaResult.clips.length === 0) {
      // Refund credits if no clips returned
      await supabase
        .from("profiles")
        .update({ credits: profile.credits })
        .eq("id", userId);

      return NextResponse.json(
        { error: "Reka returned no clips for this video" },
        { status: 422 }
      );
    }

    // Persist to Supabase
    const job = await saveJobToSupabase(userId, videoUrl, body, rekaResult);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      clips: rekaResult.clips,
      creditsUsed: creditCost,
      creditsRemaining: profile.credits - creditCost,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/process] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: poll job status or fetch previously generated clips
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