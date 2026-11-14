import { describe, expect, it } from 'vitest';
// The 11 Nov 2026 save: MortasNinth was the character played at export, so its saved stats are current
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getMainStatInfo } from '@parsers/mainStats';
import { evaluateBreakdown } from '@parsers/breakdown';

const otherSources = (breakdown) => breakdown.tree.find(({ name }) => name === 'Other sources')?.value ?? 0;

describe('main stat breakdowns', () => {
  const { account, characters } = parseFixture(latest);
  const character = characters.find(({ name }) => name === 'MortasNinth');

  // _customBlock_TotalStats("STR" | "AGI" | "WIS" | "LUK"): the sources reach the saved stat of the played character
  it.each(['strength', 'agility', 'wisdom', 'luck'])('%s sources reach the saved stat', (stat) => {
    const { value, breakdown } = getMainStatInfo(character, account, characters, stat);
    expect(evaluateBreakdown(breakdown)).toBeCloseTo(value, 0);
    expect(Math.abs(otherSources(breakdown)) / value).toBeLessThan(0.001);
  });
});
