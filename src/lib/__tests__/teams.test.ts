import { getTeam } from '../teams';
import { normalizeTeamName } from '../normalize';

describe('getTeam', () => {
  it('returns stats for a known team', () => {
    const alabama = getTeam('Alabama');
    expect(alabama).not.toBeNull();
    expect(alabama!.adjEM).toBeGreaterThan(20);
    expect(alabama!.adjO).toBeGreaterThan(120);
    expect(alabama!.adjD).toBeLessThan(110);
  });

  it('returns null for unknown team', () => {
    expect(getTeam('Fake University')).toBeNull();
  });
});

describe('normalizeTeamName', () => {
  it('maps known Odds API names to our keys', () => {
    expect(normalizeTeamName('Alabama Crimson Tide')).toBe('Alabama');
    expect(normalizeTeamName('Iowa State Cyclones')).toBe('Iowa St.');
    expect(normalizeTeamName('Michigan State Spartans')).toBe('Michigan St.');
    expect(normalizeTeamName('UConn Huskies')).toBe('Connecticut');
  });

  it('returns null for unknown names', () => {
    expect(normalizeTeamName('Nonexistent Team FC')).toBeNull();
  });
});
