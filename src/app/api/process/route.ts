import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REKA_API_KEY = process.env.REKA_API_KEY!;
// CORRECT endpoint per official Reka docs: https://docs.reka.ai/vision/highlight-clip-generation
const REKA_BASE = "https://vision-agent.api.reka.ai/v1/clips";

export interface RekaClip {
  video_url: string;
  title: string;
  caption: string;
  hashtags?: string[];
  ai_score?: number;
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
  aspectRatio?: "9:16" | "16:9" | "4:5" | "1:1";
  subtitles?: boolean;
  timeRange?: { start: number; end: number } | null;
  template?: "moments" | "compilation";
}

// POST: stream Reka SSE directly to client with live status updates
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

    const numClips = Math.min(body.numClips ?? 3, 3);
    const creditCost = numClips * 10;

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

    // Build Reka request body with stream: true
    const uniquePrompt = `${body.prompt ?? "Create an engaging short video highlighting the best moments"} [${Date.now()}]`;

    const rekaBody: Record<string, unknown> = {
      video_urls: [videoUrl],
      prompt: uniquePrompt,
      generation_config: {
        template: body.template ?? "moments",
        num_generations: numClips,
        min_duration_seconds: body.minDuration ?? 0,
        max_duration_seconds: body.maxDuration ?? 60,
        ...(body.timeRange
          ? {
              source_start_time: body.timeRange.start,
              source_end_time: body.timeRange.end,
            }
          : {}),
      },
      rendering_config: {
        subtitles: body.subtitles ?? true,
        aspect_ratio: body.aspectRatio ?? "9:16",
        resolution: 720,
        caption_style: {
          desired_font_size: 120,
          text_transform: "uppercase",
          text_color: "#FFFFFF",
          highlight_color: "#C0C1FF",
          stroke_color: "#000000",
          position: "bottom",
          font_family: "BebasNeue",
        },
      },
      stream: true,
    };

    const rekaResponse = await fetch(REKA_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": REKA_API_KEY,
      },
      body: JSON.stringify(rekaBody),
    });

    if (!rekaResponse.ok) {
      // Refund credits on Reka submission failure
      await supabase
        .from("profiles")
        .update({ credits: profile.credits })
        .eq("id", userId);
      const errData = await rekaResponse.json().catch(() => ({}));
      const errMsg = (errData as Record<string, Record<string, string>>)?.error?.message ?? rekaResponse.statusText;
      return NextResponse.json(
        { error: `Reka error: ${errMsg}` },
        { status: 500 }
      );
    }

    // Save initial job record (no reka_job_id in streaming mode)
    const { data: clipJob } = await supabase
      .from("clip_jobs")
      .insert({
        user_id: userId,
        source_url: videoUrl,
        status: "processing",
        prompt: body.prompt,
        num_clips: numClips,
        aspect_ratio: body.aspectRatio ?? "9:16",
        subtitles: body.subtitles ?? true,
        reka_job_id: null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const reader = rekaResponse.body!.getReader();
    const creditsRemaining = profile.credits - creditCost;
    let buffer = "";

    const stream = new ReadableStream({
      async start(controller) {
        // Emit a "started" event so the client knows credits used and can show initial status
        const startedEvent = `data: ${JSON.stringify({
          status: "queued",
          creditsUsed: creditCost,
          creditsRemaining,
        })}\n\n`;
        controller.enqueue(encoder.encode(startedEvent));

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            let output = "";
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const event = JSON.parse(line.slice(6)) as Record<string, unknown>;

                  if (event.status === "completed" && Array.isArray(event.output)) {
                    if (clipJob) {
                      await supabase
                        .from("clip_jobs")
                        .update({ status: "completed" })
                        .eq("id", clipJob.id);
                      const clipInserts = (event.output as Record<string, unknown>[]).map(
                        (clip, index) => ({
                          job_id: clipJob.id,
                          user_id: userId,
                          clip_index: index,
                          video_url: clip.video_url,
                          title: clip.title ?? `Clip ${index + 1}`,
                          caption: clip.caption ?? "",
                          duration: null,
                          thumbnail_url: null,
                          status: "ready",
                          created_at: new Date().toISOString(),
                        })
                      );
                      await supabase.from("clips").insert(clipInserts);
                    }
                  } else if (event.status === "failed") {
                    // Refund credits on job failure
                    await supabase
                      .from("profiles")
                      .update({ credits: profile.credits })
                      .eq("id", userId);
                    if (clipJob) {
                      await supabase
                        .from("clip_jobs")
                        .update({ status: "failed" })
                        .eq("id", clipJob.id);
                    }
                  }
                } catch {
                  // Skip malformed JSON in SSE line
                }
              }
              output += line + "\n";
            }

            if (output) {
              controller.enqueue(encoder.encode(output));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
      cancel() {
        reader.cancel();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/process] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: fetch completed clips for a saved job
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
