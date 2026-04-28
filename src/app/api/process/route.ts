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

// POST: submit job to Reka, return rekaJobId immediately
// Client polls GET /api/poll?rekaJobId=xxx to get results
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

    // Deduct credits upfront
    await supabase
      .from("profiles")
      .update({ credits: profile.credits - creditCost })
      .eq("id", userId);

    // Submit to Reka — returns immediately with a job ID
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

    // Save pending job to Supabase so we can track it
    await supabase.from("clip_jobs").insert({
      user_id: userId,
      source_url: videoUrl,
      status: "processing",
      prompt: body.prompt,
      num_clips: body.numClips ?? 3,
      aspect_ratio: body.aspectRatio ?? "9:16",
      subtitles: body.subtitles ?? true,
      reka_job_id: rekaJobId,
      created_at: new Date().toISOString(),
    });

    // Return job ID to client — client will poll /api/poll
    return NextResponse.json({
      success: true,
      polling: true,
      rekaJobId,
      creditsUsed: creditCost,
      creditsRemaining: profile.credits - creditCost,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/process] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: fetch previously completed clips for a job
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
