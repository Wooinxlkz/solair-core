# Contributing to solair-core

Thanks for your interest in contributing! This document explains how to get started.

## Ground Rules

- This is a **source-available** project. Contributions are welcome for bug fixes, tests, and new calculation modules.
- All contributions are made under the [NullTrace Source-Available License](./LICENSE). By submitting a PR you agree your code will be licensed under the same terms.
- Keep the library **framework-agnostic** — no React, no DOM, no browser-only APIs.
- Every new function must have **unit tests** and **JSDoc** comments.

## Development Setup

```bash
git clone https://github.com/Wooinxlkz/solair-core.git
cd solair-core
npm install
npm test         # run tests
npm run build    # compile TypeScript → dist/
```

## Project Structure

```
src/
├── __tests__/         # Vitest test files
├── calculations/      # Core solar algorithms
│   ├── solar-sizing.ts
│   ├── energy-forecast.ts
│   └── roi.ts
├── utils/             # Standalone utilities
│   ├── units.ts
│   └── currency.ts
├── types.ts           # Shared TypeScript interfaces
└── index.ts           # Public API (re-exports only)
```

## Adding a New Module

1. Create `src/calculations/my-module.ts` or `src/utils/my-util.ts`
2. Export everything you want public from `src/index.ts`
3. Add types to `src/types.ts` if they are shared
4. Write tests in `src/__tests__/my-module.test.ts`
5. Document the new exports in `README.md`
6. Add an entry to `CHANGELOG.md` under `[Unreleased]`

## Test Guidelines

- Use `vitest` — no extra test runner setup needed
- Each public function should have at minimum:
  - A happy-path test with known inputs/outputs
  - An edge-case test (zero values, boundary conditions)
  - A test verifying monotonic relationships where applicable (e.g. more wattage → more production)
- Run `npm run coverage` to check coverage before submitting

## Pull Request Checklist

- [ ] Tests pass locally (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] New functions have JSDoc comments with `@param`, `@returns`, and at least one `@example`
- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] No React, DOM, or browser-only imports

## Reporting Bugs

Open an issue at [github.com/Wooinxlkz/solair-core/issues](https://github.com/Wooinxlkz/solair-core/issues) with:
- Node.js version
- Input values that caused the problem
- Expected vs actual output

## Questions

Open a discussion or issue — responses are best-effort.
