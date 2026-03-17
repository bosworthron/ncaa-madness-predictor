// src/app/page.tsx
import ViewToggle from '@/app/components/ViewToggle';
import { fetchOdds } from '@/lib/odds';
import { simulateTournament } from '@/lib/simulate';
import { simulateTournamentByRank } from '@/lib/simulate-boz';
import bracketRaw from '../../data/bracket.json';
import { BracketData, OddsGame } from '@/types';

const bracket = bracketRaw as BracketData;

async function getOdds(): Promise<{ games: OddsGame[]; error?: string; lastUpdated?: string; stale?: boolean }> {
  const result = await fetchOdds();
  return {
    games: result.games,
    error: result.error,
    stale: result.stale,
    lastUpdated: result.stale ? undefined : new Date().toISOString(),
  };
}

export default async function Home() {
  const { games, error, lastUpdated, stale } = await getOdds();
  const projection    = simulateTournament(bracket);
  const bozProjection = simulateTournamentByRank(bracket);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">March Madness Edge Finder</h1>
        <p className="text-slate-400 text-sm mt-1">
          Bartek model vs Vegas lines — 2026 NCAA Tournament
        </p>
      </div>
      <ViewToggle
        bracket={bracket}
        odds={games}
        oddsError={error ?? (stale ? 'stale data' : undefined)}
        lastUpdated={lastUpdated}
        projection={projection}
        bozProjection={bozProjection}
      />
    </main>
  );
}
