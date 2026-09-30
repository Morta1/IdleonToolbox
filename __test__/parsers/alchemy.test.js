import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { applyNewBubbleChances, getAlchemy, getBaseNewBubbleChance, getExpectedNewBubbles, getMaxCauldron, isNamedVial } from '@parsers/world-2/alchemy';
import { liveCount } from '@parsers/catalog';
import { cauldrons, vials } from '@website-data';
import { createArrayOfArrays } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

const CAULDRON_CATEGORIES = ['power', 'quicc', 'high-iq', 'kazam'];

describe('getAlchemy', () => {
  it('returns every live bubble per cauldron and every live vial when the save is missing', () => {
    const result = getAlchemy(undefined, [], {});
    for (const category of CAULDRON_CATEGORIES) {
      expect(result.bubbles[category]).toHaveLength(liveCount(cauldrons[category]));
      expect(result.bubbles[category].every((b) => b.level === 0)).toBe(true);
    }
    expect(result.vials).toHaveLength(liveCount(Object.values(vials)));
    expect(result.vials.every((v) => v.level === 0)).toBe(true);
  });

  it('never crashes building p2w/sigils when the save is missing', () => {
    const result = getAlchemy(undefined, [], {});
    expect(result.p2w).toBeDefined();
  });

  it('carries catalog fields through', () => {
    const result = getAlchemy(undefined, [], {});
    expect(result.bubbles.power[0].bubbleName).toBe('ROID_RAGIN');
    expect(result.vials[0].name).toBe('COPPER_CORONA');
  });
});

describe('isNamedVial', () => {
  it('excludes a nameless vial entry', () => {
    expect(isNamedVial({})).toBe(false);
    expect(isNamedVial({ name: '' })).toBe(false);
    expect(isNamedVial({ name: undefined })).toBe(false);
  });

  it('keeps a normally-named vial entry', () => {
    expect(isNamedVial({ name: 'COPPER_CORONA' })).toBe(true);
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getAlchemy fixture regression', () => {
  it.each(FIXTURES)('%s: bubble levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const alchemyRaw = createArrayOfArrays(data?.CauldronInfo);
    const result = getAlchemy(data, [], {});

    CAULDRON_CATEGORIES.forEach((category, cauldronIndex) => {
      const raw = alchemyRaw?.[cauldronIndex];
      if (!raw) return;
      raw.forEach((level, index) => {
        if (index >= result.bubbles[category].length) return;
        expect(result.bubbles[category][index].level).toBe(parseInt(level) || 0);
      });
    });
  });

  it.each(FIXTURES)('%s: vial levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const alchemyRaw = createArrayOfArrays(data?.CauldronInfo);
    const vialsRaw = alchemyRaw?.[4];
    const result = getAlchemy(data, [], {});
    if (!vialsRaw) return;

    vialsRaw.forEach((level, index) => {
      if (index >= result.vials.length) return;
      expect(result.vials[index].level).toBe(parseInt(level) || 0);
    });
  });

  it.each(FIXTURES)('%s: returns catalog-length bubbles and vials regardless of save length', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getAlchemy(data, [], {});
    for (const category of CAULDRON_CATEGORIES) {
      expect(result.bubbles[category]).toHaveLength(liveCount(cauldrons[category]));
    }
    expect(result.vials).toHaveLength(liveCount(Object.values(vials)));
  });

  it.each([
    ['first', first, { power: 39275.21769868224, quicc: 61829.0756120502, 'high-iq': 24497.28823226761, kazam: 24497.28823226761 }],
    ['second', second, { power: 37264867.75175519, quicc: 52195624.52137258, 'high-iq': 37264867.75175519, kazam: 37264867.75175519 }],
    ['third', third, { power: 26535563.23752102, quicc: 18842458.90970562, 'high-iq': 18842458.90970562, kazam: 18842458.90970562 }],
    ['fourth', fourth, { power: 2245741.68641624, quicc: 493960.53899184574, 'high-iq': 332526.0436458115, kazam: 728194.190002129 }],
    ['latest', latest, { power: 101667932.23354474, quicc: 101667932.23354474, 'high-iq': 101667932.23354474, kazam: 101667932.23354474 }]
  ])('%s: cauldron req is derived from the save\'s unlocked bubble count, not the save array length', (_name, fixture, expected) => {
    const data = fixture.data ?? fixture;
    const result = getAlchemy(data, [], {});
    for (const category of CAULDRON_CATEGORIES) {
      expect(result.cauldrons[category].req).toBeCloseTo(expected[category], 3);
    }
  });

  it('getMaxCauldron(0) matches the game for a cauldron with no unlocked bubbles', () => {
    expect(getMaxCauldron(0)).toBe(0.01);
  });
});

// Expected values read off the live game (CauldronStats MaxCauldronQTY / PctChanceNewBubble) for a
// cauldron with 35 bubbles, luck brew 170, P2W new bubble 125, Ivory cauldron, no Bubble Breakthrough.
describe('new bubble odds', () => {
  it('getMaxCauldron matches the game brew requirement', () => {
    expect(getMaxCauldron(35)).toBeCloseTo(101667932.23354474, 3);
    expect(getMaxCauldron(52) / 22.455e9).toBeCloseTo(1, 3);
  });

  it('counts only the unbroken run of unlocked bubbles', () => {
    const { cauldrons: result } = getAlchemy({ CauldronInfo: [[5, 3, 0, 2], [1, 1], [], []] }, [], {});
    expect(result.power.unlockedBubbles).toBe(2);
    expect(result.quicc.unlockedBubbles).toBe(2);
    expect(result['high-iq'].unlockedBubbles).toBe(0);
  });

  it('applyNewBubbleChances matches the game chance', () => {
    const account = {
      accountOptions: { 32: '0100' },
      alchemy: {
        cauldrons: {
          power: { unlockedBubbles: 35, boosts: { luck: { level: 170 } } },
          quicc: { unlockedBubbles: 35, boosts: { luck: { level: 170 } } }
        },
        p2w: { cauldrons: [{ newBubble: { level: 125 } }, { newBubble: { level: 125 } }] }
      }
    };
    const result = applyNewBubbleChances(account, []);
    expect(result.quicc.newBubble.chance).toBeCloseTo(0.012630951444351293, 12);
    expect(result.power.newBubble.chance).toBeCloseTo(0.012630951444351293 / 1.5, 12);
    expect(result.quicc.newBubble.chance).toBeCloseTo(getBaseNewBubbleChance(35) * result.quicc.newBubble.multi, 12);
  });

  it('getExpectedNewBubbles walks the rising cost and falling chance bubble by bubble', () => {
    const multi = 9.5 * 2.388888888888889 * 1.5;
    expect(getExpectedNewBubbles(0, 35, multi)).toBe(0);
    // Too little brew for a full bubble: attempts times today's chance
    const req = getMaxCauldron(35);
    const chance = getBaseNewBubbleChance(35) * multi / 100;
    expect(getExpectedNewBubbles(req * 10, 35, multi)).toBeCloseTo(10 * chance, 12);
    // Exactly enough brew for one bubble on average, then one more attempt at the next bubble
    const oneBubble = req / chance;
    const nextChance = getBaseNewBubbleChance(36) * multi / 100;
    expect(getExpectedNewBubbles(oneBubble + 1.5 * getMaxCauldron(36), 35, multi)).toBeCloseTo(1 + nextChance, 10);
  });

  it('applyNewBubbleChances uses the best Bubble Breakthrough with its owner added levels', () => {
    const shaman = (name, baseLevel, addedLevels) => ({
      name,
      addedLevels,
      flatTalents: [{ talentId: 492, baseLevel, funcY: 'add', y1: 1, y2: 0.02 }]
    });
    const account = { alchemy: { cauldrons: { power: { unlockedBubbles: 10 } }, p2w: { cauldrons: [] } } };
    const result = applyNewBubbleChances(account, [shaman('low', 100, 0), shaman('high', 300, 100), shaman('none', 0, 500)]);
    // growth('add', 400, 1, 0.02) = 2004, verified in game
    expect(result.power.newBubble.breakdown.find(({ name }) => name === 'Bubble Breakthrough').value).toBeCloseTo(21.04, 10);
    expect(result.power.newBubble.talentCharacter).toBe('high');
  });
});
