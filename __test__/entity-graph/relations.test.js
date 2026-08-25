import { describe, it, expect } from 'vitest';
import { collapseRows, combineChances } from '../../utility/wiki/relations';
import { oneIn } from '../../utility/wiki/drops';

const edge = (from, to, meta) => ({ from, to, rel: 'drops', meta });

describe('combineChances', () => {
  // Efaunt reaches Silver Pen through DropTable6, 7 and 8, each of which rolls SuperDropTable2 and
  // lands the pen at 1 in 1,850. The page used to print 1 in 1,850, three times.
  it('combines independent rolls rather than reporting the best one', () => {
    const single = 0.00054;
    expect(oneIn(single)).toBe('1 in 1,850');
    expect(oneIn(combineChances([single, single, single]))).toBe('1 in 618');
  });

  it('leaves a single roll exactly as it was', () => {
    expect(combineChances([0.152])).toBe(0.152);
  });

  it('ignores paths with no chance at all', () => {
    expect(combineChances([0.5, 0, 0])).toBe(0.5);
    expect(combineChances([0, 0])).toBe(0);
    expect(combineChances([])).toBe(0);
  });

  // Crystal Carrot reaches Silver Pen through five tables at five different rates.
  it('combines unequal rolls', () => {
    const chances = [1 / 5950, 1 / 6350, 1 / 7140, 1 / 3970, 1 / 4760];
    const combined = combineChances(chances);
    expect(combined).toBeGreaterThan(Math.max(...chances));
    expect(oneIn(combined)).toBe('1 in 1,080');
  });

  it('never exceeds certainty', () => {
    expect(combineChances([0.9, 0.9, 0.9])).toBeLessThanOrEqual(1);
    expect(combineChances([1, 0.5])).toBe(1);
  });
});

describe('collapseRows', () => {
  const efaunt = [
    edge('monster:Boss2A', 'item:SilverPen', { quantity: 1, effectiveChance: 0.00054, dropTablePath: ['DropTable6', 'SuperDropTable2'] }),
    edge('monster:Boss2A', 'item:SilverPen', { quantity: 1, effectiveChance: 0.00054, dropTablePath: ['DropTable7', 'SuperDropTable2'] }),
    edge('monster:Boss2A', 'item:SilverPen', { quantity: 1, effectiveChance: 0.00054, dropTablePath: ['DropTable8', 'SuperDropTable2'] })
  ];

  it('turns one row per drop table into one row per monster', () => {
    const rows = collapseRows(efaunt, 'to');
    expect(rows).toHaveLength(1);
    expect(rows[0].otherId).toBe('monster:Boss2A');
    expect(rows[0].paths).toBe(3);
    expect(oneIn(rows[0].combinedChance)).toBe('1 in 618');
    expect(oneIn(rows[0].bestChance)).toBe('1 in 1,850');
  });

  // One item rawName covers every talent book in the game, so the talent is what tells them apart.
  it('keeps talent books apart', () => {
    const rows = collapseRows([
      edge('monster:mushG', 'item:TalentBook1', { quantity: 1, effectiveChance: 0.001, talentName: 'BORED_TO_DEATH', talentLevel: 100 }),
      edge('monster:mushG', 'item:TalentBook1', { quantity: 1, effectiveChance: 0.001, talentName: 'FIREBALL', talentLevel: 50 })
    ], 'from');
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.paths === 1)).toBe(true);
  });

  it('keeps different quantities of the same item apart', () => {
    const rows = collapseRows([
      edge('monster:mushG', 'item:Copper', { quantity: 1, effectiveChance: 0.1 }),
      edge('monster:mushG', 'item:Copper', { quantity: 5, effectiveChance: 0.1 })
    ], 'from');
    expect(rows).toHaveLength(2);
  });

  it('reads the far end of the edge according to the direction', () => {
    const rows = collapseRows([edge('monster:mushG', 'item:Copper', { effectiveChance: 0.1 })], 'from');
    expect(rows[0].otherId).toBe('item:Copper');
  });

  it('preserves the order rows first appeared in', () => {
    const rows = collapseRows([
      edge('monster:a', 'item:X', { effectiveChance: 0.5 }),
      edge('monster:b', 'item:X', { effectiveChance: 0.9 }),
      edge('monster:a', 'item:X', { effectiveChance: 0.5 })
    ], 'to');
    expect(rows.map((row) => row.otherId)).toEqual(['monster:a', 'monster:b']);
  });
});
