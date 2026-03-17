import teamsRaw from '../../data/teams.json';
import { TeamsDB, TeamStats } from '@/types';

const teamsDB = teamsRaw as TeamsDB;

// The league-average AdjD in our dataset is ~109.4, not 100 (not standard KenPom calibration).
// Used in predict.ts to correctly normalize opponent defensive efficiency.
const allTeams = Object.values(teamsDB) as TeamStats[];
export const LEAGUE_AVG_D = allTeams.reduce((s, t) => s + t.adjD, 0) / allTeams.length;

export function getTeam(name: string): TeamStats | null {
  return teamsDB[name] ?? null;
}

export function getAllTeams(): TeamsDB {
  return teamsDB;
}
