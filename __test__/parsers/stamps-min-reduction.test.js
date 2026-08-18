import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { evaluateStamp, MAX_STAMP_REDUCTION, updateStamps } from '@parsers/world-1/stamps';
import { parseFixture } from '../helpers/parsed-fixtures';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];
const CASES = FIXTURES.flatMap(([name, fixture]) => [[`${name} (gilded)`, fixture, true], [name, fixture, false]]);

// A stamp is affordable at a given reduction when the game lets you actually pay for the upgrade:
// enough of the material AND enough carry capacity on the best character.
const affordableAt = (stamp, account, characters, gilded, reduction) => {
  const evaluated = evaluateStamp(stamp, account, characters, gilded, reduction, false);
  return evaluated.hasMaterials && evaluated.enoughPlayerStorage;
};

const blockersAt = (stamp, account, characters, gilded, reduction) => {
  const evaluated = evaluateStamp(stamp, account, characters, gilded, reduction, false);
  return { materials: !evaluated.hasMaterials, capacity: !evaluated.enoughPlayerStorage };
};

// Stamps past their unlocked max level, i.e. the ones whose upgrade costs materials.
const getMaterialStamps = (account, characters, gilded) => Object.values(updateStamps(account, characters, gilded, 0, false, true))
  .flat()
  .filter(({ level, maxLevel }) => level > 0 && level >= maxLevel);

describe('minReduction', () => {
  it('is skipped unless the caller opts in, so serialization does not pay for it', () => {
    const { account, characters } = parseFixture(fourth);
    const stamps = Object.values(updateStamps(account, characters, false, 0, false)).flat();
    expect(stamps.length).toBeGreaterThan(0);
    expect(stamps.every(({ minReduction, greenStackMinReduction }) => minReduction === null && greenStackMinReduction === null)).toBe(true);
  });

  it.each(CASES)('%s: is the lowest reduction the account can actually pay at', (_name, fixture, gilded) => {
    const { account, characters } = parseFixture(fixture);
    const materialStamps = getMaterialStamps(account, characters, gilded);
    expect(materialStamps.length).toBeGreaterThan(0);

    materialStamps.forEach(({ minReduction, displayName, ...rest }) => {
      const stamp = { ...rest, displayName };
      const { reduction, blockedBy } = minReduction;
      const label = `${displayName} (${_name})`;
      const affordable = (at) => affordableAt(stamp, account, characters, gilded, at);
      if (reduction == null) {
        expect(affordable(MAX_STAMP_REDUCTION), label).toBe(false);
        const blockers = blockersAt(stamp, account, characters, gilded, MAX_STAMP_REDUCTION);
        const expectedBlocker = blockers.capacity && blockers.materials
          ? 'both'
          : blockers.capacity ? 'capacity' : 'materials';
        expect(blockedBy, label).toBe(expectedBlocker);
        return;
      }
      expect(blockedBy, label).toBe(null);
      expect(affordable(reduction), label).toBe(true);
      if (reduction > 0) {
        expect(affordable(reduction - 1), label).toBe(false);
      }
    });
  });

  // Guards the closed-form solve against the clamps inside getMaterialCost, which could in
  // principle make cost non-monotonic in the reduction and break the three-point check above.
  it('matches a brute-force scan over every whole-percent reduction', { timeout: 30_000 }, () => {
    const { account, characters } = parseFixture(fourth);
    getMaterialStamps(account, characters, false).forEach((stamp) => {
      let expected = null;
      for (let reduction = 0; reduction <= MAX_STAMP_REDUCTION; reduction++) {
        if (affordableAt(stamp, account, characters, false, reduction)) {
          expected = reduction;
          break;
        }
      }
      expect(stamp.minReduction.reduction, stamp.displayName).toBe(expected);
    });
  });
});
