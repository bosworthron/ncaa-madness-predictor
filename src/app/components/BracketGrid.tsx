// src/app/components/BracketGrid.tsx
'use client';

import { useState } from 'react';
import { BracketData, GameCardData, OddsGame, PredictionResult, BracketMatchup } from '@/types';
import { getTeam } from '@/lib/teams';
import { LEAGUE_AVG_D } from '@/lib/teams';
import { predictGame } from '@/lib/predict';
import GameCard from './GameCard';
import MatchupModal from './MatchupModal';

const LUCK_MULT = 25;
const SPREAD_SIGMA = 10; // standard deviation for CBB game margins

/**
 * Logistic win-probability from model spread.
 * Returns probability that team1 wins straight up.
 * Calibrated so a 10-pt favorite wins ~83%, 5-pt ~69%, pick-em 50%.
 */
function winProb(modelSpread: number): number {
  return 1 / (1 + Math.exp(-modelSpread / SPREAD_SIGMA));
}

interface BracketGridProps {
  bracket: BracketData;
  odds: OddsGame[];
  oddsError?: string;
  lastUpdated?: string;
}

interface UpsetEntry {
  matchup: BracketMatchup;
  region: string;
  upsetTeam: string;
  upsetSeed: number;
  favoriteTeam: string;
  favoriteSeed: number;
  upsetPct: number;        // 0-100
  modelPicksUpset: boolean;
  modelMargin: number;     // absolute, from upsetTeam's perspective
  cardData: GameCardData;
}

function buildGameCardData(matchup: BracketMatchup, odds: OddsGame[]): GameCardData {
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

/**
 * Compute upset entries for every matchup using the Bartek model.
 * Works regardless of whether Vegas odds are available — upset probability
 * is derived purely from model spread (AdjEM-based, tempo-scaled, luck-adjusted).
 * Only includes matchups with a real seed gap (seed2 > seed1).
 */
function buildUpsetEntries(
  regions: BracketData['regions'],
  cardDataByRegion: Record<string, GameCardData[]>
): UpsetEntry[] {
  const entries: UpsetEntry[] = [];

  for (const [regionName, matchups] of Object.entries(regions)) {
    const cards = cardDataByRegion[regionName] ?? [];

    matchups.forEach((matchup, idx) => {
      // Only real upsets: team2 must have higher seed number (is the underdog)
      if (matchup.seed2 <= matchup.seed1) return;

      const t1 = getTeam(matchup.team1);
      const t2 = getTeam(matchup.team2);
      if (!t1 || !t2) return;

      // Compute model spread using same formula as predict.ts
      const avgT = (t1.adjT + t2.adjT) / 2;
      const em1 = t1.adjEM - t1.luck * LUCK_MULT;
      const em2 = t2.adjEM - t2.luck * LUCK_MULT;
      const modelSpread = (em1 - em2) * avgT / 100; // positive = team1 (favorite) favored

      const upsetProb = 1 - winProb(modelSpread);   // probability team2 (underdog) wins
      const modelPicksUpset = modelSpread < 0;       // model thinks underdog wins outright

      entries.push({
        matchup,
        region: regionName,
        upsetTeam: matchup.team2,
        upsetSeed: matchup.seed2,
        favoriteTeam: matchup.team1,
        favoriteSeed: matchup.seed1,
        upsetPct: upsetProb * 100,
        modelPicksUpset,
        modelMargin: Math.abs(modelSpread),
        cardData: cards[idx],
      });
    });
  }

  return entries.sort((a, b) => b.upsetPct - a.upsetPct);
}

function UpsetCard({ entry, onClick }: { entry: UpsetEntry; onClick: () => void }) {
  const pct = entry.upsetPct;
  const pctColor =
    entry.modelPicksUpset
      ? 'text-green-400'
      : pct >= 30
      ? 'text-amber-400'
      : 'text-slate-400';

  const barColor =
    entry.modelPicksUpset
      ? 'bg-green-500'
      : pct >= 30
      ? 'bg-amber-500'
      : 'bg-slate-500';

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-3 transition-colors cursor-pointer"
    >
      {/* Region tag + model pick banner */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-slate-500 uppercase tracking-wide">{entry.region}</span>
        {entry.modelPicksUpset && (
          <span className="text-xs font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
            Model pick outright
          </span>
        )}
      </div>

      {/* Matchup + probability */}
      <div className="flex justify-between items-start">
        <div>
          <div className="text-white font-bold text-sm">
            <span className="text-slate-400 mr-1">({entry.upsetSeed})</span>
            {entry.upsetTeam}
          </div>
          <div className="text-slate-400 text-xs mt-0.5">
            over <span className="text-slate-300">({entry.favoriteSeed}) {entry.favoriteTeam}</span>
          </div>
        </div>
        <div className="text-right ml-3 flex-shrink-0">
          <div className={`text-2xl font-bold tabular-nums ${pctColor}`}>
            {pct.toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500">win prob</div>
        </div>
      </div>

      {/* Probability bar */}
      <div className="mt-2.5 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Model margin context */}
      <div className="mt-1.5 text-xs text-slate-500">
        {entry.modelPicksUpset
          ? `Model: ${entry.upsetTeam} by ${entry.modelMargin.toFixed(1)} pts`
          : `Model: ${entry.favoriteTeam} by ${entry.modelMargin.toFixed(1)} pts`}
      </div>
    </button>
  );
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

type View = 'bracket' | 'edges' | 'upsets';

export default function BracketGrid({ bracket, odds, oddsError, lastUpdated }: BracketGridProps) {
  const [selectedGame, setSelectedGame] = useState<GameCardData | null>(null);
  const [view, setView] = useState<View>('bracket');

  const { regions } = bracket;

  // Compute all card data once per region
  const regionCardData: Record<string, GameCardData[]> = {};
  for (const [regionName, matchups] of Object.entries(regions)) {
    regionCardData[regionName] = matchups.map((m) => buildGameCardData(m, odds));
  }

  const allCards = Object.values(regionCardData).flat();
  const hotGames = allCards.filter((d) => d.prediction && Math.abs(d.prediction.spreadEdge) >= 2.0).length;

  // Top Edges: all games with live odds + prediction, sorted by |spreadEdge|
  const edgeCards = allCards
    .filter((d): d is GameCardData & { prediction: NonNullable<GameCardData['prediction']> } =>
      !!d.prediction && d.odds?.spread !== null
    )
    .sort((a, b) => Math.abs(b.prediction.spreadEdge) - Math.abs(a.prediction.spreadEdge));

  // Upsets: model-based upset probability, no odds required
  const upsetEntries = buildUpsetEntries(regions, regionCardData);
  const strongUpsets = upsetEntries.filter((e) => e.upsetPct >= 25 || e.modelPicksUpset).length;

  const tabClass = (active: boolean, activeColor = 'bg-slate-600') =>
    `px-3 py-1.5 transition-colors ${active ? `${activeColor} text-white` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`;

  return (
    <div>
      {/* Header bar */}
      <div className="flex justify-between items-center mb-4 text-sm text-slate-400">
        <div>
          {oddsError ? (
            <span className="text-amber-400">⚠ Live odds unavailable ({oddsError})</span>
          ) : lastUpdated ? (
            <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          <span>
            <span className="text-green-400 font-bold">{hotGames}</span> edges ≥ 2.0
          </span>
          <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs font-bold">
            <button onClick={() => setView('bracket')} className={tabClass(view === 'bracket')}>
              By Region
            </button>
            <button onClick={() => setView('edges')} className={tabClass(view === 'edges', 'bg-green-700')}>
              Top Edges
            </button>
            <button onClick={() => setView('upsets')} className={tabClass(view === 'upsets', 'bg-blue-700')}>
              Upsets ({strongUpsets})
            </button>
          </div>
        </div>
      </div>

      {view === 'edges' ? (
        /* Top Edges view */
        <div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">
            All games ranked by spread edge — click any game for details
          </div>
          {edgeCards.length === 0 ? (
            <div className="text-slate-500 text-sm">No games with live lines yet.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {edgeCards.map((cardData) => (
                <GameCard
                  key={`${cardData.matchup.team1}-${cardData.matchup.team2}`}
                  data={cardData}
                  onClick={() => setSelectedGame(cardData)}
                />
              ))}
            </div>
          )}
        </div>
      ) : view === 'upsets' ? (
        /* Upsets view */
        <div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">
            Ranked by Bartek model win probability — click any game for full analysis
          </div>
          {upsetEntries.length === 0 ? (
            <div className="text-slate-500 text-sm">No model data available.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {upsetEntries.map((entry) => (
                <UpsetCard
                  key={`${entry.matchup.team1}-${entry.matchup.team2}`}
                  entry={entry}
                  onClick={() => entry.cardData && setSelectedGame(entry.cardData)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* By Region view */
        <>
          <div className="mb-8">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">
              East / South — Final Four path
            </div>
            <div className="flex gap-3">
              <RegionColumn name="East" cardDataList={regionCardData['East'] ?? []} onSelectGame={setSelectedGame} />
              <RegionColumn name="South" cardDataList={regionCardData['South'] ?? []} onSelectGame={setSelectedGame} />
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">
              West / Midwest — Final Four path
            </div>
            <div className="flex gap-3">
              <RegionColumn name="West" cardDataList={regionCardData['West'] ?? []} onSelectGame={setSelectedGame} />
              <RegionColumn name="Midwest" cardDataList={regionCardData['Midwest'] ?? []} onSelectGame={setSelectedGame} />
            </div>
          </div>
        </>
      )}

      {selectedGame && (
        <MatchupModal data={selectedGame} onClose={() => setSelectedGame(null)} />
      )}
    </div>
  );
}
