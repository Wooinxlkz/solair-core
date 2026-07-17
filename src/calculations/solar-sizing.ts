/**
 * solair-core — solar sizing & hardware recommendation engine
 * NullTrace © 2025 — Wooinxlkz
 */

import type {
  PVArrayConfig,
  SunConfig,
  ChargeControllerSpec,
  BatterySpec,
  UserPreferences,
  ScoreFactor,
  ControllerRecommendation,
  BatteryRecommendation,
  SystemRecommendation,
  PVSummary,
  ConfidenceLevel,
} from '../types.js';

// ── Default preferences ───────────────────────────────────────────────────────

export const DEFAULT_PREFERENCES: UserPreferences = {
  budgetPriority: 'balanced',
  efficiencyPriority: 'balanced',
  autonomyDays: 2,
  ambientTempMin: -10,
  ambientTempMax: 40,
};

// ── Internal helpers ──────────────────────────────────────────────────────────

function determineSystemVoltage(totalWattage: number, panelVoltage: string): string {
  if (panelVoltage === '48V' || totalWattage > 3000) return '48V';
  if (panelVoltage === '24V' || panelVoltage === '24V/48V' || totalWattage > 1000) return '24V';
  return '12V';
}

function getVoltageNumber(voltageStr: string): number {
  if (voltageStr.includes('48')) return 48;
  if (voltageStr.includes('24')) return 24;
  return 12;
}

function isControllerVoltageCompatible(controllerVoltage: string, systemVoltage: string): boolean {
  if (controllerVoltage.includes(systemVoltage)) return true;
  if (controllerVoltage === '12V/24V/48V') return true;
  if (controllerVoltage === '12V/24V' && (systemVoltage === '12V' || systemVoltage === '24V')) return true;
  return false;
}

/**
 * Calculates temperature-adjusted open-circuit voltage (Voc) accounting for
 * cold-weather conditions where Voc rises above STC values.
 *
 * @param voc - STC open-circuit voltage (V)
 * @param tempCoefficient - Temperature coefficient of Voc (%/°C, typically negative)
 * @param ambientTempMin - Minimum expected ambient temperature (°C)
 */
export function calculateTemperatureAdjustedVoc(
  voc: number,
  tempCoefficient: number,
  ambientTempMin: number,
): number {
  const stcTemp = 25;
  const tempDelta = stcTemp - ambientTempMin;
  const vocAdjustment = voc * Math.abs(tempCoefficient / 100) * tempDelta;
  return voc + vocAdjustment;
}

function getPreferenceMultiplier(
  priority: 'low' | 'balanced' | 'high',
): number {
  switch (priority) {
    case 'low': return 0.5;
    case 'high': return 1.8;
    default: return 1.0;
  }
}

function determineConfidence(factors: ScoreFactor[]): ConfidenceLevel {
  const criticalCount = factors.filter(f => f.status === 'critical').length;
  const warningCount = factors.filter(f => f.status === 'warning').length;
  const excellentCount = factors.filter(f => f.status === 'excellent').length;
  if (criticalCount > 0) return 'low';
  if (warningCount >= 2) return 'medium';
  if (excellentCount >= factors.length * 0.6) return 'high';
  return 'medium';
}

// ── Controller scoring ────────────────────────────────────────────────────────

function scoreController(
  controller: ChargeControllerSpec,
  totalWattage: number,
  systemVoltage: string,
  panelVoc: number,
  panelIsc: number,
  temperatureAdjustedVoc: number,
  preferences: UserPreferences,
): {
  score: number;
  matchReasons: string[];
  warnings: string[];
  factors: ScoreFactor[];
  tradeoffs: string[];
  recommendedCount: number;
} {
  let score = 0;
  const matchReasons: string[] = [];
  const warnings: string[] = [];
  const factors: ScoreFactor[] = [];
  const tradeoffs: string[] = [];

  const effMult = getPreferenceMultiplier(preferences.efficiencyPriority);
  const costMult = getPreferenceMultiplier(preferences.budgetPriority);

  // Number of controllers needed
  const countByWattage = Math.ceil(totalWattage / controller.maxPvWattage);
  const countByCurrent = Math.ceil((panelIsc * 1.25) / controller.maxCurrent);
  const recommendedCount = Math.max(1, countByWattage, countByCurrent);
  const effectiveCapacity = controller.maxPvWattage * recommendedCount;
  const headroom = (effectiveCapacity - totalWattage) / totalWattage;

  // Capacity
  let capScore = 0;
  if (recommendedCount === 1) {
    capScore = headroom >= 0.1 && headroom <= 0.5 ? 25 : headroom > 0.5 ? 15 : 20;
    if (headroom >= 0.1 && headroom <= 0.5) matchReasons.push(`Ideal capacity (${Math.round((1 - headroom) * 100)}% utilized)`);
    if (headroom > 0.5) tradeoffs.push('Larger than needed — good for expansion but higher upfront cost');
  } else {
    capScore = headroom >= 0.05 && headroom <= 0.3 ? 22 : headroom > 0.3 ? 15 : 18;
    matchReasons.push(`${recommendedCount} units = ${effectiveCapacity}W (${Math.round((totalWattage / effectiveCapacity) * 100)}% utilized)`);
    if (headroom > 0.3) tradeoffs.push(`${recommendedCount} controllers — higher cost but covers system capacity`);
  }
  factors.push({ name: 'Capacity Match', score: capScore, maxScore: 25, status: capScore >= 20 ? 'excellent' : capScore >= 10 ? 'good' : 'warning', description: `${effectiveCapacity}W capacity for ${totalWattage}W system` });
  score += capScore;

  // Type (MPPT vs PWM)
  let typeScore = 0;
  if (controller.type === 'mppt') {
    typeScore = Math.round(20 * effMult);
    matchReasons.push('MPPT for maximum efficiency (+15-30% harvest)');
  } else {
    typeScore = 5;
    if (totalWattage > 500) {
      warnings.push('Consider MPPT for better efficiency on larger systems');
      tradeoffs.push('PWM is cheaper but loses 15-30% potential energy harvest');
    }
  }
  factors.push({ name: 'Controller Type', score: typeScore, maxScore: 20, status: controller.type === 'mppt' ? 'excellent' : 'warning', description: controller.type === 'mppt' ? 'MPPT tracks optimal power point' : 'PWM — simpler but less efficient' });
  score += typeScore;

  // Voltage compatibility
  let voltScore = isControllerVoltageCompatible(controller.systemVoltage, systemVoltage) ? 20 : -25;
  if (voltScore === 20) matchReasons.push(`Compatible with ${systemVoltage} system`);
  else warnings.push(`Voltage mismatch: controller is ${controller.systemVoltage}, system needs ${systemVoltage}`);
  factors.push({ name: 'System Voltage', score: voltScore, maxScore: 20, status: voltScore >= 15 ? 'excellent' : voltScore >= 0 ? 'good' : 'critical', description: `Controller: ${controller.systemVoltage}, System: ${systemVoltage}` });
  score += voltScore;

  // Cold-weather Voc safety
  const requiredVoltage = temperatureAdjustedVoc * 1.25;
  let vocScore = 0;
  if (controller.maxVoltage >= requiredVoltage) {
    vocScore = 15;
    matchReasons.push(`Cold-weather Voc safe (${temperatureAdjustedVoc.toFixed(1)}V, ${((controller.maxVoltage / temperatureAdjustedVoc - 1) * 100).toFixed(0)}% margin)`);
  } else if (controller.maxVoltage >= temperatureAdjustedVoc) {
    vocScore = 8;
    warnings.push(`Tight voltage margin — may trip in extreme cold`);
    tradeoffs.push('Voltage margin is tight — works but less safe in extreme cold');
  } else if (controller.maxVoltage >= panelVoc) {
    vocScore = 3;
    warnings.push(`Max voltage (${controller.maxVoltage}V) below cold-weather Voc (${temperatureAdjustedVoc.toFixed(1)}V)`);
  } else {
    vocScore = -20;
    warnings.push(`CRITICAL: max voltage (${controller.maxVoltage}V) below panel Voc — will damage controller!`);
  }
  factors.push({ name: 'Voltage Safety', score: vocScore, maxScore: 15, status: vocScore >= 12 ? 'excellent' : vocScore >= 5 ? 'good' : vocScore >= 0 ? 'warning' : 'critical', description: `Controller max: ${controller.maxVoltage}V, Cold Voc: ${temperatureAdjustedVoc.toFixed(1)}V` });
  score += vocScore;

  // Current capacity
  const currentPerCtrl = panelIsc / recommendedCount;
  let currScore = 0;
  if (controller.maxCurrent >= currentPerCtrl * 1.25) {
    currScore = 10;
    matchReasons.push(`Current capacity OK (${controller.maxCurrent}A per unit)`);
  } else if (controller.maxCurrent >= currentPerCtrl) {
    currScore = 5;
    warnings.push(`Current margin tight per controller`);
  } else {
    currScore = -10;
    warnings.push(`Insufficient current capacity`);
  }
  factors.push({ name: 'Current Capacity', score: currScore, maxScore: 10, status: currScore >= 8 ? 'excellent' : currScore >= 3 ? 'good' : currScore >= 0 ? 'warning' : 'critical', description: `${controller.maxCurrent}A per unit for ${panelIsc.toFixed(1)}A Isc` });
  score += currScore;

  // Efficiency
  const effScore = Math.round((controller.efficiency / 100) * 10 * effMult);
  factors.push({ name: 'Efficiency', score: effScore, maxScore: 10, status: controller.efficiency >= 97 ? 'excellent' : controller.efficiency >= 90 ? 'good' : 'warning', description: `${controller.efficiency}% peak efficiency` });
  score += effScore;

  // Warranty
  let warScore = controller.warranty >= 5 ? 8 : controller.warranty >= 2 ? 4 : 0;
  if (controller.warranty >= 5) matchReasons.push(`${controller.warranty}-year warranty`);
  factors.push({ name: 'Warranty', score: warScore, maxScore: 8, status: controller.warranty >= 5 ? 'excellent' : controller.warranty >= 2 ? 'good' : 'warning', description: `${controller.warranty} year warranty` });
  score += warScore;

  // Price value
  const pricePerWatt = controller.priceEur / controller.maxPvWattage;
  let priceScore = 0;
  if (preferences.budgetPriority === 'high') {
    priceScore = controller.priceCategory === 'budget' ? 20 : controller.priceCategory === 'mid-range' ? 10 : 3;
  } else if (preferences.budgetPriority === 'low') {
    priceScore = controller.priceCategory === 'premium' ? 15 : controller.priceCategory === 'mid-range' ? 12 : 5;
  } else {
    priceScore = Math.max(0, Math.round((15 - pricePerWatt * 50) * costMult));
  }
  factors.push({ name: 'Price Value', score: Math.min(priceScore, 15), maxScore: 15, status: priceScore >= 12 ? 'excellent' : priceScore >= 6 ? 'good' : 'warning', description: `€${controller.priceEur} (€${pricePerWatt.toFixed(2)}/W)` });
  score += Math.min(priceScore, 15);

  // Brand preference bonus
  if (preferences.preferredBrands?.some(b => controller.manufacturer.toLowerCase().includes(b.toLowerCase()))) {
    score += 10;
    matchReasons.push(`Preferred brand: ${controller.manufacturer}`);
  }

  // Temperature compensation bonus
  if (controller.temperatureCompensation) {
    score += 3;
    factors.push({ name: 'Temp Compensation', score: 3, maxScore: 3, status: 'excellent', description: 'Has battery temperature compensation' });
  }

  return { score, matchReasons, warnings, factors, tradeoffs, recommendedCount };
}

// ── Battery scoring ───────────────────────────────────────────────────────────

function scoreBattery(
  battery: BatterySpec,
  systemVoltage: string,
  dailyProductionKwh: number,
  preferences: UserPreferences,
): {
  score: number;
  matchReasons: string[];
  warnings: string[];
  recommendedCount: number;
  factors: ScoreFactor[];
  tradeoffs: string[];
  lifecycleCostPerKwh: number;
} {
  let score = 0;
  const matchReasons: string[] = [];
  const warnings: string[] = [];
  const factors: ScoreFactor[] = [];
  const tradeoffs: string[] = [];

  const effMult = getPreferenceMultiplier(preferences.efficiencyPriority);
  const costMult = getPreferenceMultiplier(preferences.budgetPriority);
  const targetVoltage = getVoltageNumber(systemVoltage);

  // Voltage match
  const voltageMatch =
    Math.abs(battery.nominalVoltage - targetVoltage) <= 2 ||
    (battery.nominalVoltage >= 48 && targetVoltage >= 48) ||
    (battery.nominalVoltage >= 24 && battery.nominalVoltage <= 52 && targetVoltage === 24) ||
    (battery.nominalVoltage <= 14 && targetVoltage === 12);
  const voltScore = voltageMatch ? 20 : -15;
  if (voltageMatch) matchReasons.push(`Matches ${systemVoltage} system voltage`);
  else warnings.push(`Voltage mismatch: battery is ${battery.nominalVoltage}V, system is ${systemVoltage}`);
  factors.push({ name: 'Voltage Match', score: voltScore, maxScore: 20, status: voltScore >= 15 ? 'excellent' : voltScore >= 0 ? 'good' : 'critical', description: `Battery: ${battery.nominalVoltage}V, System: ${systemVoltage}` });
  score += voltScore;

  // Capacity / autonomy
  const dailyConsumption = dailyProductionKwh * 0.8;
  const targetCapacityKwh = (dailyConsumption * preferences.autonomyDays) / (battery.depthOfDischarge / 100);
  const rawCount = Math.max(1, Math.ceil(targetCapacityKwh / battery.capacityKwh));
  const recommendedCount = Math.min(rawCount, battery.maxParallel);
  const totalUsable = battery.usableCapacityKwh * recommendedCount;
  const actualAutonomyDays = totalUsable / dailyConsumption;
  let capScore = 0;
  if (actualAutonomyDays >= preferences.autonomyDays * 0.9 && actualAutonomyDays <= preferences.autonomyDays * 1.5) {
    capScore = 20;
    matchReasons.push(`${actualAutonomyDays.toFixed(1)} days autonomy (target: ${preferences.autonomyDays})`);
  } else if (actualAutonomyDays >= preferences.autonomyDays * 0.7) {
    capScore = 12;
    tradeoffs.push(`Provides ${actualAutonomyDays.toFixed(1)} days vs ${preferences.autonomyDays} target`);
  } else if (actualAutonomyDays > preferences.autonomyDays * 1.5) {
    capScore = 15;
    tradeoffs.push('More capacity than needed — higher cost but future-proof');
  } else {
    capScore = 5;
    warnings.push(`Only ${actualAutonomyDays.toFixed(1)} days autonomy (target: ${preferences.autonomyDays})`);
  }
  factors.push({ name: 'Capacity Match', score: capScore, maxScore: 20, status: capScore >= 15 ? 'excellent' : capScore >= 10 ? 'good' : capScore >= 5 ? 'warning' : 'critical', description: `${totalUsable.toFixed(1)} kWh usable = ${actualAutonomyDays.toFixed(1)} days` });
  score += capScore;

  // Chemistry
  let chemScore = 0;
  if (battery.type === 'lfp') {
    chemScore = Math.round(20 * effMult);
    matchReasons.push('LiFePO4 — best for solar (6000+ cycles, safe)');
  } else if (battery.type === 'lithium-ion') {
    chemScore = Math.round(15 * effMult);
    matchReasons.push('Lithium-ion — high energy density');
    tradeoffs.push('Fewer cycles than LFP but higher energy density');
  } else if (battery.type === 'sodium-ion') {
    chemScore = Math.round(18 * effMult);
    matchReasons.push('Sodium-ion — eco-friendly, no lithium/cobalt');
  } else {
    chemScore = 6;
    if (dailyProductionKwh > 3) {
      warnings.push('Lead-acid has limited cycle life (500-1500 cycles)');
      tradeoffs.push('Lead-acid is cheapest upfront but needs replacement every 3-5 years');
    }
  }
  factors.push({ name: 'Battery Chemistry', score: chemScore, maxScore: 20, status: battery.type === 'lfp' ? 'excellent' : battery.type === 'lithium-ion' || battery.type === 'sodium-ion' ? 'good' : 'warning', description: battery.chemistry });
  score += chemScore;

  // Cycle life
  const cyclesPerYear = 365;
  const expectedYears = battery.cycleLife / cyclesPerYear;
  const cycleScore = Math.min(15, Math.round((battery.cycleLife / 400) * effMult));
  if (battery.cycleLife >= 3000) matchReasons.push(`${battery.cycleLife.toLocaleString()} cycles (~${expectedYears.toFixed(0)} years)`);
  factors.push({ name: 'Cycle Life', score: cycleScore, maxScore: 15, status: battery.cycleLife >= 5000 ? 'excellent' : battery.cycleLife >= 2000 ? 'good' : 'warning', description: `${battery.cycleLife.toLocaleString()} cycles = ~${expectedYears.toFixed(0)} years` });
  score += cycleScore;

  // Depth of discharge
  let dodScore = battery.depthOfDischarge >= 95 ? 10 : battery.depthOfDischarge >= 80 ? 7 : 3;
  if (battery.depthOfDischarge >= 95) matchReasons.push(`${battery.depthOfDischarge}% DoD — full capacity usage`);
  else if (battery.depthOfDischarge < 80) tradeoffs.push(`Only ${battery.depthOfDischarge}% usable capacity`);
  factors.push({ name: 'Depth of Discharge', score: dodScore, maxScore: 10, status: battery.depthOfDischarge >= 90 ? 'excellent' : battery.depthOfDischarge >= 80 ? 'good' : 'warning', description: `${battery.depthOfDischarge}% usable capacity` });
  score += dodScore;

  // Lifecycle cost
  const totalCost = battery.priceEur * recommendedCount;
  const costPerKwh = totalCost / totalUsable;
  const lifecycleCostPerKwh = totalCost / (totalUsable * battery.cycleLife);
  let costScore = 0;
  if (preferences.budgetPriority === 'high') {
    costScore = Math.max(0, Math.round((20 - costPerKwh / 30) * 1.5));
  } else if (preferences.budgetPriority === 'low') {
    costScore = Math.max(0, Math.round(15 - lifecycleCostPerKwh * 1000));
  } else {
    costScore = Math.max(0, Math.round((15 - ((costPerKwh / 400 + lifecycleCostPerKwh * 10) / 2) * 100) * costMult));
  }
  factors.push({ name: 'Cost Value', score: Math.min(costScore, 15), maxScore: 15, status: costScore >= 12 ? 'excellent' : costScore >= 6 ? 'good' : 'warning', description: `€${costPerKwh.toFixed(0)}/kWh, €${(lifecycleCostPerKwh * 100).toFixed(2)}/kWh lifetime` });
  score += Math.min(costScore, 15);

  // Warranty
  let warScore = battery.warranty >= 10 ? 10 : battery.warranty >= 5 ? 5 : 0;
  if (battery.warranty >= 10) matchReasons.push(`${battery.warranty}-year warranty`);
  factors.push({ name: 'Warranty', score: warScore, maxScore: 10, status: battery.warranty >= 10 ? 'excellent' : battery.warranty >= 5 ? 'good' : 'warning', description: `${battery.warranty} year warranty` });
  score += warScore;

  // Brand preference
  if (preferences.preferredBrands?.some(b => battery.manufacturer.toLowerCase().includes(b.toLowerCase()))) {
    score += 10;
    matchReasons.push(`Preferred brand: ${battery.manufacturer}`);
  }

  return { score, matchReasons, warnings, recommendedCount, factors, tradeoffs, lifecycleCostPerKwh };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates ranked controller and battery recommendations for a given PV array.
 *
 * @param pvConfig    - PV array configuration (panel spec + count + stringing)
 * @param sunConfig   - Peak sun hours for the site
 * @param controllers - Catalogue of available charge controllers
 * @param batteries   - Catalogue of available batteries
 * @param preferences - User priorities (budget, efficiency, autonomy)
 * @returns Full system recommendation or null if config is incomplete
 *
 * @example
 * ```ts
 * import { recommendSystem } from 'solair-core';
 *
 * const result = recommendSystem(pvConfig, sunConfig, controllers, batteries, preferences);
 * console.log(result?.pvSummary.dailyProductionKwh); // e.g. 8.5
 * ```
 */
export function recommendSystem(
  pvConfig: PVArrayConfig,
  sunConfig: SunConfig,
  controllers: ChargeControllerSpec[],
  batteries: BatterySpec[],
  preferences: Partial<UserPreferences> = {},
): SystemRecommendation | null {
  if (!pvConfig?.selectedPanel || !pvConfig?.panelCount) return null;

  const prefs: UserPreferences = { ...DEFAULT_PREFERENCES, ...preferences };
  const { selectedPanel: panel, panelCount } = pvConfig;
  const stringsCount = pvConfig.stringsCount ?? panelCount;
  const panelsPerString = pvConfig.panelsPerString ?? 1;

  const totalWattage = panel.wattage * panelCount;
  const systemVoltage = determineSystemVoltage(totalWattage, panel.systemVoltage);
  const peakSunHours = sunConfig.peakSunHours;

  const totalVoc = panel.voc * panelsPerString;
  const totalVmp = panel.vmp * panelsPerString;
  const totalIsc = panel.isc * stringsCount;
  const totalImp = panel.imp * stringsCount;

  const tempAdjVoc = calculateTemperatureAdjustedVoc(
    totalVoc,
    panel.temperatureCoefficient,
    prefs.ambientTempMin ?? -10,
  );

  const dailyProductionKwh = (totalWattage * peakSunHours * 0.85) / 1000;

  const pvSummary: PVSummary = {
    totalWattage,
    panelCount,
    panelModel: `${panel.manufacturer} ${panel.model}`,
    systemVoltage,
    voc: totalVoc,
    vmp: totalVmp,
    isc: totalIsc,
    imp: totalImp,
    dailyProductionKwh,
    temperatureAdjustedVoc: tempAdjVoc,
  };

  // ── Controllers ─────────────────────────────────────────────────────────────
  const controllerRecommendations: ControllerRecommendation[] = controllers
    .map(ctrl => {
      const { score, matchReasons, warnings, factors, tradeoffs, recommendedCount } =
        scoreController(ctrl, totalWattage, systemVoltage, totalVoc, totalIsc, tempAdjVoc, prefs);
      const isSafe = ctrl.maxVoltage >= totalVoc && isControllerVoltageCompatible(ctrl.systemVoltage, systemVoltage);
      return {
        controller: ctrl,
        recommendedCount,
        score,
        compatibilityScore: Math.max(0, Math.min(100, score)),
        matchReasons,
        warnings,
        factors,
        tradeoffs,
        confidence: determineConfidence(factors),
        isSafe,
        totalMaxWattage: ctrl.maxPvWattage * recommendedCount,
        totalCost: ctrl.priceEur * recommendedCount,
      };
    })
    .filter(r => (r as any).isSafe && r.score > -20)
    .map(({ isSafe: _drop, ...rest }) => rest as ControllerRecommendation)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // ── Batteries ───────────────────────────────────────────────────────────────
  const targetVoltNum = getVoltageNumber(systemVoltage);
  const batteryRecommendations: BatteryRecommendation[] = batteries
    .filter(bat => {
      if (targetVoltNum === 48) return bat.nominalVoltage >= 48;
      if (targetVoltNum === 24) return bat.nominalVoltage >= 24 && bat.nominalVoltage <= 52;
      return bat.nominalVoltage <= 14;
    })
    .map(bat => {
      const { score, matchReasons, warnings, recommendedCount, factors, tradeoffs, lifecycleCostPerKwh } =
        scoreBattery(bat, systemVoltage, dailyProductionKwh, prefs);
      const totalCapacityKwh = bat.capacityKwh * recommendedCount;
      const totalUsableKwh = bat.usableCapacityKwh * recommendedCount;
      const estimatedAutonomyDays = totalUsableKwh / (dailyProductionKwh * 0.8);
      return {
        battery: bat,
        recommendedCount,
        score,
        matchReasons,
        warnings,
        totalCapacityKwh,
        totalUsableKwh,
        totalCost: bat.priceEur * recommendedCount,
        estimatedAutonomyDays,
        factors,
        tradeoffs,
        confidence: determineConfidence(factors),
        lifecycleCostPerKwh,
      };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // ── Insights ─────────────────────────────────────────────────────────────────
  const systemInsights: string[] = [
    `Your ${panelCount}× ${panel.wattage}W system produces ~${dailyProductionKwh.toFixed(1)} kWh/day`,
    `Recommended system voltage: ${systemVoltage} (based on ${totalWattage}W total)`,
  ];
  if (tempAdjVoc > totalVoc * 1.05)
    systemInsights.push(`Cold-weather Voc: ${tempAdjVoc.toFixed(1)}V (+${((tempAdjVoc / totalVoc - 1) * 100).toFixed(0)}% from STC) — controller must handle this`);
  if (totalVoc > 100)
    systemInsights.push(`High string voltage (${totalVoc.toFixed(1)}V) — ensure controller is rated for 150V+ input`);
  if (controllerRecommendations[0]?.controller.type === 'mppt')
    systemInsights.push('MPPT controller recommended for optimal energy harvest (+15-30% vs PWM)');

  const allFactors = [
    ...(controllerRecommendations[0]?.factors ?? []),
    ...(batteryRecommendations[0]?.factors ?? []),
  ];
  const overallConfidence = determineConfidence(allFactors);

  return { pvSummary, controllerRecommendations, batteryRecommendations, systemInsights, preferences: prefs, overallConfidence };
}
