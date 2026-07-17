/**
 * solair-core — currency conversion & formatting utilities
 * NullTrace © 2025 — Wooinxlkz
 */

import type { CurrencyCode } from '../types.js';

/** Static exchange rates (base: USD). Replace with live rates from your preferred API. */
export const exchangeRates: Record<CurrencyCode, number> = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 112.5,
  CNY: 6.47,
  INR: 74.5,
  AUD: 1.37,
  CAD: 1.35,
};

export const currencySymbols: Record<CurrencyCode, string> = {
  USD: '$', EUR: '€', GBP: '£',
  JPY: '¥', CNY: '¥', INR: '₹',
  AUD: 'A$', CAD: 'C$',
};

/**
 * Converts an amount from USD to the target currency using static rates.
 * For production use, inject live rates via {@link setExchangeRate}.
 */
export function convertCurrency(amountUsd: number, target: CurrencyCode): number {
  return target === 'USD' ? amountUsd : amountUsd * exchangeRates[target];
}

/**
 * Formats a currency amount using the browser/Node `Intl.NumberFormat` API.
 *
 * @example
 * ```ts
 * formatCurrency(1234.5, 'EUR'); // → '€1,234.50'
 * ```
 */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const fractionDigits = currency === 'JPY' ? 0 : 2;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
  }).format(amount);
}

/**
 * Converts from USD and returns a formatted string in one call.
 *
 * @example
 * ```ts
 * convertAndFormat(1000, 'EUR'); // → '€920.00'
 * ```
 */
export function convertAndFormat(amountUsd: number, target: CurrencyCode): string {
  return formatCurrency(convertCurrency(amountUsd, target), target);
}

/** Returns the symbol for a currency code (e.g. 'EUR' → '€'). */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return currencySymbols[currency];
}

/**
 * Overrides a single exchange rate at runtime (useful for injecting live rates).
 *
 * @example
 * ```ts
 * setExchangeRate('EUR', 0.91);
 * ```
 */
export function setExchangeRate(currency: CurrencyCode, rate: number): void {
  exchangeRates[currency] = rate;
}
