/**
 * Example 3 — ROI & Financial Analysis
 *
 * Full financial model: payback period, lifetime savings, LCOE,
 * break-even year, and system sizing from a monthly bill.
 *
 * Run (after building):
 *   npx tsx examples/03-roi-analysis.ts
 */

import { calculateROI, calculateLCOE, estimateSystemSize } from 'solair-core';

// ── Scenario A: US homeowner with 30% federal ITC ────────────────────────────

const scenarioA = calculateROI({
  systemCostUsd: 14000,
  annualProductionKwh: 7200,
  electricityRateUsdPerKwh: 0.15,
  incentivePercent: 30,
  annualDegradationRate: 0.005,
  systemLifeYears: 25,
});

// ── Scenario B: European homeowner, no incentive ──────────────────────────────

const scenarioB = calculateROI({
  systemCostUsd: 11000,
  annualProductionKwh: 5500,
  electricityRateUsdPerKwh: 0.28,  // higher EU electricity rate
  incentivePercent: 0,
  annualDegradationRate: 0.005,
  systemLifeYears: 25,
});

// ── LCOE ──────────────────────────────────────────────────────────────────────

const lcoeA = calculateLCOE(14000, 7200 * 25, 150, 25);
const lcoeB = calculateLCOE(11000, 5500 * 25, 150, 25);

// ── System sizing from bill ───────────────────────────────────────────────────

const recommendedSize = estimateSystemSize(180, 0.15, 4.8);

// ── Output ────────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════');
console.log('  solair-core — ROI & Financial Analysis Report');
console.log('═══════════════════════════════════════════════════════\n');

const printScenario = (label: string, r: typeof scenarioA, lcoe: number) => {
  console.log(`${label}`);
  console.log('─'.repeat(label.length));
  console.log(`  Net system cost:   $${r.netSystemCost.toLocaleString()}`);
  console.log(`  Annual savings:    $${r.annualSavings.toLocaleString()}`);
  console.log(`  Simple payback:    ${r.paybackYears} years`);
  console.log(`  Break-even year:   Year ${r.breakEvenYear}`);
  console.log(`  Lifetime savings:  $${r.lifetimeSavings.toLocaleString()}`);
  console.log(`  25-year ROI:       ${r.roi}%`);
  console.log(`  LCOE:              $${(lcoe * 100).toFixed(2)}¢/kWh\n`);
};

printScenario('Scenario A — US Homeowner (30% ITC)', scenarioA, lcoeA);
printScenario('Scenario B — EU Homeowner (no incentive)', scenarioB, lcoeB);

console.log('System Sizing from Monthly Bill');
console.log('────────────────────────────────');
console.log(`  Monthly bill:      $180`);
console.log(`  Electricity rate:  $0.15/kWh`);
console.log(`  Peak sun hours:    4.8h/day`);
console.log(`  Recommended size:  ${recommendedSize.toFixed(2)} kW\n`);
