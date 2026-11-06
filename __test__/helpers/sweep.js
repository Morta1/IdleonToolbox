import { expect } from 'vitest';

// A sweep runs one rule over a derived list (a registry, every table), so it is one test per rule: a test per row
// only inflates the count, since the rows hold no expectation of their own. The rule returns what it found wrong with
// a row, and the failure names every row that broke it and how, a row that threw included.
export const expectNoBreaks = (rows, nameOf, rule) => {
  const broken = rows.flatMap((row) => {
    try {
      return rule(row).map((problem) => `${nameOf(row)}: ${problem}`);
    } catch (error) {
      return [`${nameOf(row)}: threw ${error.message}`];
    }
  });
  expect(broken).toEqual([]);
};
