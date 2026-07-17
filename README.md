# solair-core

**Framework-agnostic TypeScript engine for solar system design, hardware recommendation, energy forecasting, and financial analysis.**

Built by [Wooinxlkz](https://github.com/Wooinxlkz) · Part of the [NullTrace — Solair Planner](https://github.com/Wooinxlkz) ecosystem.

---

## Overview

`solair-core` is the pure-logic engine extracted from **Solair Planner Pro** — a professional solar design platform. It contains zero UI, zero framework dependencies, and zero React. Drop it into any Node.js, Deno, browser, or edge runtime to power solar calculations in your own application.

### What's inside

| Module | Description |
|---|---|
| `recommendSystem` | Ranks charge controllers and batteries against a PV array using a multi-factor scoring algorithm |
| `forecastEnergy` | Projects monthly and annual solar production, self-consumption, grid export, and savings |
| `calculateROI` | Computes payback period, lifetime savings, ROI %, and break-even year with degradation modelling |
| `calculateLCOE` | Levelized cost of energy (LCOE) over system lifetime |
| `estimateSystemSize` | Required kW to offset a given monthly electricity bill |
| `convertMeasurement` | Metric ↔ imperial conversions for area, length, energy, temperature, weight, and more |
| `convertCurrency` | USD → any supported currency with overridable live-rate injection |

---

## Installation

```bash
npm install solair-core
# or
pnpm add solair-core
# or
yarn add solair-core
```

> **Node.js 18+** required. The package ships as pure ESM.

---

## Quick Start

```ts
import {
  recommendSystem,
  forecastEnergy,
  calculateROI,
} from 'solair-core';

// 1. Define your PV array
const panel = {
  manufacturer: 'Jinko',
  model: 'Tiger Neo 400W',
  wattage: 400,
  voc: 37.8,
  vmp: 31.6,
  isc: 13.4,
  imp: 12.7,
  systemVoltage: '24V',
  temperatureCoefficient: -0.29, // %/°C
};

const pvConfig = { selectedPanel: panel, panelCount: 10 };
const sunConfig = { peakSunHoursPerDay: 4.8 };

// 2. Get hardware recommendations
const system = recommendSystem(
  pvConfig,
  sunConfig,
  myControllerDatabase,  // ChargeControllerSpec[]
  myBatteryDatabase,     // BatterySpec[]
  { budgetPriority: 'balanced', efficiencyPriority: 'high', autonomyDays: 2 },
);

console.log(system?.pvSummary.dailyProductionKwh);           // e.g. 16.3
console.log(system?.controllerRecommendations[0].controller.model);
console.log(system?.batteryRecommendations[0].estimatedAutonomyDays);

// 3. Forecast production & savings
const forecast = forecastEnergy(
  4000,   // system wattage (Wp)
  4.8,    // peak sun hours/day
  0.85,   // system efficiency
  15,     // daily consumption (kWh)
  0.14,   // electricity rate ($/kWh)
  11000,  // system cost ($)
);

console.log(forecast.annual.productionKwh);   // e.g. 5248
console.log(forecast.annual.savingsUsd);      // e.g. 624
console.log(forecast.paybackYears);           // e.g. 9.1

// 4. Full ROI analysis
const roi = calculateROI({
  systemCostUsd: 11000,
  annualProductionKwh: 5248,
  electricityRateUsdPerKwh: 0.14,
  incentivePercent: 30,             // e.g. US ITC
  annualDegradationRate: 0.005,
  systemLifeYears: 25,
});

console.log(roi.netSystemCost);     // 7700 (after 30% incentive)
console.log(roi.paybackYears);      // e.g. 6.8
console.log(roi.roi);               // e.g. 143.2 (%)
console.log(roi.lifetimeSavings);   // e.g. 18746
```

---

## API Reference

### `recommendSystem(pvConfig, sunConfig, controllers, batteries, preferences?)`

Scores every controller and battery in your catalogue against the PV array and returns ranked recommendations.

```ts
import { recommendSystem, DEFAULT_PREFERENCES } from 'solair-core';

const result = recommendSystem(pvConfig, sunConfig, controllers, batteries, {
  ...DEFAULT_PREFERENCES,
  budgetPriority: 'high',
  autonomyDays: 3,
  preferredBrands: ['Victron', 'Renogy'],
  ambientTempMin: -20, // cold climate
});
```

**Returns** `SystemRecommendation | null`

| Field | Type | Description |
|---|---|---|
| `pvSummary` | `PVSummary` | Array voltage, current, daily production, temp-adjusted Voc |
| `controllerRecommendations` | `ControllerRecommendation[]` | Top 5 controllers, scored and ranked |
| `batteryRecommendations` | `BatteryRecommendation[]` | Top 5 batteries, scored and ranked |
| `systemInsights` | `string[]` | Human-readable engineering notes |
| `overallConfidence` | `'high' \| 'medium' \| 'low'` | Aggregate confidence in recommendations |

---

### `forecastEnergy(systemWattage, peakSunHours, efficiency?, consumptionKwhPerDay?, electricityRate?, systemCostUsd?)`

Projects monthly production using seasonal irradiance multipliers.

**Returns** `AnnualForecast`

```ts
forecast.annual.productionKwh   // total annual production
forecast.annual.savingsUsd      // total annual savings
forecast.annual.co2OffsetKg     // CO₂ offset (kg)
forecast.monthly                // MonthlyForecast[] — Jan to Dec
forecast.paybackYears           // simple payback
forecast.roi25Year              // 25-year ROI (%)
```

---

### `calculateROI(input)`

Full financial model with degradation and incentives.

```ts
import { calculateROI } from 'solair-core';

const result = calculateROI({
  systemCostUsd: 12000,
  annualProductionKwh: 6000,
  electricityRateUsdPerKwh: 0.14,
  incentivePercent: 30,          // optional, default 0
  annualDegradationRate: 0.005,  // optional, default 0.5%
  systemLifeYears: 25,           // optional, default 25
});
```

---

### `calculateTemperatureAdjustedVoc(voc, tempCoefficient, ambientTempMin)`

Returns cold-weather open-circuit voltage — critical for sizing controller input voltage rating safely.

---

### `convertMeasurement(value, type, fromUnit, toUnit)`

Converts between `'metric'` and `'imperial'` for: `area`, `length`, `energy`, `power`, `volume`, `temperature`, `weight`, `efficiency`.

---

### `convertCurrency(amountUsd, target)` / `convertAndFormat(amountUsd, target)`

USD → EUR/GBP/JPY/CNY/INR/AUD/CAD. Inject live rates at runtime with `setExchangeRate('EUR', 0.91)`.

---

## TypeScript Types

All interfaces are exported from the root:

```ts
import type {
  PanelSpecification,
  PVArrayConfig,
  ChargeControllerSpec,
  BatterySpec,
  UserPreferences,
  SystemRecommendation,
  AnnualForecast,
  ROIResult,
} from 'solair-core';
```

---

## Building from Source

```bash
git clone https://github.com/Wooinxlkz/solair-core.git
cd solair-core
npm install
npm run build   # emits to dist/
```

---

## License

[NullTrace Source-Available License v1.0](./LICENSE) — free for personal and non-commercial use.  
For commercial licensing: **karimsc01t@gmail.com** · Subject: `[solair-core] Commercial License Request`

---

## Part of the Solair Planner Ecosystem

`solair-core` is the open engine behind **Solair Planner Pro** — a full-stack solar design platform with interactive maps, AI assistant, PDF report generation, professional finder, and community forum.

---

*© 2025 Wooinxlkz / NullTrace. All rights reserved under the NullTrace Source-Available License.*
