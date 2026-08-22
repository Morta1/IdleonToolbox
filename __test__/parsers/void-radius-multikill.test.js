import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { beforeAll, describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import { getMultiKillPerTier } from '@parsers/damage';
import { checkCharClass, CLASSES } from '@parsers/talents';
import highend from '../fixtures/highend.json';

// GetBuffBonuses(46, 2) in the game: Void Radius' multikill bonus is the talent's y value
// (bigBase 400/5), gated on CharacterClass 4 (Voidwalker) or 5 (Infinilyte) with a speedrun
// running. Reading x instead handed multikill the hit radius in pixels (bigBase 250/2).
let voidwalker;
let otherClass;
let characters;
let account;

const voidRadius = (character) => character?.flatTalents?.find(({ name }) => name === 'VOID_RADIUS');
const speedrunning = (character) => ({
  ...character,
  activeBuffs: [
    ...(character.activeBuffs || []),
    voidRadius(character),
    character.flatTalents.find(({ name }) => name === 'VOID_TRIAL_RERUN')
  ]
});

beforeAll(() => {
  const { data, charNames, companion, guildData, serverVars } = highend;
  const parsed = parseData(data, charNames, companion, guildData, serverVars);
  account = parsed.account;
  characters = parsed.characters;
  voidwalker = characters.find((c) => checkCharClass(c?.class, CLASSES.Voidwalker));
  otherClass = characters.find((c) => !checkCharClass(c?.class, CLASSES.Voidwalker));
});

describe('Void Radius multikill', () => {
  it('pays out the y value, not the hit radius', () => {
    const { y1, y2, x1, x2, level } = voidRadius(voidwalker);
    const expectedY = y1 + y2 * level;
    const pixelRadius = x1 + x2 * level;
    expect(expectedY).not.toBeCloseTo(pixelRadius, 6);

    const idle = getMultiKillPerTier(voidwalker, characters, account);
    const running = getMultiKillPerTier(speedrunning(voidwalker), characters, account);
    expect(running - idle).toBeCloseTo(expectedY, 6);
    expect(running - idle).not.toBeCloseTo(pixelRadius, 6);
  });

  it('pays nothing while no speedrun is running', () => {
    const buffedButIdle = { ...voidwalker, activeBuffs: [...(voidwalker.activeBuffs || []), voidRadius(voidwalker)] };
    expect(getMultiKillPerTier(buffedButIdle, characters, account))
      .toBe(getMultiKillPerTier(voidwalker, characters, account));
  });

  it('pays nothing to a class outside the voidwalker line', () => {
    expect(otherClass).toBeDefined();
    const withVoidwalkersBuff = {
      ...otherClass,
      activeBuffs: [...(otherClass.activeBuffs || []), voidRadius(voidwalker),
        voidwalker.flatTalents.find(({ name }) => name === 'VOID_TRIAL_RERUN')]
    };
    expect(getMultiKillPerTier(withVoidwalkersBuff, characters, account))
      .toBe(getMultiKillPerTier(otherClass, characters, account));
  });
});
