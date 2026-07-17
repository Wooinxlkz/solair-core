import { describe, it, expect } from 'vitest';
import {
  calculateTemperatureAdjustedVoc,
  recommendSystem,
  DEFAULT_PREFERENCES,
} from '../calculations/solar-sizing.js';
import type { PVArrayConfig, SunConfig, ChargeControllerSpec, BatterySpec } from '../types.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const panel = {
  manufacturer: 'Jinko',
  model: 'Tiger Neo 400W',
  wattage: 400,
  voc: 37.8,
  vmp: 31.6,
  isc: 13.4,
  imp: 12.7,
  systemVoltage: '24V',
  temperatureCoefficient: -0.29,
};

const pvConfig: PVArrayConfig = { selectedPanel: panel, panelCount: 10 };
const sunConfig: SunConfig = { peakSunHoursPerDay: 5 };

const controller: ChargeControllerSpec = {
  manufacturer: 'Victron',
  model: 'SmartSolar 150/100',
  type: 'mppt',
  maxPvWattage: 5800,
  maxVoltage: 150,
  maxCurrent: 100,
  systemVoltage: '12V/24V/48V',
  efficiency: 98,
  warranty: 5,
  priceEur: 420,
  priceCategory: 'premium',
  temperatureCompensation: true,
};

const battery: BatterySpec = {
  manufacturer: 'Pylontech',
  model: 'US3000C',
  type: 'lfp',
  chemistry: 'LiFePO4',
  nominalVoltage: 48,
  capacityKwh: 3.5,
  usableCapacityKwh: 3.325,
  depthOfDischarge: 95,
  cycleLife: 6000,
  maxParallel: 8,
  warranty: 10,
  priceEur: 1100,
};

// ── calculateTemperatureAdjustedVoc ───────────────────────────────────────────

describe('calculateTemperatureAdjustedVoc', () => {
  it('returns voc unchanged at STC temperature (25°C)', () => {
    const result = calculateTemperatureAdjustedVoc(37.8, -0.29, 25);
    expect(result).toBeCloseTo(37.8, 2);
  });

  it('increases voc at cold temperatures', () => {
    const result = calculateTemperatureAdjustedVoc(37.8, -0.29, -10);
    expect(result).toBeGreaterThan(37.8);
  });

  it('increases proportionally with temperature delta', () => {
    const cold = calculateTemperatureAdjustedVoc(37.8, -0.29, -20);
    const mild = calculateTemperatureAdjustedVoc(37.8, -0.29, 0);
    expect(cold).toBeGreaterThan(mild);
  });

  it('handles zero temperature coefficient', () => {
    const result = calculateTemperatureAdjustedVoc(37.8, 0, -10);
    expect(result).toBe(37.8);
  });
});

// ── recommendSystem ───────────────────────────────────────────────────────────

describe('recommendSystem', () => {
  it('returns null when pvConfig is incomplete', () => {
    expect(
      recommendSystem({ selectedPanel: panel, panelCount: 0 }, sunConfig, [], []),
    ).toBeNull();
  });

  it('returns a valid system summary', () => {
    const result = recommendSystem(pvConfig, sunConfig, [controller], [battery]);
    expect(result).not.toBeNull();
    expect(result!.pvSummary.totalWattage).toBe(4000);
    expect(result!.pvSummary.panelCount).toBe(10);
  });

  it('calculates daily production correctly (with 0.85 derate)', () => {
    const result = recommendSystem(pvConfig, sunConfig, [], []);
    // 4000W × 5h × 0.85 / 1000 = 17 kWh
    expect(result!.pvSummary.dailyProductionKwh).toBeCloseTo(17, 1);
  });

  it('selects 24V system voltage for a 4kW array with 24V panels', () => {
    const result = recommendSystem(pvConfig, sunConfig, [], []);
    expect(result!.pvSummary.systemVoltage).toBe('24V');
  });

  it('selects 48V for arrays > 3kW', () => {
    const bigConfig: PVArrayConfig = { selectedPanel: { ...panel, systemVoltage: '12V' }, panelCount: 10 };
    const result = recommendSystem(bigConfig, sunConfig, [], []);
    expect(result!.pvSummary.systemVoltage).toBe('48V');
  });

  it('ranks controllers and returns up to 5', () => {
    const controllers = Array.from({ length: 8 }, (_, i) => ({
      ...controller,
      model: `Controller-${i}`,
      priceEur: 200 + i * 50,
    }));
    const result = recommendSystem(pvConfig, sunConfig, controllers, []);
    expect(result!.controllerRecommendations.length).toBeLessThanOrEqual(5);
  });

  it('excludes unsafe controllers (maxVoltage too low)', () => {
    const unsafe = { ...controller, maxVoltage: 10 }; // below panel Voc
    const result = recommendSystem(pvConfig, sunConfig, [unsafe], []);
    expect(result!.controllerRecommendations.length).toBe(0);
  });

  it('includes system insights', () => {
    const result = recommendSystem(pvConfig, sunConfig, [controller], [battery]);
    expect(result!.systemInsights.length).toBeGreaterThan(0);
  });

  it('respects brand preference', () => {
    const prefs = { ...DEFAULT_PREFERENCES, preferredBrands: ['Victron'] };
    const result = recommendSystem(pvConfig, sunConfig, [controller], [], prefs);
    const top = result!.controllerRecommendations[0];
    expect(top.matchReasons.some(r => r.includes('Victron'))).toBe(true);
  });

  it('temperature-adjusted Voc is higher than STC Voc in cold climates', () => {
    const prefs = { ...DEFAULT_PREFERENCES, ambientTempMin: -25 };
    const result = recommendSystem(pvConfig, sunConfig, [], [], prefs);
    expect(result!.pvSummary.temperatureAdjustedVoc).toBeGreaterThan(result!.pvSummary.voc);
  });
});
