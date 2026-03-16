import aliasesRaw from '../../data/team-aliases.json';

const aliases = aliasesRaw as Record<string, string>;

/**
 * Normalize an Odds API team name to our teams.json key.
 * Returns null if no mapping found.
 */
export function normalizeTeamName(oddsName: string): string | null {
  if (aliases[oddsName]) return aliases[oddsName];
  // Try trimming common suffixes as a fallback
  const withoutNickname = oddsName.replace(
    /\s+(Crimson Tide|Wildcats|Bulldogs|Tigers|Gators|Bears|Eagles|Hawks|Owls|Rams|Lions|Panthers|Wolves|Cougars|Aggies|Trojans|Broncos|Horned Frogs|Volunteers|Buckeyes|Badgers|Spartans|Wolverines|Ducks|Beavers|Utes|Bruins|Cardinal|Buffaloes|Falcons|Mustangs|Cowboys|Raiders|Lobos|Miners|Matadors|49ers|Roadrunners|Anteaters|Highlanders|Tritons|Gauchos|Banana Slugs)$/i,
    ''
  ).trim();
  if (aliases[withoutNickname]) return aliases[withoutNickname];
  return null;
}
