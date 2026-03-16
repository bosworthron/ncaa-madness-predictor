import teamsRaw from '../../data/teams.json';
import { TeamsDB, TeamStats } from '@/types';

const teamsDB = teamsRaw as TeamsDB;

export function getTeam(name: string): TeamStats | null {
  return teamsDB[name] ?? null;
}

export function getAllTeams(): TeamsDB {
  return teamsDB;
}
