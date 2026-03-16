// src/app/page.tsx
import BracketGrid from '@/app/components/BracketGrid';
import { fetchOdds } from '@/lib/odds';
import bracketRaw from '../../data/bracket.json';
import { BracketData, OddsGame } from '@/types';

const bracket = bracketRaw as BracketData;

async function getOdds(): Promise<{ games: OddsGame[]; error?: string; lastUpdated?: string; stale?: boolean }> {
  // fetchOdds never throws — returns { games, error?, stale? }
  const result = await fetchOdds();
  return {
    games: result.games,
    error: result.error,
    stale: result.stale,
    // When serving stale data, don't claim a fresh timestamp — the data's age is
    // unknown, so omit lastUpdated entirely and let the error state drive the UI.
    lastUpdated: result.stale ? undefined : new Date().toISOString(),
  };
}

export default async function Home() {
  const { games, error, lastUpdated, stale } = await getOdds();

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">March Madness Edge Finder</h1>
        <p className="text-slate-400 text-sm mt-1">
          Bartek model vs Vegas lines — 2026 NCAA Tournament
        </p>
      </div>
      <BracketGrid
        bracket={bracket}
        odds={games}
        oddsError={error ?? (stale ? 'stale data' : undefined)}
        lastUpdated={lastUpdated}
      />
    </main>
  );
}
