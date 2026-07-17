import { describe, it, expect } from 'vitest';
import { convertMeasurement, getUnitSymbol, formatWithUnit, formatWeight } from '../utils/units.js';

describe('convertMeasurement', () => {
  it('returns same value when units match', () => {
    expect(convertMeasurement(10, 'area', 'metric', 'metric')).toBe(10);
  });

  it('converts m² to ft² correctly', () => {
    expect(convertMeasurement(1, 'area', 'metric', 'imperial')).toBeCloseTo(10.7639, 3);
  });

  it('converts ft² to m² correctly', () => {
    expect(convertMeasurement(10.7639, 'area', 'imperial', 'metric')).toBeCloseTo(1, 2);
  });

  it('converts Celsius to Fahrenheit', () => {
    expect(convertMeasurement(0, 'temperature', 'metric', 'imperial')).toBeCloseTo(32, 1);
    expect(convertMeasurement(100, 'temperature', 'metric', 'imperial')).toBeCloseTo(212, 1);
  });

  it('converts Fahrenheit to Celsius', () => {
    expect(convertMeasurement(32, 'temperature', 'imperial', 'metric')).toBeCloseTo(0, 1);
    expect(convertMeasurement(212, 'temperature', 'imperial', 'metric')).toBeCloseTo(100, 1);
  });

  it('energy is the same in both systems (kWh)', () => {
    expect(convertMeasurement(5, 'energy', 'metric', 'imperial')).toBe(5);
  });

  it('converts kg to lbs', () => {
    expect(convertMeasurement(1, 'weight', 'metric', 'imperial')).toBeCloseTo(2.20462, 3);
  });

  it('converts lbs to kg', () => {
    expect(convertMeasurement(2.20462, 'weight', 'imperial', 'metric')).toBeCloseTo(1, 2);
  });
});

describe('getUnitSymbol', () => {
  it('returns correct metric symbols', () => {
    expect(getUnitSymbol('area', 'metric')).toBe('m²');
    expect(getUnitSymbol('temperature', 'metric')).toBe('°C');
    expect(getUnitSymbol('weight', 'metric')).toBe('kg');
  });

  it('returns correct imperial symbols', () => {
    expect(getUnitSymbol('area', 'imperial')).toBe('ft²');
    expect(getUnitSymbol('temperature', 'imperial')).toBe('°F');
    expect(getUnitSymbol('weight', 'imperial')).toBe('lb');
  });
});

describe('formatWithUnit', () => {
  it('formats with correct precision and symbol', () => {
    expect(formatWithUnit(5.123, 'energy', 'metric', 1)).toBe('5.1 kWh');
  });

  it('defaults to 2 decimal places', () => {
    expect(formatWithUnit(10, 'area', 'metric')).toBe('10.00 m²');
  });
});

describe('formatWeight', () => {
  it('converts pounds to kg string in metric mode', () => {
    // 10 lbs ≈ 4.54 kg
    const result = formatWeight(10, 'metric', 2);
    expect(result).toContain('kg');
    expect(result).toContain('4.54');
  });

  it('keeps pounds in imperial mode', () => {
    const result = formatWeight(10, 'imperial', 0);
    expect(result).toBe('10 lb');
  });
});
