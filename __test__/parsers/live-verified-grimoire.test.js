import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getGrimoireBonus, getGrimoireTotalUpgradeCost, getWraithStats } from '@parsers/class-specific/grimoire';
import { getTalentBonus } from '@parsers/talents';
import { getSkillEfficiency } from '@parsers/efficiency';
import { getMaxDamage } from '@parsers/damage';
import { lavaLog } from '@utility/helpers';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (Grimoire levels, bones and OptionsListAccount[329-337] match). A daily
// reset ran between the export and the reading: it raised OptionsListAccount[499] (First3MC_CostRedux) from
// 88.92 to 101.64, so the cost checks swap the live value in.
const GAME = {
  // Summoning("GrimoireUpgBonus", i): the flat list (9, 17, 36, 45, 52) and the rest, scaled by upgrade 36
  bonus: {
    0: 1215,
    9: 10,
    13: 351,
    17: 150,
    24: 24456,
    36: 50,
    45: 545,
    46: 61440,
    52: 1.5
  },
  // Summoning("GrimoireUpgCost", i) of upgrades below their max
  cost: {
    0: 3.5444696691766365e+38,
    13: 3.1208319729142785e+40,
    24: 1.4805804356015142e+38,
    45: 1.228731328898316e+40,
    51: 1.7342106218008764e+38
  },
  // Summoning("Grimoire_*") for the logged-in Wind Walker (no Death Bringer talents, so the fishing term is 0)
  stats: {
    hp: 76541.38,
    damage: 5466519744318.367,
    accuracy: 30000329.139133133,
    defence: 11242770.802133583,
    critChance: 535,
    critDamage: 17.42
  },
  costRedux499: 101.64
};

const { account, characters } = parseFixture(latest);
const windWalker = characters.find(({ name }) => name === 'IAmTheHunterrr');
const deathBringer = characters.find(({ class: className }) => className === 'Death_Bringer');
const liveCostAccount = {
  ...account,
  accountOptions: account.accountOptions.map((value, index) => index === 499 ? GAME.costRedux499 : value)
};
const upgradeAt = (index) => account.grimoire.upgrades.find((upgrade) => upgrade.index === index);

describe('grimoire verified against the live game', () => {
  it.each(Object.entries(GAME.bonus))('upgrade %s bonus', (index, value) => {
    within(getGrimoireBonus(account.grimoire.upgrades, Number(index)), value);
  });

  it.each(Object.entries(GAME.cost))('upgrade %s next level cost', (index, value) => {
    const upgrade = upgradeAt(Number(index));
    within(getGrimoireTotalUpgradeCost(liveCostAccount, upgrade, upgrade.level + 1), value);
  });

  it.each(Object.entries(GAME.stats))('wraith %s', (stat, value) => {
    within(getWraithStats(windWalker, account)[stat], value);
  });

  it('wraith crits add FAMINE_O\'_FISH x log10(fishing efficiency), the game\'s Grimoire_CRITPCT / CRITDMG', () => {
    const fishingEfficiency = getSkillEfficiency('fishing', deathBringer, characters, account,
      getMaxDamage(deathBringer, characters, account)).value;
    const famineX = getTalentBonus(deathBringer.flatTalents, 'FAMINE_O\'_FISH');
    const famineY = getTalentBonus(deathBringer.flatTalents, 'FAMINE_O\'_FISH', true);
    expect(famineX * famineY * fishingEfficiency).toBeGreaterThan(0);
    const stats = getWraithStats(deathBringer, account, fishingEfficiency);
    within(stats.critChance, GAME.stats.critChance + famineX * lavaLog(fishingEfficiency));
    within(stats.critDamage, GAME.stats.critDamage + famineY * lavaLog(fishingEfficiency) / 100);
  });
});
