// src/lib/simulate-boz.ts
// "Boz Model": lower KenPom rank always wins. margin = rank gap between teams.
import { getTeam } from './teams';
import { BracketData, BracketMatchup } from '@/types';
import { ProjectedTeam, ProjectedGame, RegionProjection, TournamentProjection } from '@/types/simulation';

function makeTeam(name: string, seed: number): ProjectedTeam {
  const stats = getTeam(name);
  return {
    name,
    seed,
    adjEM: stats?.adjEM ?? null,
    luck: stats?.luck ?? null,
    adjT: stats?.adjT ?? null,
    rank: stats?.rank ?? null,
  };
}

function simulateGame(t1: ProjectedTeam, t2: ProjectedTeam): ProjectedGame {
  const hasData = t1.rank !== null && t2.rank !== null;

  if (t1.rank !== null && t2.rank !== null) {
    // Lower rank number = better KenPom team = wins
    const gap = t2.rank - t1.rank;
    if (gap > 0) {
      return { team1: t1, team2: t2, winner: t1, loser: t2, margin: gap, hasData };
    } else {
      return { team1: t1, team2: t2, winner: t2, loser: t1, margin: Math.abs(gap), hasData };
    }
  }

  // Fallback: lower tournament seed wins
  if (t1.seed <= t2.seed) {
    return { team1: t1, team2: t2, winner: t1, loser: t2, margin: 0, hasData: false };
  }
  return { team1: t1, team2: t2, winner: t2, loser: t1, margin: 0, hasData: false };
}

function simulateRegion(name: string, matchups: BracketMatchup[]): RegionProjection {
  const r64 = matchups.map(m =>
    simulateGame(makeTeam(m.team1, m.seed1), makeTeam(m.team2, m.seed2))
  );

  const r32 = [
    simulateGame(r64[0].winner, r64[1].winner),
    simulateGame(r64[2].winner, r64[3].winner),
    simulateGame(r64[4].winner, r64[5].winner),
    simulateGame(r64[6].winner, r64[7].winner),
  ];

  const sweet16 = [
    simulateGame(r32[0].winner, r32[1].winner),
    simulateGame(r32[2].winner, r32[3].winner),
  ];

  const elite8 = simulateGame(sweet16[0].winner, sweet16[1].winner);

  return { name, r64, r32, sweet16, elite8, champion: elite8.winner };
}

export function simulateTournamentByRank(bracket: BracketData): TournamentProjection {
  const regions: Record<string, RegionProjection> = {};
  for (const [name, matchups] of Object.entries(bracket.regions)) {
    regions[name] = simulateRegion(name, matchups);
  }

  const eastChamp  = regions['East']?.champion    ?? { name: 'TBD', seed: 0, adjEM: null, luck: null, adjT: null, rank: null };
  const southChamp = regions['South']?.champion   ?? { name: 'TBD', seed: 0, adjEM: null, luck: null, adjT: null, rank: null };
  const westChamp  = regions['West']?.champion    ?? { name: 'TBD', seed: 0, adjEM: null, luck: null, adjT: null, rank: null };
  const midwestChamp = regions['Midwest']?.champion ?? { name: 'TBD', seed: 0, adjEM: null, luck: null, adjT: null, rank: null };

  const eastSouth   = simulateGame(eastChamp, southChamp);
  const westMidwest = simulateGame(westChamp, midwestChamp);
  const championship = simulateGame(eastSouth.winner, westMidwest.winner);

  return {
    regions,
    finalFour: { eastSouth, westMidwest },
    championship,
    champion: championship.winner,
  };
}
