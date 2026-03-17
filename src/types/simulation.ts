export interface ProjectedTeam {
  name: string;
  seed: number;
  adjEM: number | null;
  luck: number | null;
  adjT: number | null;
  rank: number | null;   // KenPom ranking (1 = best)
}

export interface ProjectedGame {
  team1: ProjectedTeam;
  team2: ProjectedTeam;
  winner: ProjectedTeam;
  loser: ProjectedTeam;
  margin: number; // tempo-scaled, luck-adjusted point margin; 0 if data missing
  hasData: boolean; // true only if both teams have AdjEM
}

export interface RegionProjection {
  name: string;
  r64: ProjectedGame[]; // 8 games
  r32: ProjectedGame[]; // 4 games
  sweet16: ProjectedGame[]; // 2 games
  elite8: ProjectedGame; // 1 game
  champion: ProjectedTeam;
}

export interface TournamentProjection {
  regions: Record<string, RegionProjection>;
  finalFour: {
    eastSouth: ProjectedGame; // East champion vs South champion
    westMidwest: ProjectedGame; // West champion vs Midwest champion
  };
  championship: ProjectedGame;
  champion: ProjectedTeam;
}
