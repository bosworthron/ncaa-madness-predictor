// src/app/api/odds/route.ts
import { NextResponse } from 'next/server';
import { fetchOdds, lastGoodTimestamp } from '@/lib/odds';

export async function GET() {
  const result = await fetchOdds();
  return NextResponse.json({
    ...result,
    lastUpdated: lastGoodTimestamp ?? new Date().toISOString(),
  });
}
