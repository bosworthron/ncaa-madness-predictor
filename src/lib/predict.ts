// src/lib/predict.ts
import { TeamStats, PredictionResult, StyleFlag } from '@/types';

/**
 * Predict the outcome of a neutral-site game.
 *
 * Convention: vegasSpread is from team1's perspective.
 *   Negative = team1 is favored (e.g. -8.5 means team1 is a 8.5-point favorite).
 *   Positive spreadEdge = model thinks team1 is even more favored than Vegas does.
 *
 * @param team1 - Team listed first in the bracket matchup
 * @param team2 - Opponent
 * @param vegasSpread - Vegas spread from team1's perspective (negative = team1 favored)
 * @param vegasTotal - Vegas over/under
 */
export function predictGame(
  team1: TeamStats,
  team2: TeamStats,
  vegasSpread: number,
  vegasTotal: number
): PredictionResult {
  // --- Spread ---
  // modelSpread > 0 means team1 is favored by that many points.
  const modelSpread = team1.adjEM - team2.adjEM;

  // vegasSpread < 0 when team1 is favored (e.g. -8.5).
  // spreadEdge = modelSpread + vegasSpread
  // Example: modelSpread=14.41, vegasSpread=-8.5 → spreadEdge = 14.41 + (-8.5) = 5.91
  const spreadEdge = modelSpread + vegasSpread;

  // --- Total ---
  // AdjO and AdjD are in points per 100 possessions.
  // Scale to per-game using the average of both teams' tempo.
  const avgT = (team1.adjT + team2.adjT) / 2;
  const team1Score = (team1.adjO * team2.adjD / 100) * avgT / 100;
  const team2Score = (team2.adjO * team1.adjD / 100) * avgT / 100;
  const modelTotal = team1Score + team2Score;
  const totalEdge = modelTotal - vegasTotal;

  // --- Style flags (deduplicated via Set) ---
  const flagSet = new Set<StyleFlag>();

  // 3PT Exploit: either team is a heavy 3PT offense facing poor 3PT defense
  if (team1.o3ptDistRank <= 75 && team2.d3ptDistRank >= 275) {
    flagSet.add('3PT Exploit');
  }
  if (team2.o3ptDistRank <= 75 && team1.d3ptDistRank >= 275) {
    flagSet.add('3PT Exploit');
  }

  // Tempo Clash: significant pace mismatch
  if (Math.abs(team1.adjT - team2.adjT) >= 5) {
    flagSet.add('Tempo Clash');
  }

  // Luck Regression: exactly one team is unlucky (suppress if both qualify)
  const team1Unlucky = team1.luck < -0.03;
  const team2Unlucky = team2.luck < -0.03;
  if ((team1Unlucky || team2Unlucky) && !(team1Unlucky && team2Unlucky)) {
    flagSet.add('Luck Regression');
  }

  // Experience Edge: large experience gap in a close matchup (|spreadEdge| < 3.0)
  const expGap = Math.abs(team1.expRank - team2.expRank);
  if (expGap >= 100 && Math.abs(spreadEdge) < 3.0) {
    flagSet.add('Experience Edge');
  }

  return {
    modelSpread,
    modelTotal,
    spreadEdge,
    totalEdge,
    vegasSpread,
    vegasTotal,
    flags: Array.from(flagSet),
    stats: { team1, team2 },
  };
}
