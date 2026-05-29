import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const  = process.env.!;
// CORRECT endpoint per official  docs
const _BASE = "https://vision-agent.api./v1/clips";

interface Clip {
  video_url: string;
  title: string;
  caption: string;
  hashtags?: string[];
  ai_score?: number;
}

// GET /api/poll?JobId=xxx&userId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const JobId = searchParams.get("JobId");
  const userId = searchParams.get("userId");

  if (!JobId || !userId) {
    return NextResponse.json(
      { error: "JobId and userId are required" },
      { status: 400 }
    );
  }

  const res = await fetch(`${_BASE}/${JobId}`, {
    headers: {
      "X-Api-Key": ,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: ` poll error: ${data?.error?.message ?? JSON.stringify(data)}` },
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
      .eq("_job_id", JobId)
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
      .eq("_job_id", JobId);

    const errMsg = data.error_message ?? " job failed";
    return NextResponse.json({ error: errMsg }, { status: 422 });
  }

  // Completed
  if (status === "completed") {
    const rawClips: Record<string, unknown>[] = Array.isArray(data.output)
      ? data.output
      : [];

    if (rawClips.length === 0) {
      return NextResponse.json(
        { error: " completed but returned no clips for this video" },
        { status: 422 }
      );
    }

    // Per docs, output clips use video_url directly
    const clips: Clip[] = rawClips.map(
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
      .eq("_job_id", JobId)
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
