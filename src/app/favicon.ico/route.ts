import { NextResponse } from 'next/server';

export function GET() {
  // Avoid noisy 404s for /favicon.ico in environments without a real icon asset.
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}

export const HEAD = GET;

