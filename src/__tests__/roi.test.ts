import { describe, it, expect } from 'vitest';
import { calculateROI, calculateLCOE, estimateSystemSize } from '../calculations/roi.js';

describe('calculateROI', () => {
  const base = {
    systemCostUsd: 12000,
    annualProductionKwh: 6000,
    electricityRateUsdPerKwh: 0.14,
  };

  it('calculates positive ROI for a standard system', () => {
    const result = calculateROI(base);
    expect(result.roi).toBeGreaterThan(0);
  });

  it('applies incentive percent to reduce net cost', () => {
    const without = calculateROI(base);
    const with30 = calculateROI({ ...base, incentivePercent: 30 });
    expect(with30.netSystemCost).toBeLessThan(without.netSystemCost);
    expect(with30.netSystemCost).toBeCloseTo(12000 * 0.7, 1);
  });

  it('shorter payback with higher electricity rate', () => {
    const lowRate = calculateROI({ ...base, electricityRateUsdPerKwh: 0.10 });
    const highRate = calculateROI({ ...base, electricityRateUsdPerKwh: 0.25 });
    expect(highRate.paybackYears).toBeLessThan(lowRate.paybackYears);
  });

  it('break-even year is within system lifetime', () => {
    const result = calculateROI({ ...base, systemLifeYears: 25 });
    expect(result.breakEvenYear).toBeLessThanOrEqual(25);
  });

  it('lifetime savings exceeds net system cost for profitable system', () => {
    const result = calculateROI(base);
    expect(result.lifetimeSavings).toBeGreaterThan(result.netSystemCost);
  });

  it('annual savings equals production × rate', () => {
    const result = calculateROI(base);
    expect(result.annualSavings).toBeCloseTo(6000 * 0.14, 0);
  });

  it('returns 0 payback when annual savings is 0', () => {
    const result = calculateROI({ ...base, electricityRateUsdPerKwh: 0 });
    expect(result.paybackYears).toBe(0);
  });

  it('degradation reduces lifetime savings over time', () => {
    const noDeg = calculateROI({ ...base, annualDegradationRate: 0 });
    const withDeg = calculateROI({ ...base, annualDegradationRate: 0.01 });
    expect(noDeg.lifetimeSavings).toBeGreaterThan(withDeg.lifetimeSavings);
  });
});

describe('calculateLCOE', () => {
  it('returns positive LCOE', () => {
    const lcoe = calculateLCOE(12000, 150000);
    expect(lcoe).toBeGreaterThan(0);
  });

  it('returns 0 for zero lifetime production', () => {
    expect(calculateLCOE(12000, 0)).toBe(0);
  });

  it('higher production reduces LCOE', () => {
    const low = calculateLCOE(12000, 50000);
    const high = calculateLCOE(12000, 200000);
    expect(high).toBeLessThan(low);
  });

  it('includes maintenance costs in calculation', () => {
    const noMaintenance = calculateLCOE(12000, 150000, 0);
    const withMaintenance = calculateLCOE(12000, 150000, 300);
    expect(withMaintenance).toBeGreaterThan(noMaintenance);
  });
});

describe('estimateSystemSize', () => {
  it('returns positive kW for valid inputs', () => {
    const size = estimateSystemSize(150, 0.14, 4.5);
    expect(size).toBeGreaterThan(0);
  });

  it('higher bill requires larger system', () => {
    const small = estimateSystemSize(100, 0.14, 4.5);
    const large = estimateSystemSize(300, 0.14, 4.5);
    expect(large).toBeGreaterThan(small);
  });

  it('more sun hours require smaller system', () => {
    const lessSun = estimateSystemSize(150, 0.14, 3);
    const moreSun = estimateSystemSize(150, 0.14, 6);
    expect(moreSun).toBeLessThan(lessSun);
  });
});
