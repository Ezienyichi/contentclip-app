import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    { error: 'Processing not configured.' },
    { status: 503 }
  );
}
