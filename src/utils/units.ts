/**
 * solair-core — unit conversion utilities
 * NullTrace © 2025 — Wooinxlkz
 */

import type { MeasurementType, MeasurementUnit } from '../types.js';

const conversionFactors: Record<MeasurementType, { toImperial: number; toMetric: number }> = {
  area:        { toImperial: 10.7639,   toMetric: 0.09290304 },
  length:      { toImperial: 3.28084,   toMetric: 0.3048 },
  energy:      { toImperial: 1,         toMetric: 1 },
  power:       { toImperial: 1,         toMetric: 1 },
  volume:      { toImperial: 0.264172,  toMetric: 3.78541 },
  temperature: { toImperial: 0,         toMetric: 0 }, // handled separately
  weight:      { toImperial: 2.20462,   toMetric: 0.453592 },
  efficiency:  { toImperial: 1,         toMetric: 1 },
};

export const unitSymbols: Record<MeasurementUnit, Record<MeasurementType, string>> = {
  metric: {
    area: 'm²', length: 'm', energy: 'kWh', power: 'kW',
    volume: 'L', temperature: '°C', weight: 'kg', efficiency: '%',
  },
  imperial: {
    area: 'ft²', length: 'ft', energy: 'kWh', power: 'kW',
    volume: 'gal', temperature: '°F', weight: 'lb', efficiency: '%',
  },
};

/**
 * Converts a value between metric and imperial unit systems.
 *
 * @example
 * ```ts
 * convertMeasurement(10, 'area', 'metric', 'imperial'); // → 107.639
 * convertMeasurement(100, 'temperature', 'metric', 'imperial'); // → 212
 * ```
 */
export function convertMeasurement(
  value: number,
  type: MeasurementType,
  fromUnit: MeasurementUnit,
  toUnit: MeasurementUnit,
): number {
  if (fromUnit === toUnit) return value;

  if (type === 'temperature') {
    if (fromUnit === 'metric' && toUnit === 'imperial') return (value * 9) / 5 + 32;
    if (fromUnit === 'imperial' && toUnit === 'metric') return ((value - 32) * 5) / 9;
  }

  const factor = fromUnit === 'metric'
    ? conversionFactors[type].toImperial
    : conversionFactors[type].toMetric;

  return value * factor;
}

/**
 * Returns the unit symbol for a given measurement type and system.
 *
 * @example
 * ```ts
 * getUnitSymbol('area', 'imperial'); // → 'ft²'
 * ```
 */
export function getUnitSymbol(type: MeasurementType, unit: MeasurementUnit): string {
  return unitSymbols[unit][type];
}

/**
 * Formats a value with its unit symbol to a given decimal precision.
 *
 * @example
 * ```ts
 * formatWithUnit(5.123, 'energy', 'metric', 1); // → '5.1 kWh'
 * ```
 */
export function formatWithUnit(
  value: number,
  type: MeasurementType,
  unit: MeasurementUnit,
  precision = 2,
): string {
  return `${value.toFixed(precision)} ${getUnitSymbol(type, unit)}`;
}

/**
 * Converts a weight in pounds and formats it in the target measurement system.
 */
export function formatWeight(
  weightInPounds: number,
  measurementUnit: MeasurementUnit = 'metric',
  precision = 0,
): string {
  if (measurementUnit === 'metric') {
    const kg = convertMeasurement(weightInPounds, 'weight', 'imperial', 'metric');
    return formatWithUnit(kg, 'weight', 'metric', precision);
  }
  return formatWithUnit(weightInPounds, 'weight', 'imperial', precision);
}
