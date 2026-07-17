/**
 * Example 1 — System Recommendation
 *
 * Demonstrates how to use `recommendSystem` to rank charge controllers
 * and batteries against a PV array configuration.
 *
 * Run (after building):
 *   npx tsx examples/01-system-recommendation.ts
 */

import {
  recommendSystem,
  type PVArrayConfig,
  type SunConfig,
  type ChargeControllerSpec,
  type BatterySpec,
} from 'solair-core';

// ── 1. Define your PV array ───────────────────────────────────────────────────

const pvConfig: PVArrayConfig = {
  selectedPanel: {
    manufacturer: 'Jinko',
    model: 'Tiger Neo 400W',
    wattage: 400,
    voc: 37.8,
    vmp: 31.6,
    isc: 13.4,
    imp: 12.7,
    systemVoltage: '24V',
    temperatureCoefficient: -0.29,
  },
  panelCount: 10,
  panelsPerString: 2,   // 2 panels in series → higher voltage per string
  stringsCount: 5,      // 5 parallel strings
};

const sunConfig: SunConfig = { peakSunHoursPerDay: 4.8 };

// ── 2. Your hardware catalogue ────────────────────────────────────────────────

const controllers: ChargeControllerSpec[] = [
  {
    manufacturer: 'Victron Energy',
    model: 'SmartSolar MPPT 150/100',
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
  },
  {
    manufacturer: 'Renogy',
    model: 'Rover Elite 40A',
    type: 'mppt',
    maxPvWattage: 2000,
    maxVoltage: 100,
    maxCurrent: 40,
    systemVoltage: '12V/24V',
    efficiency: 97,
    warranty: 2,
    priceEur: 120,
    priceCategory: 'budget',
    temperatureCompensation: false,
  },
];

const batteries: BatterySpec[] = [
  {
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
  },
  {
    manufacturer: 'Battle Born',
    model: 'BB10012',
    type: 'lfp',
    chemistry: 'LiFePO4',
    nominalVoltage: 12,
    capacityKwh: 1.28,
    usableCapacityKwh: 1.216,
    depthOfDischarge: 95,
    cycleLife: 3000,
    maxParallel: 4,
    warranty: 10,
    priceEur: 900,
  },
];

// ── 3. Get recommendations ────────────────────────────────────────────────────

const result = recommendSystem(pvConfig, sunConfig, controllers, batteries, {
  budgetPriority: 'balanced',
  efficiencyPriority: 'high',
  autonomyDays: 2,
  ambientTempMin: -15,
});

if (!result) {
  console.error('Incomplete PV configuration — check panelCount and selectedPanel.');
  process.exit(1);
}

// ── 4. Print results ──────────────────────────────────────────────────────────

const { pvSummary, controllerRecommendations, batteryRecommendations, systemInsights } = result;

console.log('\n═══════════════════════════════════════════════════════');
console.log('  solair-core — System Recommendation Report');
console.log('═══════════════════════════════════════════════════════\n');

console.log('PV Summary');
console.log('──────────');
console.log(`  Array:              ${pvSummary.panelCount}× panels = ${pvSummary.totalWattage}W`);
console.log(`  System voltage:     ${pvSummary.systemVoltage}`);
console.log(`  String Voc:         ${pvSummary.voc.toFixed(1)}V (STC)`);
console.log(`  Cold-weather Voc:   ${pvSummary.temperatureAdjustedVoc.toFixed(1)}V`);
console.log(`  Daily production:   ${pvSummary.dailyProductionKwh.toFixed(1)} kWh/day\n`);

console.log('Top Controller Recommendations');
console.log('──────────────────────────────');
controllerRecommendations.forEach((rec, i) => {
  console.log(`  ${i + 1}. ${rec.controller.manufacturer} ${rec.controller.model}`);
  console.log(`     Score: ${rec.score} | Confidence: ${rec.confidence} | Units needed: ${rec.recommendedCount}`);
  console.log(`     Cost: €${rec.totalCost} | Reasons: ${rec.matchReasons.slice(0, 2).join(', ')}`);
  if (rec.warnings.length) console.log(`     ⚠ ${rec.warnings[0]}`);
  console.log();
});

console.log('Top Battery Recommendations');
console.log('───────────────────────────');
batteryRecommendations.forEach((rec, i) => {
  console.log(`  ${i + 1}. ${rec.battery.manufacturer} ${rec.battery.model}`);
  console.log(`     Score: ${rec.score} | Autonomy: ${rec.estimatedAutonomyDays.toFixed(1)} days | Units: ${rec.recommendedCount}`);
  console.log(`     Cost: €${rec.totalCost} | Usable: ${rec.totalUsableKwh.toFixed(1)} kWh`);
  console.log();
});

console.log('System Insights');
console.log('───────────────');
systemInsights.forEach(insight => console.log(`  • ${insight}`));
console.log();
