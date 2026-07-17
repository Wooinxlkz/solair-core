# Changelog

All notable changes to `solair-core` will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2025-07-17

### Added

#### Core Engines
- `recommendSystem` — multi-factor scoring engine that ranks charge controllers and batteries against a PV array. Accounts for voltage safety, cold-weather Voc, MPPT vs PWM efficiency, current capacity, warranty, price value, and user preference weights.
- `calculateTemperatureAdjustedVoc` — computes worst-case open-circuit voltage at minimum ambient temperature, critical for controller sizing safety.

#### Energy Forecasting
- `forecastEnergy` — month-by-month production forecast using seasonal irradiance multipliers. Returns production, consumption, self-consumption, grid export, savings, CO₂ offset, payback, and 25-year ROI.
- `dailyProduction` — single-day production estimate given real-time sun hours.
- `batteryAutonomyDays` — days a battery bank can sustain a load without solar input.

#### Financial Analysis
- `calculateROI` — 25-year financial model with panel degradation, incentive percent, and break-even year tracking.
- `calculateLCOE` — levelized cost of energy over system lifetime including O&M costs.
- `estimateSystemSize` — required kW to offset a given monthly electricity bill.

#### Utilities
- `convertMeasurement` — metric ↔ imperial for area, length, energy, power, volume, temperature, weight, and efficiency.
- `formatWithUnit` / `getUnitSymbol` / `formatWeight` — unit formatting helpers.
- `convertCurrency` / `formatCurrency` / `convertAndFormat` — USD → EUR/GBP/JPY/CNY/INR/AUD/CAD.
- `setExchangeRate` — inject live exchange rates at runtime.

#### Infrastructure
- Full TypeScript types exported from root (`PanelSpecification`, `ChargeControllerSpec`, `BatterySpec`, `SystemRecommendation`, `AnnualForecast`, `ROIResult`, and more).
- Vitest test suite — 50+ assertions covering all modules.
- GitHub Actions CI — tests across Node 18, 20, and 22 on every push and PR.
- GitHub Actions npm publish workflow — triggered on GitHub release.
- Three runnable examples in `/examples`.

---

## [Unreleased]

- PVGIS API integration helper for automatic irradiance lookup by coordinates.
- Shading loss model (horizon profile + near-object shading).
- String optimizer — automatically determines best series/parallel configuration.
- TypeDoc-generated documentation site.
