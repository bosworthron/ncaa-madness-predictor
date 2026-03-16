// src/lib/odds.ts
import { unstable_cache } from 'next/cache';
import { normalizeTeamName } from '@/lib/normalize';
import { OddsGame } from '@/types';

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4/sports/basketball_ncaab/odds';

// Module-level stale cache — populated on every successful fetch, used as fallback
// on API errors. Works regardless of whether fetchOdds is called via HTTP GET
// or imported directly by page.tsx.
//
// NOTE: These variables only persist within a single Node.js process instance.
// On Vercel serverless, every cold start resets them to null. The primary cache
// is `unstable_cache` below with a 60-minute revalidation window. These vars are
// a secondary within-instance fallback used only for 401/429 error recovery when
// a warm instance already has a prior successful response in memory.
let lastGoodGames: OddsGame[] | null = null;
export let lastGoodTimestamp: string | null = null;

async function fetchFromApi(): Promise<OddsGame[]> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) throw new Error('ODDS_API_KEY environment variable is not set');

  // The Odds API requires the key as a query parameter — this is their mandated
  // authentication format. Because fetchFromApi runs exclusively server-side, the
  // key is never exposed to the browser or included in any client bundle.
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
    // 'missing_key' was removed — a missing ODDS_API_KEY throws a plain English
    // message that won't match any code string; it correctly falls through to 'unavailable'.
    const knownErrors = ['invalid_key', 'rate_limited'];
    const errorCode = knownErrors.find((e) => message.includes(e)) ?? 'unavailable';
    return { games: [], error: errorCode };
  }
}
