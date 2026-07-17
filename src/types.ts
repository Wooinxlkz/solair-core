/**
 * solair-core — shared TypeScript types
 * NullTrace © 2025 — Wooinxlkz
 */

// ── Measurement ───────────────────────────────────────────────────────────────

export type MeasurementUnit = 'metric' | 'imperial';

export type MeasurementType =
  | 'area'
  | 'length'
  | 'energy'
  | 'power'
  | 'volume'
  | 'temperature'
  | 'weight'
  | 'efficiency';

// ── Currency ──────────────────────────────────────────────────────────────────

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'INR' | 'AUD' | 'CAD';

// ── Solar hardware ────────────────────────────────────────────────────────────

export interface PanelSpecification {
  manufacturer: string;
  model: string;
  wattage: number;
  voc: number;
  vmp: number;
  isc: number;
  imp: number;
  /** System voltage string e.g. '12V', '24V', '48V' */
  systemVoltage: string;
  /** Temperature coefficient of Voc in %/°C (negative value, e.g. -0.29) */
  temperatureCoefficient: number;
}

export interface PVArrayConfig {
  selectedPanel: PanelSpecification;
  panelCount: number;
  /** Number of series strings (default: panelCount — all parallel) */
  stringsCount?: number;
  /** Panels per series string (default: 1) */
  panelsPerString?: number;
}

export interface SunConfig {
  /** Peak sun hours per day for the installation location */
  peakSunHours: number;
}

export interface ChargeControllerSpec {
  manufacturer: string;
  model: string;
  /** 'mppt' | 'pwm' */
  type: 'mppt' | 'pwm';
  maxPvWattage: number;
  maxVoltage: number;
  maxCurrent: number;
  /** Supported system voltage string e.g. '12V/24V/48V' */
  systemVoltage: string;
  efficiency: number;
  /** Warranty in years */
  warranty: number;
  priceEur: number;
  priceCategory: 'budget' | 'mid-range' | 'premium';
  temperatureCompensation: boolean;
}

export interface BatterySpec {
  manufacturer: string;
  model: string;
  /** Chemistry type */
  type: 'lfp' | 'lithium-ion' | 'sodium-ion' | 'lead-acid' | string;
  chemistry: string;
  nominalVoltage: number;
  capacityKwh: number;
  usableCapacityKwh: number;
  depthOfDischarge: number;
  cycleLife: number;
  maxParallel: number;
  warranty: number;
  priceEur: number;
}

// ── User preferences ──────────────────────────────────────────────────────────

export interface UserPreferences {
  budgetPriority: 'low' | 'balanced' | 'high';
  efficiencyPriority: 'low' | 'balanced' | 'high';
  /** Target days of energy autonomy without solar input */
  autonomyDays: number;
  preferredBrands?: string[];
  /** Minimum expected ambient temperature (°C) for cold-weather Voc calc */
  ambientTempMin?: number;
  ambientTempMax?: number;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

export type HealthStatus = 'excellent' | 'good' | 'warning' | 'critical';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ScoreFactor {
  name: string;
  score: number;
  maxScore: number;
  status: HealthStatus;
  description: string;
}

// ── Recommendation results ────────────────────────────────────────────────────

export interface PVSummary {
  totalWattage: number;
  panelCount: number;
  panelModel: string;
  systemVoltage: string;
  voc: number;
  vmp: number;
  isc: number;
  imp: number;
  dailyProductionKwh: number;
  temperatureAdjustedVoc: number;
}

export interface ControllerRecommendation {
  controller: ChargeControllerSpec;
  recommendedCount: number;
  score: number;
  compatibilityScore: number;
  matchReasons: string[];
  warnings: string[];
  factors: ScoreFactor[];
  tradeoffs: string[];
  confidence: ConfidenceLevel;
  totalMaxWattage: number;
  totalCost: number;
}

export interface BatteryRecommendation {
  battery: BatterySpec;
  recommendedCount: number;
  score: number;
  matchReasons: string[];
  warnings: string[];
  totalCapacityKwh: number;
  totalUsableKwh: number;
  totalCost: number;
  estimatedAutonomyDays: number;
  factors: ScoreFactor[];
  tradeoffs: string[];
  confidence: ConfidenceLevel;
  lifecycleCostPerKwh: number;
}

export interface SystemRecommendation {
  pvSummary: PVSummary;
  controllerRecommendations: ControllerRecommendation[];
  batteryRecommendations: BatteryRecommendation[];
  systemInsights: string[];
  preferences: UserPreferences;
  overallConfidence: ConfidenceLevel;
}

// ── Energy forecast ───────────────────────────────────────────────────────────

export interface MonthlyForecast {
  month: string;
  productionKwh: number;
  consumptionKwh: number;
  gridExportKwh: number;
  selfConsumptionKwh: number;
  savingsUsd: number;
}

export interface AnnualForecast {
  annual: {
    productionKwh: number;
    savingsUsd: number;
    co2OffsetKg: number;
  };
  monthly: MonthlyForecast[];
  paybackYears: number;
  roi25Year: number;
}

// ── ROI / financials ──────────────────────────────────────────────────────────

export interface ROIInput {
  systemCostUsd: number;
  annualProductionKwh: number;
  electricityRateUsdPerKwh: number;
  annualDegradationRate?: number;
  incentivePercent?: number;
  systemLifeYears?: number;
}

export interface ROIResult {
  netSystemCost: number;
  paybackYears: number;
  lifetimeSavings: number;
  roi: number;
  annualSavings: number;
  breakEvenYear: number;
}
