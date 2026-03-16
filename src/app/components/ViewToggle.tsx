'use client';

import { useState } from 'react';
import BracketGrid from './BracketGrid';
import BracketProjection from './BracketProjection';
import { BracketData, OddsGame } from '@/types';
import { TournamentProjection } from '@/types/simulation';

interface ViewToggleProps {
  bracket: BracketData;
  odds: OddsGame[];
  oddsError?: string;
  lastUpdated?: string;
  projection: TournamentProjection;
}

export default function ViewToggle({ bracket, odds, oddsError, lastUpdated, projection }: ViewToggleProps) {
  const [view, setView] = useState<'lines' | 'bracket'>('lines');

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setView('lines')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            view === 'lines'
              ? 'bg-slate-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Live Lines
        </button>
        <button
          onClick={() => setView('bracket')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            view === 'bracket'
              ? 'bg-slate-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Projected Bracket
        </button>
      </div>

      {view === 'lines' ? (
        <BracketGrid
          bracket={bracket}
          odds={odds}
          oddsError={oddsError}
          lastUpdated={lastUpdated}
        />
      ) : (
        <BracketProjection projection={projection} />
      )}
    </div>
  );
}
