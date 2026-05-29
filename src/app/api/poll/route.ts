import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Polling not used with n8n webhook.' },
    { status: 410 }
  );
}
