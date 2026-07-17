/**
 * solair-core — energy forecast & production estimation engine
 * NullTrace © 2025 — Wooinxlkz
 */

import type { MonthlyForecast, AnnualForecast } from '../types.js';

/** Monthly irradiance multipliers (Jan–Dec) relative to annual average */
const MONTHLY_IRRADIANCE = [0.70, 0.78, 0.92, 1.05, 1.15, 1.20, 1.18, 1.12, 1.00, 0.87, 0.73, 0.65];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Estimates monthly and annual solar energy production for a PV system.
 *
 * @param systemWattage         - Total installed PV wattage (Wp)
 * @param peakSunHoursPerDay    - Annual-average peak sun hours for the location
 * @param systemEfficiency      - System efficiency (0–1), default 0.85
 * @param consumptionKwhPerDay  - Average daily household consumption
 * @param electricityRate       - Grid electricity price (USD/kWh)
 * @param systemCostUsd         - Total system cost for payback calculation
 * @returns Monthly breakdown + annual totals + payback estimate
 *
 * @example
 * ```ts
 * import { forecastEnergy } from 'solair-core';
 *
 * const forecast = forecastEnergy(5000, 4.5, 0.85, 15, 0.14, 12000);
 * console.log(forecast.annual.productionKwh); // e.g. 5513
 * ```
 */
export function forecastEnergy(
  systemWattage: number,
  peakSunHoursPerDay: number,
  systemEfficiency = 0.85,
  consumptionKwhPerDay = 15,
  electricityRate = 0.14,
  systemCostUsd = 0,
): AnnualForecast {
  const monthly: MonthlyForecast[] = MONTH_NAMES.map((month, i) => {
    const days = DAYS_PER_MONTH[i];
    const multiplier = MONTHLY_IRRADIANCE[i];
    const adjustedSunHours = peakSunHoursPerDay * multiplier;
    const productionKwh = (systemWattage / 1000) * adjustedSunHours * systemEfficiency * days;
    const consumptionKwh = consumptionKwhPerDay * days;

    const selfConsumptionKwh = Math.min(productionKwh, consumptionKwh);
    const gridExportKwh = Math.max(0, productionKwh - consumptionKwh);
    const savingsUsd = selfConsumptionKwh * electricityRate;

    return { month, productionKwh, consumptionKwh, gridExportKwh, selfConsumptionKwh, savingsUsd };
  });

  const annualProductionKwh = monthly.reduce((s, m) => s + m.productionKwh, 0);
  const annualSavingsUsd = monthly.reduce((s, m) => s + m.savingsUsd, 0);
  /** CO₂ offset — global average grid emission factor ~0.417 kg/kWh */
  const co2OffsetKg = annualProductionKwh * 0.417;

  const paybackYears = systemCostUsd > 0 && annualSavingsUsd > 0
    ? systemCostUsd / annualSavingsUsd
    : 0;

  const roi25Year = systemCostUsd > 0
    ? ((annualSavingsUsd * 25 - systemCostUsd) / systemCostUsd) * 100
    : 0;

  return {
    annual: { productionKwh: annualProductionKwh, savingsUsd: annualSavingsUsd, co2OffsetKg },
    monthly,
    paybackYears,
    roi25Year,
  };
}

/**
 * Calculates daily energy production for a single day given real-time sun hours.
 *
 * @param systemWattage    - Total PV wattage (Wp)
 * @param sunHoursToday    - Effective peak sun hours for today
 * @param systemEfficiency - System derating factor (default 0.85)
 */
export function dailyProduction(
  systemWattage: number,
  sunHoursToday: number,
  systemEfficiency = 0.85,
): number {
  return (systemWattage / 1000) * sunHoursToday * systemEfficiency;
}

/**
 * Estimates the number of days a battery bank can sustain a load without solar input.
 *
 * @param batteryCapacityKwh - Total usable battery capacity (kWh)
 * @param dailyLoadKwh       - Average daily energy consumption (kWh)
 * @param inverterEfficiency - Inverter efficiency (default 0.95)
 */
export function batteryAutonomyDays(
  batteryCapacityKwh: number,
  dailyLoadKwh: number,
  inverterEfficiency = 0.95,
): number {
  if (dailyLoadKwh <= 0) return 0;
  return (batteryCapacityKwh * inverterEfficiency) / dailyLoadKwh;
}
