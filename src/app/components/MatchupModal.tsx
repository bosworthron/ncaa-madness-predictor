// src/app/components/MatchupModal.tsx
'use client';

import { GameCardData, StyleFlag } from '@/types';

const FLAG_DESCRIPTIONS: Record<StyleFlag, string> = {
  '3PT Exploit': 'One team is a heavy 3PT offense facing poor 3PT defense — expect variance, lean Over',
  'Tempo Clash': 'Teams have significantly different pace preferences (≥5 possession difference)',
  'Luck Regression': 'One team has been unlucky relative to their efficiency — expect regression toward the model',
  'Experience Edge': 'Significant experience gap in a close matchup — favor the veteran team',
};

interface StatRowProps {
  label: string;
  val1: number | null | undefined;
  val2: number | null | undefined;
  higherIsBetter?: boolean;
  suffix?: string;
}

function StatRow({ label, val1, val2, higherIsBetter = true, suffix = '' }: StatRowProps) {
  const v1 = val1 ?? 0;
  const v2 = val2 ?? 0;
  const team1Better = higherIsBetter ? v1 > v2 : v1 < v2;
  const team2Better = higherIsBetter ? v2 > v1 : v2 < v1;

  return (
    <tr className="border-b border-slate-700">
      <td className={`py-1.5 px-2 text-sm text-right ${team1Better ? 'text-green-400 font-bold' : 'text-white'}`}>
        {v1.toFixed(1)}{suffix}
      </td>
      <td className="py-1.5 px-2 text-xs text-slate-400 text-center">{label}</td>
      <td className={`py-1.5 px-2 text-sm text-left ${team2Better ? 'text-green-400 font-bold' : 'text-white'}`}>
        {v2.toFixed(1)}{suffix}
      </td>
    </tr>
  );
}

interface MatchupModalProps {
  data: GameCardData;
  onClose: () => void;
}

export default function MatchupModal({ data, onClose }: MatchupModalProps) {
  const { matchup, odds, prediction } = data;
  const s1 = prediction?.stats.team1;
  const s2 = prediction?.stats.team2;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-white font-bold text-lg">
                ({matchup.seed1}) {matchup.team1}
                <span className="text-slate-400 mx-2">vs</span>
                ({matchup.seed2}) {matchup.team2}
              </div>
              {odds && odds.spread !== null && (
                <div className="text-slate-400 text-sm mt-0.5">
                  Vegas: {matchup.team1} {odds.spread > 0 ? '+' : ''}{odds.spread} | O/U {odds.total}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Edge summary */}
          {prediction && (
            <div className="bg-slate-800 rounded-lg p-3 mb-4">
              <div className="text-slate-400 text-xs mb-1">Model vs Vegas</div>
              <div className="text-sm text-white">
                Spread: Model has {matchup.team1} by {Math.abs(prediction.modelSpread).toFixed(1)}{' '}
                vs Vegas {Math.abs(odds?.spread ?? 0).toFixed(1)} →{' '}
                <span className={prediction.spreadEdge >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {prediction.spreadEdge >= 0 ? '+' : ''}{prediction.spreadEdge.toFixed(1)} edge
                </span>
              </div>
              <div className="text-sm text-white mt-0.5">
                Total: Model {prediction.modelTotal.toFixed(0)} vs Vegas {odds?.total ?? '—'} →{' '}
                <span className={prediction.totalEdge >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {prediction.totalEdge >= 0 ? '+' : ''}{prediction.totalEdge.toFixed(1)} edge
                </span>
              </div>
            </div>
          )}

          {/* Stat comparison table */}
          {s1 && s2 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs font-bold text-slate-400 px-2 mb-1">
                <span>{matchup.team1}</span>
                <span>Stat</span>
                <span>{matchup.team2}</span>
              </div>
              <table className="w-full">
                <tbody>
                  <StatRow label="AdjEM" val1={s1.adjEM} val2={s2.adjEM} />
                  <StatRow label="AdjO" val1={s1.adjO} val2={s2.adjO} />
                  <StatRow label="AdjD" val1={s1.adjD} val2={s2.adjD} higherIsBetter={false} />
                  <StatRow label="Tempo" val1={s1.adjT} val2={s2.adjT} />
                  <StatRow label="3PT Mix%" val1={s1.o3ptDist} val2={s2.o3ptDist} />
                  <StatRow label="D-3PT Mix%" val1={s1.d3ptDist} val2={s2.d3ptDist} higherIsBetter={false} />
                  <StatRow label="Exp Rank" val1={s1.expRank} val2={s2.expRank} higherIsBetter={false} />
                  <StatRow label="Avg Height" val1={s1.avgHeight} val2={s2.avgHeight} suffix='"' />
                  <StatRow label="Luck" val1={s1.luck} val2={s2.luck} />
                </tbody>
              </table>
            </div>
          )}

          {/* Style flags */}
          {prediction && prediction.flags.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-400 mb-2">Signals</div>
              <div className="flex flex-col gap-1.5">
                {prediction.flags.map((flag) => (
                  <div key={flag} className="bg-slate-800 rounded p-2 text-sm text-slate-300">
                    <span className="mr-1.5">
                      {flag === '3PT Exploit' ? '🎯' : flag === 'Tempo Clash' ? '⚡' : flag === 'Luck Regression' ? '🍀' : '🎓'}
                    </span>
                    <span className="font-medium text-white">{flag}:</span>{' '}
                    {FLAG_DESCRIPTIONS[flag]}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
