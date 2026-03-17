'use client';

import { useState } from 'react';
import BracketGrid from './BracketGrid';
import BracketProjection from './BracketProjection';
import BozProjection from './BozProjection';
import LeoProjection from './LeoProjection';
import UpsetsTab from './UpsetsTab';
import { BracketData, OddsGame } from '@/types';
import { TournamentProjection } from '@/types/simulation';

interface ViewToggleProps {
  bracket: BracketData;
  odds: OddsGame[];
  oddsError?: string;
  lastUpdated?: string;
  projection: TournamentProjection;      // Bartek model (AdjEM-based)
  bozProjection: TournamentProjection;   // Boz model (KenPom rank-based)
  leoProjection: TournamentProjection;   // Leo model (Bracket Matrix-based)
}

type View = 'lines' | 'bracket' | 'boz' | 'leo' | 'upsets';

export default function ViewToggle({
  bracket, odds, oddsError, lastUpdated, projection, bozProjection, leoProjection,
}: ViewToggleProps) {
  const [view, setView] = useState<View>('lines');

  const tab = (v: View, label: string) => (
    <button
      onClick={() => setView(v)}
      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
        view === v ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1 w-fit">
        {tab('lines',   'Live Lines')}
        {tab('bracket', 'Bartek Model')}
        {tab('boz',     'Boz Model')}
        {tab('leo',     'Leo Model')}
        {tab('upsets',  'Upset Picks')}
      </div>

      {view === 'lines' ? (
        <BracketGrid
          bracket={bracket}
          odds={odds}
          oddsError={oddsError}
          lastUpdated={lastUpdated}
        />
      ) : view === 'bracket' ? (
        <BracketProjection projection={projection} />
      ) : view === 'boz' ? (
        <BozProjection projection={bozProjection} />
      ) : view === 'leo' ? (
        <LeoProjection projection={leoProjection} />
      ) : (
        <UpsetsTab
          bracket={bracket}
          bartekProjection={projection}
          bozProjection={bozProjection}
          leoProjection={leoProjection}
        />
      )}
    </div>
  );
}
