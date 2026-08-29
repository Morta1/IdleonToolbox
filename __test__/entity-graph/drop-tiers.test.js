import { describe, it, expect } from 'vitest';
import {
  dropOdds, dropQuantityLabel, dropTalentLabel, dropTierGroups, oneIn, percentLabel
} from '../../utility/wiki/drops';

// Gigafrog: 8 base drops, then Rare Drop at 1 in 200, then Mega-Rare at 1 in 200 of that.
const edge = (to, chance, effectiveChance, tableChance, dropTablePath) => ({
  from: 'monster:frogBIG', to, rel: 'drops', meta: { chance, effectiveChance, tableChance, dropTablePath }
});

const gigafrogEdges = [
  edge('item:Forest3', 0.14, 0.14, 1, []),
  edge('item:EquipmentStatues5', 0.12, 0.0006, 0.005, ['DropTable3']),
  edge('item:Quest24', 0.5, 0.0025, 0.005, ['DropTable3']),
  edge('item:StoneZ1', 0.85, 0.00002125, 0.000025, ['DropTable3', 'SuperDropTable1'])
];

describe('oneIn', () => {
  // Every expectation here is the exact string idleon.wiki/wiki/Gigafrog prints for that drop.
  it('quotes odds to three significant figures with thousands separators', () => {
    expect(oneIn(0.00002125)).toBe('1 in 47,100');
    expect(oneIn(0.005)).toBe('1 in 200');
    expect(oneIn(0.00003)).toBe('1 in 33,300');
  });

  it('rounds to whole numbers rather than showing a fractional denominator', () => {
    // A 14% drop is "1 in 7" on the wiki, not "1 in 7.14".
    expect(oneIn(0.14)).toBe('1 in 7');
    expect(oneIn(0.35)).toBe('1 in 3');
  });

  it('renders nothing for a zero or missing chance', () => {
    expect(oneIn(0)).toBe('');
    expect(oneIn(undefined)).toBe('');
  });
});

describe('dropQuantityLabel', () => {
  it('shows a real bulk quantity', () => {
    expect(dropQuantityLabel({ quantity: 6 })).toBe('x6');
    expect(dropQuantityLabel({ quantity: 30000 })).toBe('x30,000');
  });

  it('stays quiet for a single drop', () => {
    expect(dropQuantityLabel({ quantity: 1 })).toBe('');
  });

});

// Every book shares one item rawName, so the talent is the only thing naming which book this is.
// idleon.wiki title-cases it the same way, so the two read identically.
describe('dropTalentLabel', () => {
  it('names the talent and the level a book grants', () => {
    expect(dropTalentLabel({ talentName: 'BORED_TO_DEATH', talentLevel: 100 })).toBe('Bored To Death Lv 100');
    expect(dropTalentLabel({ talentName: 'ATTACKS_ON_SIMMER', talentLevel: 50 })).toBe('Attacks On Simmer Lv 50');
  });

  it('is empty for a drop that is not a book', () => {
    expect(dropTalentLabel({ quantity: 6 })).toBe('');
  });
});

describe('dropOdds', () => {
  it('uses the per-kill chance, not the in-table chance', () => {
    // 85% inside Mega-Rare is 1 in 47,100 per kill.
    expect(dropOdds(gigafrogEdges[3].meta)).toBe('1 in 47,100');
  });

  it('falls back to chance when effectiveChance is absent', () => {
    expect(dropOdds({ chance: 0.25 })).toBe('1 in 4');
  });

  it('renders nothing when there is no chance at all', () => {
    expect(dropOdds({})).toBe('');
    expect(dropOdds(undefined)).toBe('');
  });
});


describe('dropTierGroups', () => {
  it('splits drops into the game tiers, ordered base first', () => {
    const groups = dropTierGroups(gigafrogEdges);
    expect(groups.map((group) => group.label)).toEqual(['Base drops', 'Rare Drop', 'Mega-Rare']);
    expect(groups.map((group) => group.edges.length)).toEqual([1, 2, 1]);
  });

  it('heads each tier with the per-kill odds of reaching it, and names the table', () => {
    const groups = dropTierGroups(gigafrogEdges);
    expect(groups[0].odds).toBe('');
    expect(groups[1].odds).toBe('1 in 200');
    // Mega-Rare hangs off Rare Drop, so reaching it is 1 in 200 of 1 in 200.
    expect(groups[2].odds).toBe('1 in 40,000');
    expect(groups.map((group) => group.table)).toEqual(['', 'DropTable3', 'SuperDropTable1']);
  });

  it('returns a single base group when nothing is tabled', () => {
    const groups = dropTierGroups([gigafrogEdges[0]]);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('Base drops');
  });

  it('returns nothing for a monster with no drops', () => {
    expect(dropTierGroups([])).toEqual([]);
  });
});

describe('percentLabel', () => {
  it('keeps three significant figures', () => {
    expect(percentLabel(0.14)).toBe('14.0%');
    expect(percentLabel(0.00002125)).toBe('0.00213%');
  });

  // Lucky Lad off Sand Giant. toPrecision goes exponential below 1e-6, and the tooltip read
  // "6.66e-7% per kill" on the live page.
  it('never falls back to exponential notation', () => {
    expect(percentLabel(6.66e-9)).toBe('0.000000666%');
    expect(percentLabel(1e-12)).not.toContain('e');
  });

  it('has nothing to say about a missing chance', () => {
    expect(percentLabel(null)).toBe('');
    expect(percentLabel(undefined)).toBe('');
  });
});
