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

// minReduction answers "can the best character carry the cost", nothing else. A material shortage
// is a separate, farmable state and must not push a stamp into the out-of-reach bucket.
const carryableAt = (stamp, account, characters, gilded, reduction) =>
  evaluateStamp(stamp, account, characters, gilded, reduction, false).enoughPlayerStorage;

// Stamps past their unlocked max level, i.e. the ones whose upgrade costs materials.
const getMaterialStamps = (account, characters, gilded) => Object.values(updateStamps(account, characters, gilded, 0, false, true))
  .flat()
  .filter(({ level, maxLevel }) => level > 0 && level >= maxLevel);

describe('minReduction', () => {
  it('is skipped unless the caller opts in, so serialization does not pay for it', () => {
    const { account, characters } = parseFixture(fourth);
    const stamps = Object.values(updateStamps(account, characters, false, 0, false)).flat();
    expect(stamps.length).toBeGreaterThan(0);
    expect(stamps.every(({ minReduction }) => minReduction === null)).toBe(true);
  });

  it.each(CASES)('%s: is the lowest reduction the best character can carry the cost at', (_name, fixture, gilded) => {
    const { account, characters } = parseFixture(fixture);
    const materialStamps = getMaterialStamps(account, characters, gilded);
    expect(materialStamps.length).toBeGreaterThan(0);

    materialStamps.forEach(({ minReduction, displayName, ...rest }) => {
      const stamp = { ...rest, displayName };
      const { reduction } = minReduction;
      const label = `${displayName} (${_name})`;
      const carryable = (at) => carryableAt(stamp, account, characters, gilded, at);
      if (reduction == null) {
        expect(carryable(MAX_STAMP_REDUCTION), label).toBe(false);
        return;
      }
      expect(carryable(reduction), label).toBe(true);
      if (reduction > 0) {
        expect(carryable(reduction - 1), label).toBe(false);
      }
    });
  });

  // The reported bug: a stamp the account can carry at the cap but lacks the material for must
  // stay out of the out-of-reach bucket, so the page can type it 'materials' instead.
  it.each(CASES)('%s: ignores stored materials', (_name, fixture, gilded) => {
    const { account, characters } = parseFixture(fixture);
    getMaterialStamps(account, characters, gilded).forEach((stamp) => {
      if (!carryableAt(stamp, account, characters, gilded, MAX_STAMP_REDUCTION)) return;
      expect(stamp.minReduction.reduction, `${stamp.displayName} (${_name})`).not.toBe(null);
    });
  });

  // Guards the closed-form solve against the clamps inside getMaterialCost, which could in
  // principle make cost non-monotonic in the reduction and break the three-point check above.
  it('matches a brute-force scan over every whole-percent reduction', { timeout: 30_000 }, () => {
    const { account, characters } = parseFixture(fourth);
    getMaterialStamps(account, characters, false).forEach((stamp) => {
      let expected = null;
      for (let reduction = 0; reduction <= MAX_STAMP_REDUCTION; reduction++) {
        if (carryableAt(stamp, account, characters, false, reduction)) {
          expected = reduction;
          break;
        }
      }
      expect(stamp.minReduction.reduction, stamp.displayName).toBe(expected);
    });
  });
});
