import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/notifications?userId=xxx  →  returns latest 30 notifications
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, type, read, link, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notifications: data ?? [] });
}

// POST /api/notifications  →  create a notification
// Body: { userId, title, body?, type?, link?, metadata? }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.userId || !body?.title) {
    return NextResponse.json(
      { error: "userId and title are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: body.userId,
      title: body.title,
      body: body.body ?? null,
      type: body.type ?? "info",
      link: body.link ?? null,
      metadata: body.metadata ?? {},
    })
    .select("id, title, type, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notification: data }, { status: 201 });
}

// PATCH /api/notifications  →  mark as read
// Body: { userId, notificationId? }  — omit notificationId to mark all read
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  let query = supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", body.userId);

  if (body.notificationId) {
    query = query.eq("id", body.notificationId);
  } else {
    query = query.eq("read", false);
  }

  const { error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
