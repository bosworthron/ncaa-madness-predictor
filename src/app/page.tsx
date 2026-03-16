// src/app/page.tsx
import BracketGrid from '@/app/components/BracketGrid';
import { fetchOdds } from '@/app/api/odds/route';
import bracketRaw from '../../data/bracket.json';
import { BracketData, OddsGame } from '@/types';

const bracket = bracketRaw as BracketData;

async function getOdds(): Promise<{ games: OddsGame[]; error?: string; lastUpdated?: string }> {
  // fetchOdds never throws — returns { games, error?, stale? }
  const result = await fetchOdds();
  return {
    games: result.games,
    error: result.error,
    lastUpdated: new Date().toISOString(),
  };
}

export default async function Home() {
  const { games, error, lastUpdated } = await getOdds();

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">March Madness Edge Finder</h1>
        <p className="text-slate-400 text-sm mt-1">
          KenPom model vs Vegas lines — 2026 NCAA Tournament
        </p>
      </div>
      <BracketGrid
        bracket={bracket}
        odds={games}
        oddsError={error}
        lastUpdated={lastUpdated}
      />
    </main>
  );
}
