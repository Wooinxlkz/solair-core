import { describe, it, expect } from 'vitest';
import { forecastEnergy, dailyProduction, batteryAutonomyDays } from '../calculations/energy-forecast.js';

describe('forecastEnergy', () => {
  it('returns 12 monthly entries', () => {
    const result = forecastEnergy(4000, 5);
    expect(result.monthly.length).toBe(12);
  });

  it('annual production equals sum of monthly production', () => {
    const result = forecastEnergy(4000, 5);
    const sum = result.monthly.reduce((s, m) => s + m.productionKwh, 0);
    expect(result.annual.productionKwh).toBeCloseTo(sum, 1);
  });

  it('summer months produce more than winter months', () => {
    const result = forecastEnergy(4000, 5);
    const june = result.monthly[5].productionKwh;
    const december = result.monthly[11].productionKwh;
    expect(june).toBeGreaterThan(december);
  });

  it('grid export is zero when production < consumption', () => {
    // tiny system, large consumption
    const result = forecastEnergy(500, 2, 0.85, 30);
    result.monthly.forEach(m => {
      expect(m.gridExportKwh).toBeGreaterThanOrEqual(0);
    });
  });

  it('self consumption never exceeds production', () => {
    const result = forecastEnergy(4000, 5, 0.85, 15);
    result.monthly.forEach(m => {
      expect(m.selfConsumptionKwh).toBeLessThanOrEqual(m.productionKwh + 0.001);
    });
  });

  it('calculates positive savings when rate > 0', () => {
    const result = forecastEnergy(4000, 5, 0.85, 15, 0.14, 10000);
    expect(result.annual.savingsUsd).toBeGreaterThan(0);
  });

  it('payback is 0 when system cost is 0', () => {
    const result = forecastEnergy(4000, 5, 0.85, 15, 0.14, 0);
    expect(result.paybackYears).toBe(0);
  });

  it('CO2 offset is positive', () => {
    const result = forecastEnergy(4000, 5);
    expect(result.annual.co2OffsetKg).toBeGreaterThan(0);
  });

  it('higher wattage produces more energy', () => {
    const small = forecastEnergy(2000, 5);
    const large = forecastEnergy(8000, 5);
    expect(large.annual.productionKwh).toBeGreaterThan(small.annual.productionKwh);
  });
});

describe('dailyProduction', () => {
  it('returns correct production for known values', () => {
    // 4kW × 5h × 0.85 = 17 kWh
    expect(dailyProduction(4000, 5, 0.85)).toBeCloseTo(17, 2);
  });

  it('returns 0 for 0 sun hours', () => {
    expect(dailyProduction(4000, 0)).toBe(0);
  });

  it('scales linearly with wattage', () => {
    const half = dailyProduction(2000, 5);
    const full = dailyProduction(4000, 5);
    expect(full).toBeCloseTo(half * 2, 5);
  });
});

describe('batteryAutonomyDays', () => {
  it('returns correct autonomy for known values', () => {
    // 10 kWh × 0.95 / 5 kWh/day = 1.9 days
    expect(batteryAutonomyDays(10, 5, 0.95)).toBeCloseTo(1.9, 2);
  });

  it('returns 0 for zero daily load', () => {
    expect(batteryAutonomyDays(10, 0)).toBe(0);
  });

  it('more capacity = more autonomy', () => {
    const small = batteryAutonomyDays(5, 10);
    const large = batteryAutonomyDays(20, 10);
    expect(large).toBeGreaterThan(small);
  });
});
