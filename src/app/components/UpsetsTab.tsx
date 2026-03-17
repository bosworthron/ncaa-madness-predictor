'use client';

import { BracketData } from '@/types';
import { TournamentProjection, ProjectedGame } from '@/types/simulation';

interface Props {
  bracket: BracketData;
  bartekProjection: TournamentProjection;
  bozProjection: TournamentProjection;
  leoProjection: TournamentProjection;
}

function isUpset(game: ProjectedGame) {
  return game.winner.seed > game.loser.seed;
}

function seedColor(seed: number) {
  if (seed === 1) return 'text-yellow-400';
  if (seed <= 3) return 'text-green-400';
  if (seed <= 5) return 'text-emerald-400';
  return 'text-slate-300';
}

function ModelBadge({ label, active }: { label: string; active: boolean }) {
  if (active) {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
        {label}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-600 border border-slate-700">
      {label}
    </span>
  );
}

// ── Round of 64 cross-model analysis ─────────────────────────────────────────

interface R64Upset {
  region: string;
  underdog: { name: string; seed: number };
  favorite: { name: string; seed: number };
  bartek: boolean;
  boz: boolean;
  leo: boolean;
}

function buildR64Upsets(
  bracket: BracketData,
  bartek: TournamentProjection,
  boz: TournamentProjection,
  leo: TournamentProjection,
): R64Upset[] {
  const results: R64Upset[] = [];

  for (const region of ['East', 'South', 'West', 'Midwest']) {
    const matchups = bracket.regions[region] ?? [];
    matchups.forEach((_, i) => {
      const bg = bartek.regions[region]?.r64[i];
      const bzg = boz.regions[region]?.r64[i];
      const lg = leo.regions[region]?.r64[i];
      if (!bg || !bzg || !lg) return;

      // Determine which team is the underdog (higher seed number)
      const t1 = bg.team1;
      const t2 = bg.team2;
      const underdog = t1.seed > t2.seed ? t1 : t2;
      const favorite = t1.seed > t2.seed ? t2 : t1;

      const bartekUpset = bg.winner.name === underdog.name;
      const bozUpset = bzg.winner.name === underdog.name;
      const leoUpset = lg.winner.name === underdog.name;

      if (bartekUpset || bozUpset || leoUpset) {
        results.push({ region, underdog, favorite, bartek: bartekUpset, boz: bozUpset, leo: leoUpset });
      }
    });
  }

  return results;
}

function R64UpsetRow({ upset }: { upset: R64Upset }) {
  const count = [upset.bartek, upset.boz, upset.leo].filter(Boolean).length;
  const allThree = count === 3;

  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-slate-700/40 last:border-0 ${allThree ? 'bg-amber-500/5 -mx-3 px-3 rounded' : ''}`}>
      <div className="flex-1 min-w-0">
        <span className={`font-bold text-sm ${seedColor(upset.underdog.seed)}`}>
          ({upset.underdog.seed}) {upset.underdog.name}
        </span>
        <span className="text-slate-500 text-xs mx-2">upsets</span>
        <span className="text-slate-400 text-sm">({upset.favorite.seed}) {upset.favorite.name}</span>
        <span className="text-slate-600 text-xs ml-2">{upset.region}</span>
      </div>
      <div className="flex gap-1 shrink-0">
        <ModelBadge label="Bartek" active={upset.bartek} />
        <ModelBadge label="Boz" active={upset.boz} />
        <ModelBadge label="Leo" active={upset.leo} />
      </div>
    </div>
  );
}

// ── Later rounds: collect per-model upsets ───────────────────────────────────

interface LaterUpset {
  round: string;
  game: ProjectedGame;
}

function collectLaterUpsets(proj: TournamentProjection): LaterUpset[] {
  const upsets: LaterUpset[] = [];

  for (const region of ['East', 'South', 'West', 'Midwest']) {
    const r = proj.regions[region];
    if (!r) continue;
    r.r32.forEach(g => { if (isUpset(g)) upsets.push({ round: 'Round of 32', game: g }); });
    r.sweet16.forEach(g => { if (isUpset(g)) upsets.push({ round: 'Sweet 16', game: g }); });
    if (isUpset(r.elite8)) upsets.push({ round: 'Elite 8', game: r.elite8 });
  }

  if (isUpset(proj.finalFour.eastSouth)) upsets.push({ round: 'Final Four', game: proj.finalFour.eastSouth });
  if (isUpset(proj.finalFour.westMidwest)) upsets.push({ round: 'Final Four', game: proj.finalFour.westMidwest });
  if (isUpset(proj.championship)) upsets.push({ round: 'Championship', game: proj.championship });

  return upsets;
}

function LaterUpsetRow({ entry }: { entry: LaterUpset }) {
  const { round, game } = entry;
  return (
    <div className="py-2 border-b border-slate-700/40 last:border-0">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{round}</div>
      <div className="text-sm">
        <span className={`font-bold ${seedColor(game.winner.seed)}`}>
          ({game.winner.seed}) {game.winner.name}
        </span>
        <span className="text-slate-500 mx-1.5 text-xs">over</span>
        <span className="text-slate-400">({game.loser.seed}) {game.loser.name}</span>
      </div>
    </div>
  );
}

function LaterRoundsColumn({
  label,
  upsets,
}: {
  label: string;
  upsets: LaterUpset[];
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{label}</div>
      {upsets.length === 0 ? (
        <p className="text-slate-600 text-xs">No later-round upsets projected</p>
      ) : (
        upsets.map((e, i) => <LaterUpsetRow key={i} entry={e} />)
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UpsetsTab({ bracket, bartekProjection, bozProjection, leoProjection }: Props) {
  const r64Upsets = buildR64Upsets(bracket, bartekProjection, bozProjection, leoProjection);
  const consensusCount = r64Upsets.filter(u => u.bartek && u.boz && u.leo).length;

  const bartekLater = collectLaterUpsets(bartekProjection);
  const bozLater    = collectLaterUpsets(bozProjection);
  const leoLater    = collectLaterUpsets(leoProjection);

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-5 text-xs text-slate-500">
        <span>Showing games where ≥1 model predicts an upset (higher seed wins)</span>
        {consensusCount > 0 && (
          <span className="text-amber-400 font-bold">{consensusCount} unanimous upset{consensusCount !== 1 ? 's' : ''} across all 3 models</span>
        )}
      </div>

      {/* Round of 64 */}
      <div className="mb-8">
        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">
          Round of 64 — Cross-Model Upset Picks ({r64Upsets.length} games)
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-1">
          {r64Upsets.length === 0 ? (
            <p className="text-slate-500 text-sm py-3">All models agree with seeding — no R64 upsets projected.</p>
          ) : (
            r64Upsets.map((u, i) => <R64UpsetRow key={i} upset={u} />)
          )}
        </div>
      </div>

      {/* Later rounds by model */}
      <div>
        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">
          Later Round Upsets by Model (R32 → Championship)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <LaterRoundsColumn label="Bartek Model" upsets={bartekLater} />
          <LaterRoundsColumn label="Boz Model"    upsets={bozLater} />
          <LaterRoundsColumn label="Leo Model"    upsets={leoLater} />
        </div>
      </div>
    </div>
  );
}
