// src/lib/predict.ts
import { TeamStats, PredictionResult, StyleFlag } from '@/types';
import { LEAGUE_AVG_D } from '@/lib/teams';

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
  // Average tempo (possessions per game) — needed for both spread and total
  const avgT = (team1.adjT + team2.adjT) / 2;

  // --- Spread ---
  // AdjEM is per 100 possessions. Scale to actual point margin using tempo.
  // Without this, a 30-pt AdjEM gap looks like a 30-pt model spread when
  // real games (~67 possessions) would produce ~20 pts — making every favorite
  // look undervalued and killing any meaningful edge signal.
  //
  // Luck adjustment: high-luck teams won more close games than efficiency predicts
  // and may regress; low-luck teams were unlucky and may be undervalued by Vegas.
  // Multiplier of 25: luck ±0.05 → ±1.25 AdjEM point adjustment.
  const LUCK_MULT = 25;
  const team1EM = team1.adjEM - team1.luck * LUCK_MULT;
  const team2EM = team2.adjEM - team2.luck * LUCK_MULT;

  const modelSpread = (team1EM - team2EM) * avgT / 100;

  // vegasSpread < 0 when team1 is favored.
  // spreadEdge > 0 means model thinks team1 is undervalued by Vegas (bet team1).
  // spreadEdge < 0 means model thinks team2 is undervalued (bet team2 +spread).
  const spreadEdge = modelSpread + vegasSpread;

  // --- Total ---
  // AdjO is points scored per 100 possessions.
  // AdjD is points allowed per 100 possessions vs average competition.
  // Our dataset's average AdjD is ~109.4 (not 100), so dividing by 100 treats a
  // below-average defense as a multiplier >1 — double-inflating the total.
  // Normalizing by LEAGUE_AVG_D corrects this, bringing model totals in line
  // with Vegas O/U (~145-150 for tournament games).
  const team1Score = team1.adjO * (team2.adjD / LEAGUE_AVG_D) * avgT / 100;
  const team2Score = team2.adjO * (team1.adjD / LEAGUE_AVG_D) * avgT / 100;
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

  // Size Mismatch: significant height rank gap in a close game
  // heightRank 1 = tallest; gap ≥ 100 ranks = meaningful size advantage
  if (Math.abs(team1.heightRank - team2.heightRank) >= 100 && Math.abs(spreadEdge) < 5) {
    flagSet.add('Size Mismatch');
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
