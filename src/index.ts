/**
 * solair-core — public API
 * NullTrace © 2025 — Wooinxlkz
 *
 * A framework-agnostic TypeScript engine for solar system design,
 * hardware recommendation, energy forecasting, and financial analysis.
 */

// ── Types ──────────────────────────────────────────────────────────────────────
export type {
  MeasurementUnit,
  MeasurementType,
  CurrencyCode,
  PanelSpecification,
  PVArrayConfig,
  SunConfig,
  ChargeControllerSpec,
  BatterySpec,
  UserPreferences,
  ScoreFactor,
  HealthStatus,
  ConfidenceLevel,
  PVSummary,
  ControllerRecommendation,
  BatteryRecommendation,
  SystemRecommendation,
  MonthlyForecast,
  AnnualForecast,
  ROIInput,
  ROIResult,
} from './types.js';

// ── Solar sizing & hardware recommendation ────────────────────────────────────
export {
  DEFAULT_PREFERENCES,
  calculateTemperatureAdjustedVoc,
  recommendSystem,
} from './calculations/solar-sizing.js';

// ── Energy forecasting ────────────────────────────────────────────────────────
export {
  forecastEnergy,
  dailyProduction,
  batteryAutonomyDays,
} from './calculations/energy-forecast.js';

// ── Financial analysis ────────────────────────────────────────────────────────
export {
  calculateROI,
  calculateLCOE,
  estimateSystemSize,
} from './calculations/roi.js';

// ── Unit conversions ──────────────────────────────────────────────────────────
export {
  unitSymbols,
  convertMeasurement,
  getUnitSymbol,
  formatWithUnit,
  formatWeight,
} from './utils/units.js';

// ── Currency utilities ────────────────────────────────────────────────────────
export {
  exchangeRates,
  currencySymbols,
  convertCurrency,
  formatCurrency,
  convertAndFormat,
  getCurrencySymbol,
  setExchangeRate,
} from './utils/currency.js';
