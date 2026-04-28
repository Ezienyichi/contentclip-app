import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REKA_API_KEY = process.env.REKA_API_KEY!;
const REKA_BASE = "https://vision-agent.api.reka.ai/v1/creator/reels";

interface RekaClip {
  video_url: string;
  title: string;
  caption: string;
  duration?: number;
  thumbnail_url?: string;
}

// GET /api/poll?rekaJobId=xxx&userId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rekaJobId = searchParams.get("rekaJobId");
  const userId = searchParams.get("userId");

  if (!rekaJobId || !userId) {
    return NextResponse.json(
      { error: "rekaJobId and userId are required" },
      { status: 400 }
    );
  }

  // Poll Reka for job status
  const res = await fetch(`${REKA_BASE}/${rekaJobId}`, {
    headers: { "X-Api-Key": REKA_API_KEY },
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: `Reka poll error: ${JSON.stringify(data)}` },
      { status: 500 }
    );
  }

  const status = data.status as string;

  // Still processing
  if (status === "queued" || status === "processing") {
    return NextResponse.json({ status, clips: null });
  }

  // Failed
  if (status === "failed") {
    // Refund credits
    const { data: job } = await supabase
      .from("clip_jobs")
      .select("user_id")
      .eq("reka_job_id", rekaJobId)
      .single();

    if (job) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

      if (profile) {
        const { data: clipJob } = await supabase
          .from("clip_jobs")
          .select("num_clips")
          .eq("reka_job_id", rekaJobId)
          .single();

        const refund = (clipJob?.num_clips ?? 3) * 10;
        await supabase
          .from("profiles")
          .update({ credits: profile.credits + refund })
          .eq("id", userId);
      }
    }

    await supabase
      .from("clip_jobs")
      .update({ status: "failed" })
      .eq("reka_job_id", rekaJobId);

    return NextResponse.json(
      { error: data.error_message ?? "Reka job failed" },
      { status: 422 }
    );
  }

  // Completed — extract clips
  if (status === "completed") {
    const output = data.output ?? {};
    const rawClips: Record<string, unknown>[] =
      output.clips ??
      output.reels ??
      output.results ??
      (Array.isArray(output) ? output : []);

    const clips: RekaClip[] = rawClips.map(
      (clip: Record<string, unknown>, index: number) => ({
        video_url: (clip.signed_s3_video_url ??
          clip.video_url ??
          clip.url ??
          "") as string,
        title: (clip.title ?? clip.name ?? `Clip ${index + 1}`) as string,
        caption: (clip.caption ?? clip.description ?? "") as string,
        duration: clip.duration as number | undefined,
        thumbnail_url: (clip.thumbnail_url ?? clip.thumbnail ?? "") as string,
      })
    );

    if (clips.length === 0) {
      return NextResponse.json(
        { error: "Reka completed but returned no clips" },
        { status: 422 }
      );
    }

    // Save clips to Supabase
    const { data: clipJob } = await supabase
      .from("clip_jobs")
      .update({ status: "completed" })
      .eq("reka_job_id", rekaJobId)
      .select()
      .single();

    if (clipJob) {
      const clipInserts = clips.map((clip, index) => ({
        job_id: clipJob.id,
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

      await supabase.from("clips").insert(clipInserts);
    }

    return NextResponse.json({ status: "completed", clips });
  }

  return NextResponse.json({ status, clips: null });
}
