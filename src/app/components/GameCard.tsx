// src/app/components/GameCard.tsx
'use client';

import { GameCardData, StyleFlag } from '@/types';

const FLAG_ICONS: Record<StyleFlag, string> = {
  '3PT Exploit': '🎯',
  'Tempo Clash': '⚡',
  'Luck Regression': '🍀',
  'Experience Edge': '🎓',
  'Size Mismatch': '📏',
};

function EdgeBadge({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  const color =
    value >= 1.0
      ? 'text-green-400'
      : value <= -1.0
      ? 'text-red-400'
      : 'text-amber-400';
  const sign = value > 0 ? '+' : '';
  return (
    <span className={`text-xs font-bold ${color}`}>
      {label}: {sign}{value.toFixed(1)}
    </span>
  );
}

interface GameCardProps {
  data: GameCardData;
  onClick: () => void;
}

export default function GameCard({ data, onClick }: GameCardProps) {
  const { matchup, odds, prediction } = data;
  const hasOdds = odds && odds.spread !== null;
  const hasPrediction = !!prediction;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-3 transition-colors cursor-pointer"
    >
      {/* Teams */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-white text-sm font-medium">
            <span className="text-slate-400 mr-1">({matchup.seed1})</span>
            {matchup.team1}
          </div>
          <div className="text-white text-sm font-medium mt-1">
            <span className="text-slate-400 mr-1">({matchup.seed2})</span>
            {matchup.team2}
          </div>
        </div>
        {/* Vegas line */}
        {hasOdds ? (
          <div className="text-right text-xs text-slate-400">
            <div>Sprd: {odds!.spread! > 0 ? '+' : ''}{odds!.spread}</div>
            <div>O/U: {odds!.total}</div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">Line only</div>
        )}
      </div>

      {/* Edges */}
      {hasPrediction && (
        <div className="flex gap-3 mb-2">
          <EdgeBadge label="Sprd" value={prediction!.spreadEdge} />
          <EdgeBadge label="Tot" value={prediction!.totalEdge} />
        </div>
      )}

      {/* Style flags */}
      {hasPrediction && prediction!.flags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {prediction!.flags.map((flag) => (
            <span
              key={flag}
              className="text-xs bg-slate-700 text-slate-300 rounded px-1.5 py-0.5"
              title={flag}
            >
              {FLAG_ICONS[flag]}
            </span>
          ))}
        </div>
      )}

      {/* Has odds but no stats in our DB — show "No model data" */}
      {!hasPrediction && hasOdds && (
        <div className="text-xs text-slate-500 mt-1">No model data</div>
      )}
      {/* No odds at all */}
      {!hasOdds && (
        <div className="text-xs text-slate-500">Awaiting line</div>
      )}
    </button>
  );
}
