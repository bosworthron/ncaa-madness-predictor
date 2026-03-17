'use client';

import { TournamentProjection, ProjectedGame, RegionProjection } from '@/types/simulation';

function seedColor(seed: number) {
  if (seed === 1) return 'text-yellow-400';
  if (seed <= 3) return 'text-green-400';
  if (seed <= 5) return 'text-emerald-400';
  return 'text-slate-400';
}

// Gap color thresholds for Bracket Matrix decimal rankings (range 1–16, max gap ~15)
function gapColor(gap: number) {
  if (gap >= 5) return 'text-green-400';
  if (gap >= 2) return 'text-amber-400';
  return 'text-red-400';
}

function RankGapBadge({ gap, hasData }: { gap: number; hasData: boolean }) {
  if (!hasData) return <span className="text-xs text-slate-600">?</span>;
  return (
    <span className={`text-xs font-bold ${gapColor(gap)}`}>
      Δ{gap.toFixed(2)}
    </span>
  );
}

function GameLine({ game }: { game: ProjectedGame }) {
  const isUpset = game.winner.seed > game.loser.seed;
  return (
    <div className="py-1 border-b border-slate-700/40 last:border-0">
      <div className="flex items-center justify-between">
        <span className="text-white text-xs">
          <span className={`${seedColor(game.winner.seed)} mr-1`}>({game.winner.seed})</span>
          <span className="font-medium">{game.winner.name}</span>
          {game.winner.rank !== null && (
            <span className="text-slate-500 ml-1 tabular-nums">BM{game.winner.rank.toFixed(2)}</span>
          )}
          {isUpset && (
            <span className="text-amber-400 ml-1 font-bold text-[10px]">UPSET</span>
          )}
        </span>
        <RankGapBadge gap={game.margin} hasData={game.hasData} />
      </div>
      <div className="text-slate-600 text-xs">
        def. ({game.loser.seed}) {game.loser.name}
        {game.loser.rank !== null && (
          <span className="ml-1">BM{game.loser.rank.toFixed(2)}</span>
        )}
      </div>
    </div>
  );
}

function RoundBlock({ label, games }: { label: string; games: ProjectedGame[] }) {
  return (
    <div>
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="bg-slate-900/50 rounded-lg px-2 py-0.5">
        {games.map((g, i) => <GameLine key={i} game={g} />)}
      </div>
    </div>
  );
}

function RegionPanel({ region }: { region: RegionProjection }) {
  const champ = region.champion;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{region.name}</h3>
        {champ.rank !== null && (
          <span className="text-xs text-slate-500">BM{champ.rank.toFixed(2)}</span>
        )}
      </div>

      {/* Regional winner */}
      <div className="bg-slate-700/40 border border-slate-600/50 rounded-lg p-2.5">
        <div className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-0.5">Regional Winner</div>
        <div className="text-white font-bold">
          <span className={`${seedColor(champ.seed)} mr-1`}>({champ.seed})</span>
          {champ.name}
        </div>
      </div>

      <RoundBlock label="Round of 64" games={region.r64} />
      <RoundBlock label="Round of 32" games={region.r32} />
      <RoundBlock label="Sweet 16" games={region.sweet16} />
      <RoundBlock label="Elite 8" games={[region.elite8]} />
    </div>
  );
}

function FinalFourGame({ game, label }: { game: ProjectedGame; label: string }) {
  const isUpset = game.winner.seed > game.loser.seed;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
      <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="text-white text-sm font-bold">
            <span className={`${seedColor(game.winner.seed)} mr-1`}>({game.winner.seed})</span>
            {game.winner.name}
            {game.winner.rank !== null && (
              <span className="text-slate-400 text-xs font-normal ml-1">BM{game.winner.rank.toFixed(2)}</span>
            )}
            {isUpset && <span className="text-amber-400 ml-1 text-xs font-bold">UPSET</span>}
          </div>
          <div className="text-slate-500 text-xs mt-0.5">
            def. ({game.loser.seed}) {game.loser.name}
            {game.loser.rank !== null && (
              <span className="ml-1">BM{game.loser.rank.toFixed(2)}</span>
            )}
            {game.hasData && (
              <span className={`ml-2 font-bold ${gapColor(game.margin)}`}>
                Δ{game.margin.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface LeoProjectionProps {
  projection: TournamentProjection;
}

export default function LeoProjection({ projection }: LeoProjectionProps) {
  const { regions, finalFour, championship, champion } = projection;

  return (
    <div>
      {/* Legend */}
      <div className="flex gap-4 mb-5 text-xs text-slate-500">
        <span>Δ = Bracket Matrix rank gap</span>
        <span><span className="text-green-400 font-bold">Δ≥5.00</span> = comfortable</span>
        <span><span className="text-amber-400 font-bold">Δ2-5</span> = moderate</span>
        <span><span className="text-red-400 font-bold">Δ&lt;2</span> = coin flip</span>
      </div>

      {/* Champion hero */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-8 text-center">
        <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Leo Model Champion</div>
        <div className="text-white text-3xl font-bold mb-1">
          ({champion.seed}) {champion.name}
        </div>
        {champion.rank !== null && (
          <div className="text-slate-400 text-sm">Bracket Matrix {champion.rank.toFixed(2)}</div>
        )}
        {championship.hasData && (
          <div className="text-slate-400 text-xs mt-2">
            Championship over ({championship.loser.seed}) {championship.loser.name}
            {championship.loser.rank !== null && ` (BM${championship.loser.rank.toFixed(2)})`}
            {' '}— rank gap Δ{championship.margin.toFixed(2)}
          </div>
        )}
      </div>

      {/* Final Four */}
      <div className="mb-8">
        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Final Four</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FinalFourGame game={finalFour.eastSouth} label="East vs South" />
          <FinalFourGame game={finalFour.westMidwest} label="West vs Midwest" />
        </div>
      </div>

      {/* Regions */}
      <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Regional Projections</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {['East', 'South', 'West', 'Midwest'].map(name => (
          regions[name] ? <RegionPanel key={name} region={regions[name]} /> : null
        ))}
      </div>
    </div>
  );
}
