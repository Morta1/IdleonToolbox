import { parseShorthandNumber } from '../utility/helpers';

describe('parseShorthandNumber', () => {
  describe('US/UK Format (comma thousands, period decimal)', () => {
    test.each([
      ['1,234', 1234],
      ['12,345', 12345],
      ['123,456', 123456],
      ['1,234,567', 1234567]
    ])('parses %s with comma separators', (input, expected) => {
      expect(parseShorthandNumber(input)).toBe(expected);
    });

    test('parses numbers with decimals', () => {
      expect(parseShorthandNumber('1,234.56')).toBe(1234.56);
      expect(parseShorthandNumber('123,456.78')).toBe(123456.78);
    });

    test('parses decimal-only numbers', () => {
      expect(parseShorthandNumber('12.5')).toBe(12.5);
      expect(parseShorthandNumber('12.50')).toBe(12.5);
      // Note: '123.4567' with 4+ digits after period is now treated as misplaced separator
      // For true decimals with 4+ digits, use proper thousands separator: '123,456.7' or no separator: parseFloat()
      expect(parseShorthandNumber('12.345')).toBe(12345); // This is now treated as thousands separator (1-3 digits before)
      expect(parseShorthandNumber('123.45')).toBe(123.45); // Clear decimal (2 digits after)
    });

    test('parses large numbers', () => {
      expect(parseShorthandNumber('1,234,567,890')).toBe(1234567890);
      expect(parseShorthandNumber('1,234,567.89')).toBe(1234567.89);
    });
  });

  describe('European Format (period thousands, comma decimal)', () => {
    test.each([
      ['1.234', 1234],
      ['12.345', 12345],
      ['123.456', 123456],
      ['1.234.567', 1234567]
    ])('parses %s with period separators', (input, expected) => {
      expect(parseShorthandNumber(input)).toBe(expected);
    });

    test('parses numbers with decimal comma', () => {
      expect(parseShorthandNumber('1.234,56')).toBe(1234.56);
      expect(parseShorthandNumber('123.456,78')).toBe(123456.78);
    });

    test('parses decimal-only numbers with comma', () => {
      expect(parseShorthandNumber('12,5')).toBe(12.5);
      expect(parseShorthandNumber('12,50')).toBe(12.5);
      // Note: '123,4567' with 4+ digits after comma is now treated as misplaced separator
      // See "4+ digits after separator" test in Regression section
      expect(parseShorthandNumber('123,45')).toBe(123.45);
    });

    test('parses large numbers', () => {
      expect(parseShorthandNumber('1.234.567.890')).toBe(1234567890);
      expect(parseShorthandNumber('1.234.567,89')).toBe(1234567.89);
    });
  });

  describe('Numbers without separators', () => {
    test('parses plain integers', () => {
      expect(parseShorthandNumber('123')).toBe(123);
      expect(parseShorthandNumber('1234')).toBe(1234);
      expect(parseShorthandNumber('12345')).toBe(12345);
      expect(parseShorthandNumber('123456')).toBe(123456);
      expect(parseShorthandNumber('1234567')).toBe(1234567);
    });

    test('parses plain decimals', () => {
      expect(parseShorthandNumber('123.45')).toBe(123.45);
      expect(parseShorthandNumber('123,45')).toBe(123.45);
    });
  });

  describe('Shorthand suffixes', () => {
    test.each([
      ['1k', 1000],
      ['1.5k', 1500],
      ['123k', 123000],
      ['1m', 1000000],
      ['1.5m', 1500000],
      ['123m', 123000000],
      ['1b', 1000000000],
      ['1.5b', 1500000000],
      ['1t', 1000000000000],
      ['1.5t', 1500000000000],
      ['1q', 1000000000000000],
      ['1.5q', 1500000000000000]
    ])('parses %s', (input, expected) => {
      expect(parseShorthandNumber(input)).toBe(expected);
    });

    test('parses repeated q (quintillions, etc.)', () => {
      expect(parseShorthandNumber('1qq')).toBe(1e18);
      expect(parseShorthandNumber('1qqq')).toBe(1e21);
      expect(parseShorthandNumber('1qqqq')).toBe(1e24);
    });

    test('parses suffixes with separators', () => {
      expect(parseShorthandNumber('1,234k')).toBe(1234000);
      expect(parseShorthandNumber('1.234k')).toBe(1234000);
      expect(parseShorthandNumber('1,234.5k')).toBe(1234500);
      expect(parseShorthandNumber('1.234,5m')).toBe(1234500000);
    });
  });

  describe('Edge cases and special characters', () => {
    test('handles whitespace', () => {
      expect(parseShorthandNumber(' 123 ')).toBe(123);
      expect(parseShorthandNumber(' 1,234 ')).toBe(1234);
      expect(parseShorthandNumber(' 1k ')).toBe(1000);
    });

    test('strips special and invalid characters and parses the valid digits', () => {
      expect(parseShorthandNumber('$123')).toBe(123);
      expect(parseShorthandNumber('€1.234')).toBe(1234);
      expect(parseShorthandNumber('£1,234')).toBe(1234);
      // Everything but digits, commas and periods goes, so '--123' becomes a valid '123'.
      expect(parseShorthandNumber('--123')).toBe(123);
    });

    test('returns NaN for invalid input', () => {
      expect(parseShorthandNumber('abc')).toBeNaN();
      expect(parseShorthandNumber('')).toBeNaN();
    });

    test('handles non-string input', () => {
      expect(parseShorthandNumber(123)).toBeNaN();
      expect(parseShorthandNumber(null)).toBeNaN();
      expect(parseShorthandNumber(undefined)).toBeNaN();
    });
  });

  describe('Regression tests for the bug', () => {
    // A three-digit group after the separator is thousands, never a decimal: 123,000 is 123000, not 123.
    test.each([
      ['123,000', 123000],
      ['123.000', 123000],
      ['100,000', 100000],
      ['10,000', 10000],
      ['1,000', 1000],
      ['100.000', 100000],
      ['10.000', 10000],
      ['1.000', 1000]
    ])('parses %s as %i', (input, expected) => {
      expect(parseShorthandNumber(input)).toBe(expected);
    });

    test('ambiguous case: 122,123 treated as thousands separator', () => {
      // With proper grouping (3 digits before, 3 after), this is a thousands separator
      expect(parseShorthandNumber('122,123')).toBe(122123);
      expect(parseShorthandNumber('122.123')).toBe(122123);
    });

    test('4+ digits after separator treated as misplaced separator (for editing)', () => {
      // When user types into formatted number and adds digits, separator becomes misplaced
      // E.g., '131,313' + '3' = '131,3133' (4 digits after) → treat as whole number '1313133'
      expect(parseShorthandNumber('131,3133')).toBe(1313133);
      expect(parseShorthandNumber('131.3133')).toBe(1313133);
      expect(parseShorthandNumber('123,4567')).toBe(1234567);
      expect(parseShorthandNumber('123.4567')).toBe(1234567);
      expect(parseShorthandNumber('1,23456')).toBe(123456);
      expect(parseShorthandNumber('12,34567')).toBe(1234567);
      expect(parseShorthandNumber('12,3456')).toBe(123456);
      expect(parseShorthandNumber('1,234567')).toBe(1234567);
      expect(parseShorthandNumber('123,45678')).toBe(12345678);
    });

    test('3 digits after + 4+ digits before = decimal', () => {
      // '1234,567' has 4 digits before, so comma is decimal separator
      expect(parseShorthandNumber('1234,567')).toBe(1234.567);
      expect(parseShorthandNumber('1234.567')).toBe(1234.567);
      expect(parseShorthandNumber('12345,678')).toBe(12345.678);
      expect(parseShorthandNumber('12345.678')).toBe(12345.678);
    });
  });
});
