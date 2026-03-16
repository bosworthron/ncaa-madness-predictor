// scripts/parse-excel.js
// Run once: node scripts/parse-excel.js
// Outputs: data/teams.json

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const XLSX_PATH = path.join(__dirname, '..', '2026 CBB March Madness data file.xlsx');
const OUT_PATH = path.join(__dirname, '..', 'data', 'teams.json');

function parseSheet(wb, name) {
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`Sheet not found: "${name}"`);
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
}

const wb = XLSX.readFile(XLSX_PATH);

// --- KP Data sheet ---
// Columns (0-based): Team=0, Rk=1, Conf=2, W=3, L=4, NetRtg=5, ORtg=6, OrtgRK=7, DRtg=8, DRtgRK=9,
//                    AdjT=10, AdjTRK=11, Luck=12, LuckRK=13, SOSNetRtg=14
const kpRows = parseSheet(wb, 'KP Data');
const KP_TEAM = 0, KP_RK = 1, KP_CONF = 2, KP_NET = 5, KP_ORTG = 6, KP_DRTG = 8,
      KP_ADJT = 10, KP_LUCK = 12, KP_SOS = 14;

const kpMap = {};
for (let i = 1; i < kpRows.length; i++) {
  const r = kpRows[i];
  if (!r[KP_TEAM]) continue;
  kpMap[r[KP_TEAM]] = {
    rank:  r[KP_RK],
    conf:  r[KP_CONF],
    adjEM: r[KP_NET],
    adjO:  r[KP_ORTG],
    adjD:  r[KP_DRTG],
    adjT:  r[KP_ADJT],
    luck:  r[KP_LUCK],
    sos:   r[KP_SOS],
  };
}

// --- PT Dist. sheet ---
// Headers (0-based): Team=0, Conf=1, O FT %=2, O FT % Rk=3, O 2PT FG=4, O 2PT FG % RK=5,
//                    O 3PT FG %=6, O 3PT FG % RK=7, D FT %=8, D FT % Rk=9,
//                    D 2PT FG=10, D 2PT FG % RK=11, D 3PT FG %=12, D 3PT FG % RK=13
const ptRows = parseSheet(wb, 'PT Dist.');
const PT_TEAM = 0, PT_O3PT = 6, PT_O3PT_RK = 7, PT_D3PT = 12, PT_D3PT_RK = 13,
      PT_O2PT = 4, PT_O2PT_RK = 5, PT_OFT = 2, PT_OFT_RK = 3, PT_DFT = 8, PT_DFT_RK = 9;

const ptMap = {};
for (let i = 1; i < ptRows.length; i++) {
  const r = ptRows[i];
  if (!r[PT_TEAM]) continue;
  ptMap[r[PT_TEAM]] = {
    o3ptDist:     r[PT_O3PT],
    o3ptDistRank: r[PT_O3PT_RK],
    d3ptDist:     r[PT_D3PT],
    d3ptDistRank: r[PT_D3PT_RK],
    o2ptDist:     r[PT_O2PT],
    o2ptDistRank: r[PT_O2PT_RK],
    oFTDist:      r[PT_OFT],
    oFTDistRank:  r[PT_OFT_RK],
    dFTDist:      r[PT_DFT],
    dFTDistRank:  r[PT_DFT_RK],
  };
}

// --- Hgt & Exp sheet ---
// Columns (0-based): Team=0, Avg Hgt=2, Avg Hgt Rk=3, Experience=16, Exp. RK=17
const hgtRows = parseSheet(wb, 'Hgt & Exp');
const HGT_TEAM = 0, HGT_HGT = 2, HGT_HGT_RK = 3, HGT_EXP = 16, HGT_EXP_RK = 17;

const hgtMap = {};
for (let i = 1; i < hgtRows.length; i++) {
  const r = hgtRows[i];
  if (!r[HGT_TEAM]) continue;
  hgtMap[r[HGT_TEAM]] = {
    avgHeight:  r[HGT_HGT],
    heightRank: r[HGT_HGT_RK],
    experience: r[HGT_EXP],
    expRank:    r[HGT_EXP_RK],
  };
}

// --- Merge ---
const teams = {};
for (const team of Object.keys(kpMap)) {
  teams[team] = {
    ...kpMap[team],
    ...(ptMap[team] || {}),
    ...(hgtMap[team] || {}),
  };
}

fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(teams, null, 2));
console.log(`Written ${Object.keys(teams).length} teams to ${OUT_PATH}`);
