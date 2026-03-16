'use client';

import { TournamentProjection, ProjectedGame, ProjectedTeam, RegionProjection } from '@/types/simulation';

function seedColor(seed: number) {
  if (seed === 1) return 'text-yellow-400';
  if (seed <= 3) return 'text-green-400';
  if (seed <= 5) return 'text-emerald-400';
  return 'text-slate-400';
}

function MarginBadge({ margin, hasData }: { margin: number; hasData: boolean }) {
  if (!hasData) return <span className="text-xs text-slate-600">?</span>;
  const color = margin >= 8 ? 'text-green-400' : margin >= 4 ? 'text-amber-400' : 'text-red-400';
  return <span className={`text-xs font-bold ${color}`}>+{margin.toFixed(1)}</span>;
}

function GameLine({ game }: { game: ProjectedGame }) {
  return (
    <div className="py-1 border-b border-slate-700/40 last:border-0">
      <div className="flex items-center justify-between">
        <span className="text-white text-xs">
          <span className={`${seedColor(game.winner.seed)} mr-1`}>({game.winner.seed})</span>
          <span className="font-medium">{game.winner.name}</span>
        </span>
        <MarginBadge margin={game.margin} hasData={game.hasData} />
      </div>
      <div className="text-slate-600 text-xs">
        def. ({game.loser.seed}) {game.loser.name}
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
        {champ.adjEM !== null && (
          <span className="text-xs text-slate-500">AdjEM {champ.adjEM.toFixed(1)}</span>
        )}
      </div>

      {/* Champion */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
        <div className="text-xs text-amber-400 font-bold uppercase tracking-wide mb-0.5">Regional Winner</div>
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
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
      <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="text-white text-sm font-bold">
            <span className={`${seedColor(game.winner.seed)} mr-1`}>({game.winner.seed})</span>
            {game.winner.name}
          </div>
          <div className="text-slate-500 text-xs mt-0.5">
            def. ({game.loser.seed}) {game.loser.name}
            {game.hasData && <span className="text-amber-400 ml-1">+{game.margin.toFixed(1)}</span>}
          </div>
        </div>
        <div className="text-xs text-slate-600">Championship</div>
      </div>
    </div>
  );
}

interface BracketProjectionProps {
  projection: TournamentProjection;
}

export default function BracketProjection({ projection }: BracketProjectionProps) {
  const { regions, finalFour, championship, champion } = projection;

  return (
    <div>
      {/* Champion hero */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-8 text-center">
        <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Projected Champion</div>
        <div className="text-white text-3xl font-bold mb-1">
          ({champion.seed}) {champion.name}
        </div>
        {champion.adjEM !== null && (
          <div className="text-slate-400 text-sm">AdjEM {champion.adjEM.toFixed(1)}</div>
        )}
        {championship.hasData && (
          <div className="text-slate-400 text-xs mt-2">
            Championship margin: +{championship.margin.toFixed(1)} over ({championship.loser.seed}) {championship.loser.name}
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
