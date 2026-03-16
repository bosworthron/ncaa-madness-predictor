// src/lib/__tests__/predict.test.ts
import { predictGame } from '../predict';

const duke = {
  rank: 1, conf: 'ACC', adjEM: 40.58, adjO: 128.3, adjD: 87.8, adjT: 65.4,
  luck: 0.03, sos: 13.97, o3ptDist: 25, o3ptDistRank: 80, d3ptDist: 22,
  d3ptDistRank: 30, o2ptDist: 45, o2ptDistRank: 50, oFTDist: 20,
  oFTDistRank: 150, dFTDist: 19, dFTDistRank: 180, avgHeight: 78.5,
  heightRank: 40, experience: 1.8, expRank: 80,
};

const alabama = {
  rank: 14, conf: 'SEC', adjEM: 26.17, adjO: 129.7, adjD: 103.5, adjT: 73.0,
  luck: 0.038, sos: 15.51, o3ptDist: 41.6, o3ptDistRank: 10, d3ptDist: 29.1,
  d3ptDistRank: 272, o2ptDist: 38.0, o2ptDistRank: 363, oFTDist: 20.4,
  oFTDistRank: 150, dFTDist: 19, dFTDistRank: 180, avgHeight: 78.2,
  heightRank: 60, experience: 2.03, expRank: 54,
};

describe('predictGame', () => {
  it('calculates spread as adjEM difference', () => {
    const result = predictGame(duke, alabama, -8.5, 154.0);
    // Duke adjEM 40.58 - Alabama adjEM 26.17 = 14.41
    expect(result.modelSpread).toBeCloseTo(14.41, 1);
  });

  it('calculates spread edge correctly', () => {
    // spreadEdge = modelSpread + vegasSpread = 14.41 + (-8.5) = 5.91
    const result = predictGame(duke, alabama, -8.5, 154.0);
    expect(result.spreadEdge).toBeCloseTo(5.91, 1);
  });

  it('includes vegasSpread and vegasTotal in result', () => {
    const result = predictGame(duke, alabama, -8.5, 154.0);
    expect(result.vegasSpread).toBe(-8.5);
    expect(result.vegasTotal).toBe(154.0);
  });

  it('calculates total using the spec worked example', () => {
    // Duke vs Alabama: avgT=69.2, Duke score=91.9, Alabama score=78.7, Total=170.6
    const result = predictGame(duke, alabama, -8.5, 154.0);
    expect(result.modelTotal).toBeCloseTo(170.6, 0);
  });

  it('flags 3PT Exploit when team shoots lots of 3s vs poor 3PT defense', () => {
    const badDef = { ...duke, d3ptDistRank: 290 };
    const result = predictGame(alabama, badDef, 8.5, 154.0);
    // Alabama o3ptDistRank=10 (heavy 3PT), badDef d3ptDistRank=290 (poor defense)
    expect(result.flags).toContain('3PT Exploit');
  });

  it('does not flag 3PT Exploit when 3PT defense is good', () => {
    // Alabama shoots lots of 3s (rank 10), Duke has good 3PT defense (rank 30)
    const result = predictGame(alabama, duke, 8.5, 154.0);
    expect(result.flags).not.toContain('3PT Exploit');
  });

  it('flags Tempo Clash when tempo difference >= 5', () => {
    // Duke AdjT=65.4, Alabama AdjT=73.0 — difference is 7.6
    const result = predictGame(duke, alabama, -8.5, 154.0);
    expect(result.flags).toContain('Tempo Clash');
  });

  it('does not flag Tempo Clash when tempo difference < 5', () => {
    const similar = { ...alabama, adjT: 67.0 };
    const result = predictGame(duke, similar, -8.5, 154.0);
    expect(result.flags).not.toContain('Tempo Clash');
  });

  it('flags Luck Regression when one team has luck < -0.03', () => {
    const unlucky = { ...alabama, luck: -0.05 };
    const result = predictGame(duke, unlucky, -8.5, 154.0);
    expect(result.flags).toContain('Luck Regression');
  });

  it('suppresses Luck Regression flag when both teams are unlucky', () => {
    const unluckyDuke = { ...duke, luck: -0.04 };
    const unluckyAlabama = { ...alabama, luck: -0.05 };
    const result = predictGame(unluckyDuke, unluckyAlabama, -8.5, 154.0);
    expect(result.flags).not.toContain('Luck Regression');
  });

  it('flags Experience Edge when expRank gap >= 100 and spread edge is close', () => {
    const inexperienced = { ...duke, expRank: 300 };
    // duke(inexperienced) expRank=300, alabama expRank=54, gap=246 >= 100
    // modelSpread = 40.58 - 26.17 = 14.41
    // vegasSpread = -12.41 → spreadEdge = 14.41 + (-12.41) = 2.0 < 3.0
    const result = predictGame(inexperienced, alabama, -12.41, 154.0);
    expect(result.flags).toContain('Experience Edge');
  });

  it('does not add 3PT Exploit twice even if both conditions match', () => {
    // Both directions trigger — flag should appear only once
    const heavy3pt = { ...duke, o3ptDistRank: 50, d3ptDistRank: 290 };
    const alsoHeavy3pt = { ...alabama, o3ptDistRank: 50, d3ptDistRank: 290 };
    const result = predictGame(heavy3pt, alsoHeavy3pt, 0, 150);
    const count = result.flags.filter(f => f === '3PT Exploit').length;
    expect(count).toBe(1);
  });
});
