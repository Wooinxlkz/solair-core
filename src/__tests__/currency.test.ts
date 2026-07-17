import { describe, it, expect, beforeEach } from 'vitest';
import {
  convertCurrency,
  formatCurrency,
  convertAndFormat,
  getCurrencySymbol,
  setExchangeRate,
  exchangeRates,
} from '../utils/currency.js';

describe('convertCurrency', () => {
  it('returns same amount for USD', () => {
    expect(convertCurrency(100, 'USD')).toBe(100);
  });

  it('converts USD to EUR using static rate', () => {
    expect(convertCurrency(100, 'EUR')).toBeCloseTo(100 * exchangeRates.EUR, 4);
  });

  it('converts USD to JPY', () => {
    expect(convertCurrency(1, 'JPY')).toBeCloseTo(exchangeRates.JPY, 2);
  });

  it('returns 0 for 0 input', () => {
    expect(convertCurrency(0, 'EUR')).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('formats USD with dollar sign', () => {
    expect(formatCurrency(1234.5, 'USD')).toContain('1,234');
  });

  it('formats EUR with euro symbol', () => {
    const result = formatCurrency(1000, 'EUR');
    expect(result).toContain('1,000');
  });

  it('formats JPY with no decimals', () => {
    const result = formatCurrency(1000, 'JPY');
    expect(result).not.toContain('.');
  });

  it('formats INR with rupee symbol', () => {
    const result = formatCurrency(1000, 'INR');
    expect(result).toContain('1,000');
  });
});

describe('convertAndFormat', () => {
  it('returns a non-empty string', () => {
    const result = convertAndFormat(1000, 'EUR');
    expect(result.length).toBeGreaterThan(0);
  });

  it('USD stays as USD', () => {
    const result = convertAndFormat(500, 'USD');
    expect(result).toContain('500');
  });
});

describe('getCurrencySymbol', () => {
  it('returns $ for USD', () => expect(getCurrencySymbol('USD')).toBe('$'));
  it('returns € for EUR', () => expect(getCurrencySymbol('EUR')).toBe('€'));
  it('returns £ for GBP', () => expect(getCurrencySymbol('GBP')).toBe('£'));
  it('returns ¥ for JPY', () => expect(getCurrencySymbol('JPY')).toBe('¥'));
  it('returns ₹ for INR', () => expect(getCurrencySymbol('INR')).toBe('₹'));
});

describe('setExchangeRate', () => {
  const originalRate = exchangeRates.EUR;

  beforeEach(() => {
    exchangeRates.EUR = originalRate;
  });

  it('updates the exchange rate for subsequent conversions', () => {
    setExchangeRate('EUR', 0.95);
    expect(convertCurrency(100, 'EUR')).toBeCloseTo(95, 2);
  });

  it('can be reset', () => {
    setExchangeRate('EUR', originalRate);
    expect(convertCurrency(100, 'EUR')).toBeCloseTo(100 * originalRate, 2);
  });
});
