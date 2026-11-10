import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { withAccountOption } from '../helpers/live-verified';
import { getArmorSetBonus, getArmorSmithy, getSetPartsOn, getSetPartsReq } from '@parsers/world-3/armorSmithy';

// Read from the running game on 2026-10-12 through the debug server, logged in as MortasNinth.
// latest.json is that account's save (OptionsListAccount[379] matches; [381], the day counter, moved 258 -> 260).
const GAME = {
  // RANDOlist[113], the order of the smithy's list
  order: ['COPPER_SET', 'IRON_SET', 'AMAROK_SET', 'GOLD_SET', 'PLATINUM_SET', 'EFAUNT_SET', 'DEMENTIA_SET', 'VOID_SET',
    'CHIZOAR_SET', 'LUSTRE_SET', 'DIABOLICAL_SET', 'TROLL_SET', 'SECRET_SET', 'MAGMA_SET', 'KATTLEKRUK_SET',
    'MARBIGLASS_SET', 'GODSHARD_SET', 'EMPEROR_SET', 'PREHISTORIC_SET'],
  // DNSM.SetBonusTOTz, the GetSetBonus(set, "Bonus") map: the sets it holds a value for, each its catalog value
  payingSets: ['COPPER_SET', 'IRON_SET', 'AMAROK_SET', 'GOLD_SET', 'PLATINUM_SET', 'EFAUNT_SET', 'DEMENTIA_SET', 'VOID_SET',
    'CHIZOAR_SET', 'TROLL_SET', 'MAGMA_SET'],
  copperSetBonus: 60,
  // GetSetBonus(set, "PartsOn") / GetSetBonus(set, "PartsReq") for MortasNinth's gear: a set with nothing worn and the two with parts on
  parts: { COPPER_SET: [0, 4], MARBIGLASS_SET: [2, 9], PREHISTORIC_SET: [9, 11] },
  // GetSetBonus("N", "PermaUnlockAfford")
  canUnlockSmithy: true
};

const { account, characters } = parseFixture(latest);
const mortasNinth = characters.find(({ name }) => name === 'MortasNinth');

describe('armor smithy verified against the live game', () => {
  it('sets in the smithy order', () => {
    expect(account.armorSmithy.sets.map(({ setName }) => setName)).toEqual(GAME.order);
  });

  it('the sets that pay a bonus, and what one pays', () => {
    const names = account.armorSmithy.sets.map(({ setName }) => setName);
    expect(names.filter((setName) => getArmorSetBonus(account, setName))).toEqual(GAME.payingSets);
    expect(getArmorSetBonus(account, 'COPPER_SET')).toBe(GAME.copperSetBonus);
  });

  it.each(Object.entries(GAME.parts))('%s parts worn and required', (setName, parts) => {
    const set = account.armorSmithy.sets.find((entry) => entry.setName === setName);
    expect([getSetPartsOn(set, mortasNinth), getSetPartsReq(set)]).toEqual(parts);
  });

  it('smithy unlock affordable', () => {
    expect(account.armorSmithy.isSmithyUnlocked).toBe(GAME.canUnlockSmithy);
  });
});

describe('armor smithy equipped sets', () => {
  // GetSetBonus(set, "Bonus") also pays a set the logged-in character wears in full while it is not
  // yet in OptionsListAccount[379]; no live reading exists since every worn set is already handed in.
  it('a fully worn set counts before it is handed in', () => {
    const loggedIn = { ...mortasNinth, afkTime: Number.MAX_SAFE_INTEGER };
    const copper = account.armorSmithy.sets.find(({ setName }) => setName === 'COPPER_SET');
    const wearing = {
      ...loggedIn,
      equipment: copper.armors.map((rawName) => ({ rawName })),
      tools: copper.tools.slice(0, copper.requiredTools).map((rawName) => ({ rawName }))
    };
    const armorSmithy = getArmorSmithy(latest.data, latest.serverVars, withAccountOption(account, 379, '0'), [wearing]);
    expect(getArmorSetBonus({ armorSmithy }, 'COPPER_SET')).toBe(copper.bonusValue);
    expect(getArmorSetBonus({ armorSmithy }, 'IRON_SET')).toBe(0);
  });
});
