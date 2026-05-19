import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { detectClips } from "@/lib/clipDetection";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSessionUser() {
  const cookieStore = await cookies();
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
  const { data: { user }, error } = await client.auth.getUser();
  return { user, error };
}

const PLAN_WINDOW_LIMITS: Record<string, number> = {
  free: 300,
  starter: 900,
  solo: 900,
  pro: 2700,
  professional: 2700,
  agency: 5400,
};

export interface ProcessRequest {
  videoUrl: string;
  userId?: string;
  prompt?: string;
  numClips?: number;
  minDuration?: number;
  maxDuration?: number;
  aspectRatio?: "9:16" | "16:9" | "4:5" | "1:1";
  subtitles?: boolean;
  timeRange?: { start: number; end: number } | null;
  template?: "moments" | "compilation";
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: sessionError } = await getSessionUser();

    if (sessionError || !user) {
      console.error("[/api/process] Auth error:", sessionError?.message ?? "No session");
      return NextResponse.json(
        { error: "You must be logged in. Please sign in.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    console.log("[/api/process] Authenticated user:", user.id);

    const body: ProcessRequest = await req.json();
    const { videoUrl } = body;
    // Always use the verified session user — never trust userId from the body
    const userId = user.id;

    if (!videoUrl) {
      return NextResponse.json({ error: "videoUrl is required" }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
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

    if (body.timeRange) {
      const windowSeconds = body.timeRange.end - body.timeRange.start;
      const planLimit = PLAN_WINDOW_LIMITS[profile.plan] ?? 180;
      if (windowSeconds > planLimit) {
        return NextResponse.json(
          {
            error: "Video window exceeds your plan limit. Please upgrade.",
            planLimit,
            windowSeconds,
            upgradeUrl: "/pricing",
          },
          { status: 403 }
        );
      }
    }

    const numClips = Math.min(body.numClips ?? 3, 10);
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

    const creditsRemaining = profile.credits - creditCost;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        send({ status: "queued", creditsUsed: creditCost, creditsRemaining });

        try {
          const clips = await detectClips(
            videoUrl,
            body.prompt ?? "Find the most engaging, hook-worthy moments with high energy and emotional impact.",
            numClips,
            body.minDuration ?? 15,
            body.maxDuration ?? 60,
            body.timeRange ?? null,
            userId,
            clipJob?.id ?? randomId(),
            (status) => send({ status })
          );

          if (clipJob) {
            await supabase
              .from("clip_jobs")
              .update({ status: "completed" })
              .eq("id", clipJob.id);

            const clipInserts = clips.map((clip, index) => ({
              job_id: clipJob.id,
              user_id: userId,
              clip_index: index,
              video_url: clip.video_url,
              title: clip.title,
              caption: clip.caption,
              duration: clip.duration,
              thumbnail_url: clip.thumbnail_url ?? null,
              status: "ready",
              created_at: new Date().toISOString(),
            }));
            await supabase.from("clips").insert(clipInserts);
          }

          send({ status: "completed", output: clips });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Processing failed";

          // Refund credits on failure
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

          send({ status: "failed", error_message: message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/process] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function randomId() {
  return Math.random().toString(36).slice(2);
}

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
