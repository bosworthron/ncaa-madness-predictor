// src/app/api/predict/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTeam } from '@/lib/teams';
import { predictGame } from '@/lib/predict';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const team1Name = searchParams.get('team1');
  const team2Name = searchParams.get('team2');
  const spreadParam = searchParams.get('spread');
  const totalParam = searchParams.get('total');

  if (!team1Name || !team2Name) {
    return NextResponse.json(
      { error: 'missing_params', message: 'team1 and team2 are required' },
      { status: 400 }
    );
  }

  const team1 = getTeam(team1Name);
  const team2 = getTeam(team2Name);
  const missing: string[] = [];
  if (!team1) missing.push(team1Name);
  if (!team2) missing.push(team2Name);

  if (missing.length > 0) {
    return NextResponse.json(
      { error: 'team_not_found', missing },
      { status: 404 }
    );
  }

  const vegasSpread = spreadParam ? parseFloat(spreadParam) : 0;
  const vegasTotal = totalParam ? parseFloat(totalParam) : 150;

  const result = predictGame(team1!, team2!, vegasSpread, vegasTotal);
  return NextResponse.json(result);
}
