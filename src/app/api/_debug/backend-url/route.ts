import { NextResponse } from 'next/server';
import { resolveBackendUrl } from '../../_utils/backendUrl';

export async function GET() {
  try {
    const backendUrl = resolveBackendUrl();
    return NextResponse.json({ ok: true, backendUrl }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || String(error) },
      { status: 503 }
    );
  }
}

