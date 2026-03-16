import { getTeam } from './teams';
import { BracketData, BracketMatchup } from '@/types';
import { ProjectedTeam, ProjectedGame, RegionProjection, TournamentProjection } from '@/types/simulation';

function makeTeam(name: string, seed: number): ProjectedTeam {
  const stats = getTeam(name);
  return { name, seed, adjEM: stats?.adjEM ?? null };
}

function simulateGame(t1: ProjectedTeam, t2: ProjectedTeam): ProjectedGame {
  const hasData = t1.adjEM !== null && t2.adjEM !== null;
  let winner: ProjectedTeam;
  let loser: ProjectedTeam;
  let margin = 0;

  if (t1.adjEM !== null && t2.adjEM !== null) {
    const diff = t1.adjEM - t2.adjEM;
    if (diff >= 0) {
      winner = t1; loser = t2; margin = diff;
    } else {
      winner = t2; loser = t1; margin = Math.abs(diff);
    }
  } else if (t1.adjEM !== null) {
    winner = t1; loser = t2;
  } else if (t2.adjEM !== null) {
    winner = t2; loser = t1;
  } else {
    // Both unknown: favor lower seed number
    if (t1.seed <= t2.seed) {
      winner = t1; loser = t2;
    } else {
      winner = t2; loser = t1;
    }
  }

  return { team1: t1, team2: t2, winner, loser, margin, hasData };
}

function simulateRegion(name: string, matchups: BracketMatchup[]): RegionProjection {
  // R64: 8 first-round games
  const r64 = matchups.map(m =>
    simulateGame(makeTeam(m.team1, m.seed1), makeTeam(m.team2, m.seed2))
  );

  // R32: pairs are [0 vs 1], [2 vs 3], [4 vs 5], [6 vs 7]
  const r32 = [
    simulateGame(r64[0].winner, r64[1].winner),
    simulateGame(r64[2].winner, r64[3].winner),
    simulateGame(r64[4].winner, r64[5].winner),
    simulateGame(r64[6].winner, r64[7].winner),
  ];

  // Sweet 16: [r32[0] winner vs r32[1] winner], [r32[2] winner vs r32[3] winner]
  const sweet16 = [
    simulateGame(r32[0].winner, r32[1].winner),
    simulateGame(r32[2].winner, r32[3].winner),
  ];

  // Elite 8: one game
  const elite8 = simulateGame(sweet16[0].winner, sweet16[1].winner);

  return { name, r64, r32, sweet16, elite8, champion: elite8.winner };
}

export function simulateTournament(bracket: BracketData): TournamentProjection {
  const regions: Record<string, RegionProjection> = {};
  for (const [name, matchups] of Object.entries(bracket.regions)) {
    regions[name] = simulateRegion(name, matchups);
  }

  // Final Four pairings: East vs South, West vs Midwest
  const eastChamp = regions['East']?.champion ?? { name: 'TBD', seed: 0, adjEM: null };
  const southChamp = regions['South']?.champion ?? { name: 'TBD', seed: 0, adjEM: null };
  const westChamp = regions['West']?.champion ?? { name: 'TBD', seed: 0, adjEM: null };
  const midwestChamp = regions['Midwest']?.champion ?? { name: 'TBD', seed: 0, adjEM: null };

  const eastSouth = simulateGame(eastChamp, southChamp);
  const westMidwest = simulateGame(westChamp, midwestChamp);
  const championship = simulateGame(eastSouth.winner, westMidwest.winner);

  return {
    regions,
    finalFour: { eastSouth, westMidwest },
    championship,
    champion: championship.winner,
  };
}
