/**
 * solair-core — ROI & financial analysis engine
 * NullTrace © 2025 — Wooinxlkz
 */

import type { ROIInput, ROIResult } from '../types.js';

/**
 * Calculates 25-year financial return on investment for a solar installation.
 *
 * @param input - System cost, production, electricity rate, incentives, etc.
 * @returns Payback period, lifetime savings, ROI %, and break-even year
 *
 * @example
 * ```ts
 * import { calculateROI } from 'solair-core';
 *
 * const result = calculateROI({
 *   systemCostUsd: 12000,
 *   annualProductionKwh: 6000,
 *   electricityRateUsdPerKwh: 0.14,
 *   incentivePercent: 30,
 * });
 * console.log(result.paybackYears); // e.g. 6.7
 * ```
 */
export function calculateROI(input: ROIInput): ROIResult {
  const {
    systemCostUsd,
    annualProductionKwh,
    electricityRateUsdPerKwh,
    annualDegradationRate = 0.005,  // 0.5% per year
    incentivePercent = 0,
    systemLifeYears = 25,
  } = input;

  const netSystemCost = systemCostUsd * (1 - incentivePercent / 100);
  const annualSavings = annualProductionKwh * electricityRateUsdPerKwh;

  // Accumulate savings year-by-year with panel degradation
  let cumulativeSavings = 0;
  let breakEvenYear = systemLifeYears;

  for (let year = 1; year <= systemLifeYears; year++) {
    const degradedProduction = annualProductionKwh * Math.pow(1 - annualDegradationRate, year - 1);
    const yearlySavings = degradedProduction * electricityRateUsdPerKwh;
    cumulativeSavings += yearlySavings;

    if (cumulativeSavings >= netSystemCost && breakEvenYear === systemLifeYears) {
      breakEvenYear = year;
    }
  }

  const paybackYears = annualSavings > 0 ? netSystemCost / annualSavings : 0;
  const lifetimeSavings = cumulativeSavings;
  const roi = netSystemCost > 0 ? ((lifetimeSavings - netSystemCost) / netSystemCost) * 100 : 0;

  return {
    netSystemCost,
    paybackYears: Math.round(paybackYears * 10) / 10,
    lifetimeSavings: Math.round(lifetimeSavings),
    roi: Math.round(roi * 10) / 10,
    annualSavings: Math.round(annualSavings),
    breakEvenYear,
  };
}

/**
 * Estimates the levelized cost of energy (LCOE) for a solar system.
 *
 * @param systemCostUsd       - Total installed cost (USD)
 * @param lifetimeProductionKwh - Total kWh produced over system lifetime
 * @param annualMaintenanceUsd  - Annual O&M costs (default $150)
 * @param systemLifeYears       - System lifetime (default 25)
 * @returns LCOE in USD/kWh
 */
export function calculateLCOE(
  systemCostUsd: number,
  lifetimeProductionKwh: number,
  annualMaintenanceUsd = 150,
  systemLifeYears = 25,
): number {
  if (lifetimeProductionKwh <= 0) return 0;
  const totalCost = systemCostUsd + annualMaintenanceUsd * systemLifeYears;
  return totalCost / lifetimeProductionKwh;
}

/**
 * Estimates solar system size needed to offset a given monthly bill.
 *
 * @param monthlyBillUsd           - Average monthly electricity bill (USD)
 * @param electricityRateUsdPerKwh - Local electricity rate
 * @param peakSunHoursPerDay       - Average daily peak sun hours at the site
 * @param systemEfficiency         - System efficiency factor (default 0.85)
 * @returns Recommended system size in kW
 */
export function estimateSystemSize(
  monthlyBillUsd: number,
  electricityRateUsdPerKwh: number,
  peakSunHoursPerDay: number,
  systemEfficiency = 0.85,
): number {
  const monthlyKwh = monthlyBillUsd / electricityRateUsdPerKwh;
  const dailyKwh = monthlyKwh / 30;
  return dailyKwh / (peakSunHoursPerDay * systemEfficiency);
}
