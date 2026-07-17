# solair-core

[![CI](https://github.com/Wooinxlkz/solair-core/actions/workflows/ci.yml/badge.svg)](https://github.com/Wooinxlkz/solair-core/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-NullTrace--SAL--1.0-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

**Framework-agnostic TypeScript engine for solar system design, hardware recommendation, energy forecasting, and financial analysis.**

Built by [Wooinxlkz](https://github.com/Wooinxlkz) · Part of the **NullTrace — Solair Planner** ecosystem.

---

## What is this?

`solair-core` is the pure-logic engine extracted from **Solair Planner Pro** — a professional solar design platform. It contains **zero UI, zero framework dependencies, zero React**. Every function is self-contained and can be dropped into any JavaScript or TypeScript project — Node.js, Deno, browser, or edge runtime.

> **Use it right now — no installation needed.**
> Browse the source, copy the function you need, paste it into your project. Done.

---

## How to use it (today)

**No package manager required.** Just browse the source and copy what you need:

| You need… | Go to… | Copy… |
|---|---|---|
| Solar system sizing & hardware ranking | [`src/calculations/solar-sizing.ts`](./src/calculations/solar-sizing.ts) | `recommendSystem` |
| Monthly energy production forecast | [`src/calculations/energy-forecast.ts`](./src/calculations/energy-forecast.ts) | `forecastEnergy` |
| ROI, payback period, break-even year | [`src/calculations/roi.ts`](./src/calculations/roi.ts) | `calculateROI` |
| Levelized cost of energy (LCOE) | [`src/calculations/roi.ts`](./src/calculations/roi.ts) | `calculateLCOE` |
| System size from monthly bill | [`src/calculations/roi.ts`](./src/calculations/roi.ts) | `estimateSystemSize` |
| Cold-weather Voc safety calculation | [`src/calculations/solar-sizing.ts`](./src/calculations/solar-sizing.ts) | `calculateTemperatureAdjustedVoc` |
| Metric ↔ imperial unit conversions | [`src/utils/units.ts`](./src/utils/units.ts) | `convertMeasurement` |
| Multi-currency formatting | [`src/utils/currency.ts`](./src/utils/currency.ts) | `convertCurrency` |

All TypeScript interfaces live in [`src/types.ts`](./src/types.ts) — copy only the ones you need alongside the function.

### Example — copy `calculateROI` into your project

1. Open [`src/calculations/roi.ts`](./src/calculations/roi.ts)
2. Copy the `ROIInput` and `ROIResult` types from [`src/types.ts`](./src/types.ts)
3. Paste both into your file and use:

```ts
const result = calculateROI({
  systemCostUsd: 12000,
  annualProductionKwh: 6000,
  electricityRateUsdPerKwh: 0.14,
  incentivePercent: 30,
});

console.log(result.paybackYears);   // e.g. 6.8
console.log(result.roi);            // e.g. 143.2 (%)
console.log(result.lifetimeSavings); // e.g. $18,746
```

### Example — copy `forecastEnergy` into your project

```ts
const forecast = forecastEnergy(
  5000,   // system wattage (Wp)
  4.8,    // peak sun hours/day
  0.85,   // system efficiency
  14,     // daily consumption (kWh)
  0.18,   // electricity rate ($/kWh)
  13500,  // system cost ($) — for payback calc
);

console.log(forecast.annual.productionKwh);  // e.g. 6560
console.log(forecast.annual.savingsUsd);     // e.g. 1008
console.log(forecast.annual.co2OffsetKg);   // e.g. 2736
console.log(forecast.paybackYears);          // e.g. 7.4
console.log(forecast.monthly[5].productionKwh); // June production
```

### Example — copy `recommendSystem` into your project

```ts
const system = recommendSystem(
  pvConfig,       // your PV array — see PVArrayConfig type
  sunConfig,      // { peakSunHours: 4.8 }
  controllers,    // ChargeControllerSpec[] — your hardware catalogue
  batteries,      // BatterySpec[] — your battery catalogue
  {
    budgetPriority: 'balanced',
    efficiencyPriority: 'high',
    autonomyDays: 2,
    ambientTempMin: -15,
  },
);

console.log(system?.pvSummary.dailyProductionKwh);
console.log(system?.controllerRecommendations[0].controller.model);
console.log(system?.batteryRecommendations[0].estimatedAutonomyDays);
```

---

## Or clone & build locally

If you want everything at once:

```bash
git clone https://github.com/Wooinxlkz/solair-core.git
cd solair-core
npm install
npm run build     # compiles TypeScript → dist/
```

Then import from `dist/` directly in your project.

---

## npm package (coming soon)

A published npm package is planned — which will allow:

```bash
npm install solair-core   # coming soon
```

Until then, copy-paste from source or clone and build locally. The API will remain identical when published.

---

## Modules at a glance

| Module | File | What it does |
|---|---|---|
| `recommendSystem` | `calculations/solar-sizing.ts` | Ranks charge controllers & batteries against a PV array using a weighted multi-factor scoring algorithm |
| `calculateTemperatureAdjustedVoc` | `calculations/solar-sizing.ts` | Cold-weather Voc — critical for controller voltage sizing safety |
| `forecastEnergy` | `calculations/energy-forecast.ts` | Month-by-month production, self-consumption, grid export, CO₂ offset, savings |
| `dailyProduction` | `calculations/energy-forecast.ts` | Single-day production from real-time sun hours |
| `batteryAutonomyDays` | `calculations/energy-forecast.ts` | Days a battery bank sustains load without solar |
| `calculateROI` | `calculations/roi.ts` | Payback, lifetime savings, ROI %, break-even year with degradation |
| `calculateLCOE` | `calculations/roi.ts` | Levelized cost of energy over system lifetime |
| `estimateSystemSize` | `calculations/roi.ts` | Required kW to offset a given monthly bill |
| `convertMeasurement` | `utils/units.ts` | Metric ↔ imperial for area, length, energy, temperature, weight |
| `formatWithUnit` | `utils/units.ts` | Format a value with its unit symbol |
| `convertCurrency` | `utils/currency.ts` | USD → EUR/GBP/JPY/CNY/INR/AUD/CAD |
| `setExchangeRate` | `utils/currency.ts` | Inject live exchange rates at runtime |

---

## TypeScript types

All interfaces are in [`src/types.ts`](./src/types.ts). Copy only what your function needs:

```ts
// Most commonly needed
PanelSpecification      // solar panel electrical specs
PVArrayConfig           // panel + count + stringing
SunConfig               // peak sun hours
ChargeControllerSpec    // charge controller catalogue entry
BatterySpec             // battery catalogue entry
UserPreferences         // budget/efficiency/autonomy priorities
SystemRecommendation    // full output of recommendSystem()
AnnualForecast          // full output of forecastEnergy()
ROIInput / ROIResult    // input/output of calculateROI()
```

---

## Examples

Three fully commented examples are in the [`/examples`](./examples) folder:

| File | What it shows |
|---|---|
| [`01-system-recommendation.ts`](./examples/01-system-recommendation.ts) | Full hardware recommendation report with scoring breakdown |
| [`02-energy-forecast.ts`](./examples/02-energy-forecast.ts) | Monthly production table, savings, CO₂, autonomy |
| [`03-roi-analysis.ts`](./examples/03-roi-analysis.ts) | Side-by-side ROI comparison — US (30% ITC) vs EU (no incentive) |

---

## Development

```bash
git clone https://github.com/Wooinxlkz/solair-core.git
cd solair-core
npm install
npm test          # vitest test suite (50+ assertions)
npm run coverage  # coverage report
npm run build     # compile TypeScript → dist/
```

---

## Roadmap

- [ ] npm package publish
- [ ] PVGIS API helper — automatic irradiance lookup by GPS coordinates
- [ ] Shading loss model — horizon profile + near-object shading analysis
- [ ] String optimizer — best series/parallel config for any panel + inverter
- [ ] TypeDoc documentation site

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). All contributions welcome — bug fixes, new calculation modules, and tests. Keep it framework-agnostic.

---

## License

[NullTrace Source-Available License v1.0](./LICENSE) — free for personal and non-commercial use.

**Commercial licensing:** karimsc01t@gmail.com · Subject: `[solair-core] Commercial License Request`

---

## Part of the Solair Planner ecosystem

`solair-core` is the open engine behind **Solair Planner Pro** — a full-stack solar design platform with interactive roof mapping, AI assistant, PDF reports, certified professional finder, and community forum.

---

*© 2025 Wooinxlkz / NullTrace. All rights reserved under the NullTrace Source-Available License.*
