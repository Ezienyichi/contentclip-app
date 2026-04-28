import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REKA_API_KEY = process.env.REKA_API_KEY!;
// CORRECT endpoint per official Reka docs
const REKA_BASE = "https://vision-agent.api.reka.ai/v1/clips";

interface RekaClip {
  video_url: string;
  title: string;
  caption: string;
  hashtags?: string[];
  ai_score?: number;
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

  const res = await fetch(`${REKA_BASE}/${rekaJobId}`, {
    headers: {
      "X-Api-Key": REKA_API_KEY,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: `Reka poll error: ${data?.error?.message ?? JSON.stringify(data)}` },
      { status: 500 }
    );
  }

  const status = data.status as string;

  // Still queued or processing
  if (status === "queued" || status === "processing" || status === "preprocessing") {
    return NextResponse.json({ status, clips: null });
  }

  // Failed — refund credits
  if (status === "failed") {
    const { data: clipJob } = await supabase
      .from("clip_jobs")
      .select("num_clips")
      .eq("reka_job_id", rekaJobId)
      .single();

    if (clipJob) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

      if (profile) {
        const refund = (clipJob.num_clips ?? 3) * 10;
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

    const errMsg = data.error_message ?? "Reka job failed";
    return NextResponse.json({ error: errMsg }, { status: 422 });
  }

  // Completed
  if (status === "completed") {
    const rawClips: Record<string, unknown>[] = Array.isArray(data.output)
      ? data.output
      : [];

    if (rawClips.length === 0) {
      return NextResponse.json(
        { error: "Reka completed but returned no clips for this video" },
        { status: 422 }
      );
    }

    // Per docs, output clips use video_url directly
    const clips: RekaClip[] = rawClips.map(
      (clip: Record<string, unknown>, index: number) => ({
        video_url: (clip.video_url ?? "") as string,
        title: (clip.title ?? `Clip ${index + 1}`) as string,
        caption: (clip.caption ?? "") as string,
        hashtags: clip.hashtags as string[] | undefined,
        ai_score: clip.ai_score as number | undefined,
      })
    );

    // Save clips and mark job completed
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
        duration: null,
        thumbnail_url: null,
        status: "ready",
        created_at: new Date().toISOString(),
      }));
      await supabase.from("clips").insert(clipInserts);
    }

    return NextResponse.json({ status: "completed", clips });
  }

  return NextResponse.json({ status, clips: null });
}
