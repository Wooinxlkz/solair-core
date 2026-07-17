/**
 * Example 2 — Energy Forecast
 *
 * Projects monthly and annual solar production, self-consumption,
 * grid export, CO₂ offset, and savings for a 5kW system.
 *
 * Run (after building):
 *   npx tsx examples/02-energy-forecast.ts
 */

import { forecastEnergy, dailyProduction, batteryAutonomyDays } from 'solair-core';

const SYSTEM_WATTAGE    = 5000;   // Wp
const PEAK_SUN_HOURS    = 4.8;    // average daily peak sun hours (e.g. Southern Europe)
const SYSTEM_EFFICIENCY = 0.85;
const DAILY_CONSUMPTION = 14;     // kWh/day household
const ELECTRICITY_RATE  = 0.18;   // USD per kWh
const SYSTEM_COST       = 13500;  // USD installed

const forecast = forecastEnergy(
  SYSTEM_WATTAGE,
  PEAK_SUN_HOURS,
  SYSTEM_EFFICIENCY,
  DAILY_CONSUMPTION,
  ELECTRICITY_RATE,
  SYSTEM_COST,
);

console.log('\n═══════════════════════════════════════════════════════');
console.log('  solair-core — Energy Forecast Report');
console.log('═══════════════════════════════════════════════════════\n');

console.log('Annual Summary');
console.log('──────────────');
console.log(`  Production:     ${forecast.annual.productionKwh.toFixed(0)} kWh`);
console.log(`  Savings:        $${forecast.annual.savingsUsd.toFixed(2)}`);
console.log(`  CO₂ offset:     ${(forecast.annual.co2OffsetKg / 1000).toFixed(2)} tonnes`);
console.log(`  Simple payback: ${forecast.paybackYears.toFixed(1)} years`);
console.log(`  25-year ROI:    ${forecast.roi25Year.toFixed(1)}%\n`);

console.log('Monthly Breakdown');
console.log('─────────────────');
console.log('  Month        Prod (kWh)  Consump   Self-use  Export    Savings');
console.log('  ─────────────────────────────────────────────────────────────');
forecast.monthly.forEach(m => {
  const pad = (s: string | number, n: number) => String(s).padEnd(n);
  console.log(
    `  ${pad(m.month.slice(0, 9), 12)}` +
    `${pad(m.productionKwh.toFixed(0), 12)}` +
    `${pad(m.consumptionKwh.toFixed(0), 10)}` +
    `${pad(m.selfConsumptionKwh.toFixed(0), 10)}` +
    `${pad(m.gridExportKwh.toFixed(0), 10)}` +
    `$${m.savingsUsd.toFixed(2)}`,
  );
});

console.log('\nInstant Calculations');
console.log('────────────────────');
const todayProduction = dailyProduction(SYSTEM_WATTAGE, 5.2, SYSTEM_EFFICIENCY);
console.log(`  Today (5.2h sun):   ${todayProduction.toFixed(2)} kWh`);

const autonomy = batteryAutonomyDays(13.3, DAILY_CONSUMPTION, 0.95);
console.log(`  Battery autonomy:   ${autonomy.toFixed(1)} days (13.3 kWh usable bank @ ${DAILY_CONSUMPTION} kWh/day)\n`);
