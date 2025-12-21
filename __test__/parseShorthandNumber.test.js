import { parseShorthandNumber } from '../utility/helpers';

describe('parseShorthandNumber', () => {
  describe('US/UK Format (comma thousands, period decimal)', () => {
    test('parses 4-digit numbers with comma separator', () => {
      expect(parseShorthandNumber('1,234')).toBe(1234);
    });

    test('parses 5-digit numbers with comma separator', () => {
      expect(parseShorthandNumber('12,345')).toBe(12345);
    });

    test('parses 6-digit numbers with comma separator', () => {
      expect(parseShorthandNumber('123,456')).toBe(123456);
    });

    test('parses 7-digit numbers with comma separator', () => {
      expect(parseShorthandNumber('1,234,567')).toBe(1234567);
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
    test('parses 4-digit numbers with period separator', () => {
      expect(parseShorthandNumber('1.234')).toBe(1234);
    });

    test('parses 5-digit numbers with period separator', () => {
      expect(parseShorthandNumber('12.345')).toBe(12345);
    });

    test('parses 6-digit numbers with period separator', () => {
      expect(parseShorthandNumber('123.456')).toBe(123456);
    });

    test('parses 7-digit numbers with period separator', () => {
      expect(parseShorthandNumber('1.234.567')).toBe(1234567);
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
    test('parses k (thousands)', () => {
      expect(parseShorthandNumber('1k')).toBe(1000);
      expect(parseShorthandNumber('1.5k')).toBe(1500);
      expect(parseShorthandNumber('123k')).toBe(123000);
    });

    test('parses m (millions)', () => {
      expect(parseShorthandNumber('1m')).toBe(1000000);
      expect(parseShorthandNumber('1.5m')).toBe(1500000);
      expect(parseShorthandNumber('123m')).toBe(123000000);
    });

    test('parses b (billions)', () => {
      expect(parseShorthandNumber('1b')).toBe(1000000000);
      expect(parseShorthandNumber('1.5b')).toBe(1500000000);
    });

    test('parses t (trillions)', () => {
      expect(parseShorthandNumber('1t')).toBe(1000000000000);
      expect(parseShorthandNumber('1.5t')).toBe(1500000000000);
    });

    test('parses q (quadrillions)', () => {
      expect(parseShorthandNumber('1q')).toBe(1000000000000000);
      expect(parseShorthandNumber('1.5q')).toBe(1500000000000000);
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

    test('handles various special characters', () => {
      expect(parseShorthandNumber('$123')).toBe(123);
      expect(parseShorthandNumber('€1.234')).toBe(1234);
      expect(parseShorthandNumber('£1,234')).toBe(1234);
    });

    test('returns NaN for invalid input', () => {
      expect(parseShorthandNumber('abc')).toBeNaN();
      expect(parseShorthandNumber('')).toBeNaN();
    });

    test('strips invalid characters and parses valid digits', () => {
      // The function removes non-digit characters (except commas/periods)
      // so '--123' becomes '123' which is valid
      expect(parseShorthandNumber('--123')).toBe(123);
      expect(parseShorthandNumber('$123')).toBe(123);
    });

    test('handles non-string input', () => {
      expect(parseShorthandNumber(123)).toBeNaN();
      expect(parseShorthandNumber(null)).toBeNaN();
      expect(parseShorthandNumber(undefined)).toBeNaN();
    });
  });

  describe('Regression tests for the bug', () => {
    test('correctly parses 123,000 as 123000 not 123', () => {
      expect(parseShorthandNumber('123,000')).toBe(123000);
    });

    test('correctly parses 123.000 (European) as 123000 not 123', () => {
      expect(parseShorthandNumber('123.000')).toBe(123000);
    });

    test('correctly parses various 4-6 digit numbers', () => {
      expect(parseShorthandNumber('1,234')).toBe(1234);
      expect(parseShorthandNumber('12,345')).toBe(12345);
      expect(parseShorthandNumber('123,456')).toBe(123456);
      expect(parseShorthandNumber('1.234')).toBe(1234);
      expect(parseShorthandNumber('12.345')).toBe(12345);
      expect(parseShorthandNumber('123.456')).toBe(123456);
    });

    test('correctly parses numbers with trailing zeros', () => {
      expect(parseShorthandNumber('100,000')).toBe(100000);
      expect(parseShorthandNumber('10,000')).toBe(10000);
      expect(parseShorthandNumber('1,000')).toBe(1000);
      expect(parseShorthandNumber('100.000')).toBe(100000);
      expect(parseShorthandNumber('10.000')).toBe(10000);
      expect(parseShorthandNumber('1.000')).toBe(1000);
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
    });

    test('1-2 digits after separator treated as decimal', () => {
      // Clear decimal cases
      expect(parseShorthandNumber('12,5')).toBe(12.5);
      expect(parseShorthandNumber('12.5')).toBe(12.5);
      expect(parseShorthandNumber('123,45')).toBe(123.45);
      expect(parseShorthandNumber('123.45')).toBe(123.45);
    });

    test('3 digits after + 4+ digits before = decimal', () => {
      // '1234,567' has 4 digits before, so comma is decimal separator
      expect(parseShorthandNumber('1234,567')).toBe(1234.567);
      expect(parseShorthandNumber('1234.567')).toBe(1234.567);
      expect(parseShorthandNumber('12345,678')).toBe(12345.678);
      expect(parseShorthandNumber('12345.678')).toBe(12345.678);
    });

    test('round-trip formatting works correctly across locales', () => {
      // Simulate what happens in the UI:
      // 1. User types '122123'
      // 2. Formatted in German locale: '122.123'
      // 3. Re-parsed: should return 122123
      expect(parseShorthandNumber('122.123')).toBe(122123);
      
      // Same for US locale
      // 1. User types '122123'
      // 2. Formatted in US locale: '122,123'
      // 3. Re-parsed: should return 122123
      expect(parseShorthandNumber('122,123')).toBe(122123);
      
      // For larger numbers
      expect(parseShorthandNumber('1.234.567')).toBe(1234567); // German format
      expect(parseShorthandNumber('1,234,567')).toBe(1234567); // US format
    });

    test('user editing scenario: adding digits to formatted numbers', () => {
      // Real-world scenario the user reported:
      // 1. User types: '131313'
      // 2. Formatted to: '131,313' (or '131.313' in some locales)
      // 3. User adds '3' at the end: '131,3133' (or '131.3133')
      // 4. Should parse back to: '1313133' (not '131.3133')
      
      expect(parseShorthandNumber('131,3133')).toBe(1313133);
      expect(parseShorthandNumber('131.3133')).toBe(1313133);
      
      // Other editing scenarios
      expect(parseShorthandNumber('12,3456')).toBe(123456);
      expect(parseShorthandNumber('1,234567')).toBe(1234567);
      expect(parseShorthandNumber('123,45678')).toBe(12345678);
    });
  });
});

