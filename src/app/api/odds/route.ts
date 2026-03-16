// src/app/api/odds/route.ts
import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { normalizeTeamName } from '@/lib/normalize';
import { OddsGame } from '@/types';

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4/sports/basketball_ncaab/odds';

// Module-level stale cache — populated on every successful fetch, used as fallback
// on API errors. Works regardless of whether fetchOdds is called via HTTP GET
// or imported directly by page.tsx.
let lastGoodGames: OddsGame[] | null = null;
let lastGoodTimestamp: string | null = null;

async function fetchFromApi(): Promise<OddsGame[]> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) throw new Error('ODDS_API_KEY environment variable is not set');

  const url = `${ODDS_API_BASE}?regions=us&markets=spreads,totals&apiKey=${apiKey}`;
  const res = await fetch(url);

  if (res.status === 401) throw new Error('invalid_key');
  if (res.status === 429) throw new Error('rate_limited');
  if (!res.ok) throw new Error(`odds_api_error:${res.status}`);

  const data = await res.json();

  return data.map((game: any): OddsGame => {
    const bookmaker = game.bookmakers?.[0];
    const spreadMarket = bookmaker?.markets?.find((m: any) => m.key === 'spreads');
    const totalMarket = bookmaker?.markets?.find((m: any) => m.key === 'totals');

    // Store spread from teamA's (away team's) perspective: negative = teamA favored
    const awayOutcome = spreadMarket?.outcomes?.find(
      (o: any) => o.name === game.away_team
    );
    const spread = awayOutcome?.point ?? null;

    const totalOutcome = totalMarket?.outcomes?.find(
      (o: any) => o.name === 'Over'
    );
    const total = totalOutcome?.point ?? null;

    const rawTeamA = game.away_team;
    const rawTeamB = game.home_team;

    return {
      id: game.id,
      rawTeamA,
      rawTeamB,
      teamA: normalizeTeamName(rawTeamA) ?? rawTeamA,
      teamB: normalizeTeamName(rawTeamB) ?? rawTeamB,
      spread,   // negative = teamA (away) favored
      total,
      commenceTime: game.commence_time,
    };
  });
}

const cachedFetchFromApi = unstable_cache(
  fetchFromApi,
  ['ncaab-odds'],
  { revalidate: 3600, tags: ['odds'] }
);

/**
 * Fetch live odds. On API errors returns stale data if available.
 * Exported so page.tsx can call it directly without an HTTP round-trip.
 */
export async function fetchOdds(): Promise<{ games: OddsGame[]; stale?: boolean; error?: string }> {
  try {
    const games = await cachedFetchFromApi();
    // Save a fresh copy for stale fallback
    lastGoodGames = games;
    lastGoodTimestamp = new Date().toISOString();
    return { games };
  } catch (err: any) {
    const message = err.message ?? 'unknown_error';
    if (lastGoodGames && (message === 'invalid_key' || message === 'rate_limited')) {
      return { games: lastGoodGames, stale: true };
    }
    const knownErrors = ['invalid_key', 'rate_limited', 'missing_key'];
    const errorCode = knownErrors.find((e) => message.includes(e)) ?? 'unavailable';
    return { games: [], error: errorCode };
  }
}

export async function GET() {
  const result = await fetchOdds();
  return NextResponse.json({
    ...result,
    lastUpdated: lastGoodTimestamp ?? new Date().toISOString(),
  });
}
