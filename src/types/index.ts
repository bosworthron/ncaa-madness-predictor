// src/types/index.ts

export interface TeamStats {
  rank: number;
  conf: string;
  adjEM: number;
  adjO: number;
  adjD: number;
  adjT: number;
  luck: number;
  sos: number;
  o3ptDist: number;
  o3ptDistRank: number;
  d3ptDist: number;
  d3ptDistRank: number;
  o2ptDist: number;
  o2ptDistRank: number;
  oFTDist: number;
  oFTDistRank: number;
  dFTDist: number;
  dFTDistRank: number;
  avgHeight: number;
  heightRank: number;
  experience: number;
  expRank: number;
}

export interface TeamsDB {
  [teamName: string]: TeamStats;
}

export interface BracketMatchup {
  seed1: number;
  team1: string;
  seed2: number;
  team2: string;
}

export interface BracketRegion {
  [region: string]: BracketMatchup[];
}

export interface BracketData {
  regions: BracketRegion;
}

export type StyleFlag =
  | '3PT Exploit'
  | 'Tempo Clash'
  | 'Luck Regression'
  | 'Experience Edge';

export interface PredictionResult {
  modelSpread: number;      // positive = team1 favored
  modelTotal: number;
  spreadEdge: number;       // positive = model thinks team1 undervalued by Vegas
  totalEdge: number;        // positive = model thinks total will be higher than Vegas
  vegasSpread: number;      // passed-in Vegas spread (negative = team1 favored)
  vegasTotal: number;       // passed-in Vegas total
  flags: StyleFlag[];
  stats: {
    team1: TeamStats;
    team2: TeamStats;
  };
}

export interface OddsGame {
  id: string;
  teamA: string;            // normalized to our team name (away team)
  teamB: string;            // normalized to our team name (home team)
  rawTeamA: string;         // as returned by Odds API (away)
  rawTeamB: string;         // as returned by Odds API (home)
  spread: number | null;    // from teamA's perspective: negative = teamA favored (e.g. -7.5 means teamA is 7.5-point favorite)
  total: number | null;
  commenceTime: string;
}

export interface GameCardData {
  matchup: BracketMatchup;
  odds: OddsGame | null;
  prediction: PredictionResult | null;
  oddsError?: string;
}
