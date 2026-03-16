// src/app/components/BracketGrid.tsx
'use client';

import { useState } from 'react';
import { BracketData, GameCardData, OddsGame, PredictionResult, BracketMatchup } from '@/types';
import { getTeam } from '@/lib/teams';
import { predictGame } from '@/lib/predict';
import GameCard from './GameCard';
import MatchupModal from './MatchupModal';

interface BracketGridProps {
  bracket: BracketData;
  odds: OddsGame[];
  oddsError?: string;
  lastUpdated?: string;
}

function buildGameCardData(
  matchup: BracketMatchup,
  odds: OddsGame[]
): GameCardData {
  const oddsGame =
    odds.find(
      (o) =>
        (o.teamA === matchup.team1 && o.teamB === matchup.team2) ||
        (o.teamA === matchup.team2 && o.teamB === matchup.team1)
    ) ?? null;

  const team1Stats = getTeam(matchup.team1);
  const team2Stats = getTeam(matchup.team2);

  let prediction: PredictionResult | null = null;
  if (team1Stats && team2Stats && oddsGame) {
    // OddsGame.spread is always from teamA's perspective (negative = teamA favored).
    // predictGame() wants spread from team1's (matchup.team1) perspective.
    // If the Odds API has the teams in the same order as our matchup, use as-is.
    // If reversed (Odds API teamA = our team2), negate the spread.
    const spread = oddsGame.teamA === matchup.team1
      ? (oddsGame.spread ?? 0)
      : -(oddsGame.spread ?? 0);
    prediction = predictGame(
      team1Stats,
      team2Stats,
      spread,
      oddsGame.total ?? 150
    );
  }

  return { matchup, odds: oddsGame, prediction };
}

function RegionColumn({
  name,
  cardDataList,
  onSelectGame,
}: {
  name: string;
  cardDataList: GameCardData[];
  onSelectGame: (data: GameCardData) => void;
}) {
  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 px-1">
        {name}
      </h3>
      <div className="flex flex-col gap-2">
        {cardDataList.map((cardData) => (
          <GameCard
            key={`${cardData.matchup.team1}-${cardData.matchup.team2}`}
            data={cardData}
            onClick={() => onSelectGame(cardData)}
          />
        ))}
      </div>
    </div>
  );
}

export default function BracketGrid({ bracket, odds, oddsError, lastUpdated }: BracketGridProps) {
  const [selectedGame, setSelectedGame] = useState<GameCardData | null>(null);

  const { regions } = bracket;

  // Compute all card data once per region
  const regionCardData: Record<string, GameCardData[]> = {};
  for (const [regionName, matchups] of Object.entries(regions)) {
    regionCardData[regionName] = matchups.map((m) => buildGameCardData(m, odds));
  }

  const hotGames = Object.values(regionCardData)
    .flat()
    .filter((d) => d.prediction && Math.abs(d.prediction.spreadEdge) >= 2.0).length;

  return (
    <div>
      {/* Header bar */}
      <div className="flex justify-between items-center mb-6 text-sm text-slate-400">
        <div>
          {oddsError ? (
            <span className="text-amber-400">⚠ Live odds unavailable ({oddsError})</span>
          ) : lastUpdated ? (
            <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
          ) : null}
        </div>
        <div>
          <span className="text-green-400 font-bold">{hotGames}</span> games with edge ≥ 2.0
        </div>
      </div>

      {/* East + South pairing */}
      <div className="mb-8">
        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">
          East / South — Final Four path
        </div>
        <div className="flex gap-3">
          <RegionColumn
            name="East"
            cardDataList={regionCardData['East'] ?? []}
            onSelectGame={setSelectedGame}
          />
          <RegionColumn
            name="South"
            cardDataList={regionCardData['South'] ?? []}
            onSelectGame={setSelectedGame}
          />
        </div>
      </div>

      {/* West + Midwest pairing */}
      <div>
        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">
          West / Midwest — Final Four path
        </div>
        <div className="flex gap-3">
          <RegionColumn
            name="West"
            cardDataList={regionCardData['West'] ?? []}
            onSelectGame={setSelectedGame}
          />
          <RegionColumn
            name="Midwest"
            cardDataList={regionCardData['Midwest'] ?? []}
            onSelectGame={setSelectedGame}
          />
        </div>
      </div>

      {/* Modal */}
      {selectedGame && (
        <MatchupModal data={selectedGame} onClose={() => setSelectedGame(null)} />
      )}
    </div>
  );
}
