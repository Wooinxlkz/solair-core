# solair-core

[![CI](https://github.com/Wooinxlkz/solair-core/actions/workflows/ci.yml/badge.svg)](https://github.com/Wooinxlkz/solair-core/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/solair-core.svg)](https://www.npmjs.com/package/solair-core)
[![License](https://img.shields.io/badge/license-NullTrace--SAL--1.0-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

**Framework-agnostic TypeScript engine for solar system design, hardware recommendation, energy forecasting, and financial analysis.**

Built by [Wooinxlkz](https://github.com/Wooinxlkz) · Part of the **NullTrace — Solair Planner** ecosystem.

---

## What is this?

`solair-core` is the pure-logic engine extracted from **Solair Planner Pro** — a professional solar design platform. It contains **zero UI, zero framework dependencies, zero React**. Drop it into any Node.js, Deno, browser, or edge runtime to power solar calculations in your own application.

### Modules at a glance

| Module | What it does |
|---|---|
| `recommendSystem` | Ranks charge controllers & batteries against a PV array using a weighted multi-factor scoring algorithm |
| `forecastEnergy` | Projects month-by-month solar production, self-consumption, grid export, CO₂ offset, and savings |
| `calculateROI` | Payback period, lifetime savings, ROI %, and break-even year with degradation modelling |
| `calculateLCOE` | Levelized cost of energy over system lifetime |
| `estimateSystemSize` | Required kW to offset a given monthly electricity bill |
| `calculateTemperatureAdjustedVoc` | Cold-weather Voc — critical for controller voltage sizing |
| `convertMeasurement` | Metric ↔ imperial for area, length, energy, temperature, weight, and more |
| `convertCurrency` | USD → EUR/GBP/JPY/CNY/INR/AUD/CAD with live-rate injection |

---

## Installation

```bash
npm install solair-core
# or
pnpm add solair-core
# or
yarn add solair-core
```

> **Node.js ≥ 18** required. Pure ESM package — no CommonJS build.

---

## Quick Start

```ts
import { recommendSystem, forecastEnergy, calculateROI } from 'solair-core';

// ── 1. Define your PV array ───────────────────────────────────────────────────
const pvConfig = {
  selectedPanel: {
    manufacturer: 'Jinko',
    model: 'Tiger Neo 400W',
    wattage: 400,
    voc: 37.8, vmp: 31.6, isc: 13.4, imp: 12.7,
    systemVoltage: '24V',
    temperatureCoefficient: -0.29,
  },
  panelCount: 10,
};

// ── 2. Hardware recommendations ───────────────────────────────────────────────
const system = recommendSystem(
  pvConfig,
  { peakSunHoursPerDay: 4.8 },
  myControllerCatalogue,   // ChargeControllerSpec[]
  myBatteryCatalogue,      // BatterySpec[]
  { budgetPriority: 'balanced', efficiencyPriority: 'high', autonomyDays: 2 },
);

console.log(system?.pvSummary.dailyProductionKwh);            // e.g. 16.3
console.log(system?.controllerRecommendations[0].score);      // e.g. 87
console.log(system?.batteryRecommendations[0].estimatedAutonomyDays); // e.g. 1.9

// ── 3. Energy forecast ────────────────────────────────────────────────────────
const forecast = forecastEnergy(4000, 4.8, 0.85, 15, 0.14, 11000);
console.log(forecast.annual.productionKwh);   // e.g. 5248
console.log(forecast.annual.co2OffsetKg);     // e.g. 2188
console.log(forecast.paybackYears);           // e.g. 9.1

// ── 4. Full ROI ───────────────────────────────────────────────────────────────
const roi = calculateROI({
  systemCostUsd: 11000,
  annualProductionKwh: 5248,
  electricityRateUsdPerKwh: 0.14,
  incentivePercent: 30,
});
console.log(roi.netSystemCost);    // 7700
console.log(roi.paybackYears);     // e.g. 6.8
console.log(roi.roi);              // e.g. 143.2 (%)
```

---

## API Reference

### `recommendSystem(pvConfig, sunConfig, controllers, batteries, preferences?)`

The main recommendation engine. Scores every item in your controller and battery catalogues against the PV array and returns the top 5 of each, ranked by a weighted score across:

- **Capacity match** — headroom and utilisation
- **Voltage safety** — STC Voc + cold-weather Voc with 1.25× safety margin
- **Controller type** — MPPT weighted above PWM
- **Current capacity** — per-unit and total
- **Battery chemistry** — LFP > Li-ion > Lead-acid
- **Cycle life & DoD** — total lifetime usable energy
- **Price value** — weighted by budget priority
- **Brand preference** — bonus for preferred manufacturers

```ts
const result = recommendSystem(pvConfig, sunConfig, controllers, batteries, {
  budgetPriority: 'high',      // 'low' | 'balanced' | 'high'
  efficiencyPriority: 'high',
  autonomyDays: 3,
  preferredBrands: ['Victron', 'Pylontech'],
  ambientTempMin: -25,         // cold climate — raises Voc safety requirement
});
```

**Returns** `SystemRecommendation | null`

| Field | Type | Description |
|---|---|---|
| `pvSummary` | `PVSummary` | Array totals: wattage, V/I, daily production, temp-adjusted Voc |
| `controllerRecommendations` | `ControllerRecommendation[]` | Top 5 controllers with score, factors, warnings, tradeoffs |
| `batteryRecommendations` | `BatteryRecommendation[]` | Top 5 batteries with autonomy, lifecycle cost, confidence |
| `systemInsights` | `string[]` | Human-readable engineering notes |
| `overallConfidence` | `'high' \| 'medium' \| 'low'` | Aggregate confidence across all factors |

---

### `forecastEnergy(systemWattage, peakSunHours, efficiency?, consumptionKwhPerDay?, electricityRate?, systemCostUsd?)`

Uses seasonal irradiance multipliers (Jan–Dec) to project realistic monthly production.

```ts
const forecast = forecastEnergy(5000, 4.8, 0.85, 14, 0.18, 13500);

forecast.annual.productionKwh   // total annual production (kWh)
forecast.annual.savingsUsd      // annual savings (USD)
forecast.annual.co2OffsetKg     // CO₂ avoided (kg, 0.417 kg/kWh factor)
forecast.monthly[5]             // June breakdown
forecast.paybackYears           // simple payback
forecast.roi25Year              // 25-year ROI (%)
```

---

### `calculateROI(input)`

Full financial model with year-by-year degradation.

| Input | Type | Default | Description |
|---|---|---|---|
| `systemCostUsd` | `number` | — | Total installed cost |
| `annualProductionKwh` | `number` | — | First-year production |
| `electricityRateUsdPerKwh` | `number` | — | Local electricity price |
| `incentivePercent` | `number` | `0` | % rebate / tax credit |
| `annualDegradationRate` | `number` | `0.005` | Panel degradation rate |
| `systemLifeYears` | `number` | `25` | System lifetime |

---

### `calculateTemperatureAdjustedVoc(voc, tempCoefficient, ambientTempMin)`

Returns worst-case Voc at minimum ambient temperature. The controller's `maxVoltage` must exceed this × 1.25 safety margin.

```ts
calculateTemperatureAdjustedVoc(37.8, -0.29, -20); // → 43.3V
```

---

### `dailyProduction(systemWattage, sunHoursToday, efficiency?)`

```ts
dailyProduction(5000, 6.1, 0.85); // → 25.93 kWh
```

### `batteryAutonomyDays(batteryCapacityKwh, dailyLoadKwh, inverterEfficiency?)`

```ts
batteryAutonomyDays(13.3, 14, 0.95); // → 0.9 days
```

### `calculateLCOE(systemCostUsd, lifetimeProductionKwh, annualMaintenance?, systemLifeYears?)`

```ts
calculateLCOE(12000, 150000, 150, 25); // → 0.083 ($/kWh)
```

### `estimateSystemSize(monthlyBillUsd, electricityRate, peakSunHours, efficiency?)`

```ts
estimateSystemSize(180, 0.15, 4.8); // → 3.68 kW
```

---

### Unit Conversions

```ts
import { convertMeasurement, formatWithUnit, formatWeight } from 'solair-core';

convertMeasurement(25, 'area', 'metric', 'imperial');   // 25 m² → 269.1 ft²
convertMeasurement(100, 'temperature', 'metric', 'imperial'); // 100°C → 212°F
formatWithUnit(5.5, 'energy', 'metric', 1);              // '5.5 kWh'
formatWeight(220, 'metric', 1);                          // '99.8 kg'
```

### Currency

```ts
import { convertAndFormat, setExchangeRate } from 'solair-core';

setExchangeRate('EUR', 0.91);           // inject live rate
convertAndFormat(1000, 'EUR');          // '€910.00'
```

---

## TypeScript Types

All interfaces exported from the root:

```ts
import type {
  PanelSpecification, PVArrayConfig, SunConfig,
  ChargeControllerSpec, BatterySpec, UserPreferences,
  SystemRecommendation, ControllerRecommendation, BatteryRecommendation,
  AnnualForecast, MonthlyForecast, ROIInput, ROIResult,
  ScoreFactor, HealthStatus, ConfidenceLevel,
  MeasurementType, MeasurementUnit, CurrencyCode,
} from 'solair-core';
```

---

## Examples

Three runnable examples are in the [`/examples`](./examples) directory:

| File | What it shows |
|---|---|
| [`01-system-recommendation.ts`](./examples/01-system-recommendation.ts) | Full hardware recommendation report |
| [`02-energy-forecast.ts`](./examples/02-energy-forecast.ts) | Monthly production table + savings |
| [`03-roi-analysis.ts`](./examples/03-roi-analysis.ts) | Side-by-side ROI comparison (US vs EU) |

```bash
git clone https://github.com/Wooinxlkz/solair-core.git
cd solair-core
npm install && npm run build
npx tsx examples/01-system-recommendation.ts
```

---

## Development

```bash
npm install
npm test            # run vitest suite
npm run coverage    # coverage report
npm run build       # compile → dist/
```

Tests cover all public functions with 50+ assertions across Node 18, 20, and 22 via GitHub Actions.

---

## Roadmap

- [ ] PVGIS API helper — automatic irradiance lookup by GPS coordinates
- [ ] Shading loss model — horizon profile + near-object shading
- [ ] String optimizer — best series/parallel configuration for any panel + inverter
- [ ] TypeDoc documentation site

---

## License

[NullTrace Source-Available License v1.0](./LICENSE) — free for personal and non-commercial use.

**Commercial licensing:** karimsc01t@gmail.com · Subject: `[solair-core] Commercial License Request`

---

## Part of the Solair Planner Ecosystem

`solair-core` is the open engine behind **Solair Planner Pro** — a full-stack solar design platform featuring interactive roof mapping, AI assistant, PDF report generation, certified professional finder, and community forum.

---

*© 2025 Wooinxlkz / NullTrace. All rights reserved under the NullTrace Source-Available License.*
