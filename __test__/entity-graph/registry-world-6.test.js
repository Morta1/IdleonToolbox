import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes, registryReport } from '../../scripts/entity-graph/registry/build.mjs';
import world6 from '../../scripts/entity-graph/registry/world-6/index.mjs';
import summoningBattle from '../../scripts/entity-graph/registry/world-6/summoning-battle.mjs';
import { ESSENCE } from '../../scripts/entity-graph/registry/world-6/summoning-upgrade.mjs';
import { tidy } from '../../scripts/entity-graph/registry/text.mjs';
import { costsAt, costsToMax, formatAmount, levelledText } from '../../utility/wiki/effects.mjs';
import { summonEssenceColor } from '@parsers/world-6/summoning';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, world6);
const report = registryReport(data, world6);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);
const spaced = (text) => String(text).replace(/_/g, ' ');
const fieldOf = (node, label) => node.fields?.find((field) => field.label === label)?.value;

describe('summoning upgrades', () => {
  const upgrades = ofKind('summoningupgrade');
  const byName = (name, nth = 0) => upgrades.filter((node) => node.name === name)[nth];
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);
  const costToMax = (name) => formatAmount(costsToMax(byName(name))[0].value);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));

  it('build one page per upgrade', () => {
    expect(report.summoningupgrade).toEqual({ count: data.summoningUpgrades.length, skipped: [] });
  });

  // Oracle: summoning.ts:39 summonEssenceColor, the colour column of the game's table.
  it('name the essences in the colour order the parser uses', () => {
    expect(ESSENCE.map((colour) => colour.toLowerCase())).toEqual(Object.values(summonEssenceColor));
  });

  // Oracle: N.js:109356 prints "Lv.x/max" only below 9000; 9999 means uncapped.
  it('cap exactly the upgrades the panel prints a maximum for', () => {
    expect(upgrades.filter((node) => node.effect.cap !== null).map((node) => spaced(node.name))).toEqual(
      data.summoningUpgrades.filter((entry) => entry.maxLvl < 9000).map((entry) => spaced(entry.name))
    );
  });

  // Oracle: Summoning.js:960-997 SummUpgBonus / UpgCost, printed through N.js:109356.
  it.each([
    ['White_Essence_Champ', 1, '+5% White Essence generated per hour for each win across all colours.'],
    ['Dodge_Roll', 1, '+1% chance to dodge'],
    ['Vrumbi', 1, '+5% Dodge Chance'],
    ['Luck_of_the_Draw', 1, '1.02x more likely'],
    ['Luck_of_the_Draw', 10, '1.2x'],
    ['Cost_Crashing', 50, '33.33%'],
    ['Sell_Sell_Sell', 1, '2.91%'],
    ['Glombolic_Units', 1, '+100%'],
    ['Glombolic_Units', 10, '+1,000%']
  ])('fill %s at level %i', (name, level, expected) => {
    const text = textAt(name, level);
    if (name === 'White_Essence_Champ') expect(text).toBe(expected);
    else expect(text).toContain(expected);
  });

  it('fill both tokens of Whims of the Tide', () => {
    const text = textAt('Whims_of_the_Tide', 1);
    expect(text.match(/\+2%/g)).toHaveLength(2);
    expect(text).toContain('+2% Total Player Damage Multiplier!');
  });

  it('read Familiar as its first sentence with no timer', () => {
    const node = byName('Familiar');
    expect(node.description).not.toContain('|');
    expect(node.description.endsWith('every_hour.')).toBe(true);
    expect(node.effect.cap).toBe(25);
  });

  it.each([
    ['Unit_Health', 1, '10'],
    ['Unit_Health', 2, '13'],
    ['Unit_Health', 10, '107'],
    ['Vrumbi', 10, '750,846,863'],
    ['Glombolic_Units', 2, '2.84e9']
  ])('price %s at level %i at %s', (name, level, expected) => {
    expect(costAt(name, level)).toBe(expected);
  });

  it.each([
    ['Familiar', '1.11e26'],
    ['Dodge_Roll', '698,403'],
    ['Vrumbi', '866,361,764'],
    ['Luck_of_the_Draw', '3,838,120'],
    ['Re-Draw', '62,000'],
    ['Jeweled_Cards', '174,426,000'],
    ['Allstar', '3.94e117'],
    ['Whims_of_the_Tide', '3.12e277']
  ])('total %s to its cap at %s', (name, expected) => {
    expect(costToMax(name)).toBe(expected);
  });

  it('cap Dodge Roll at 30 and pay in white essence', () => {
    expect(byName('Dodge_Roll').effect.cap).toBe(30);
    expect(costsAt(byName('Dodge_Roll'), 1)[0].currency).toBe('White Essence');
  });

  it('keep the default cost note', () => {
    expect(costsAt(byName('Unit_Health'), 1)[0].note).toBeUndefined();
  });

  it('read the unlock chain and essence', () => {
    expect(byName('Unit_Health').fields).toEqual([
      { label: 'Essence', value: 'White' },
      { label: 'Unlocked by', value: 'White Essence Champ at level 1' },
      { label: 'Summoning Doubler', value: 'Can be doubled' }
    ]);
    expect(byName('Dodge_Roll').fields).toEqual([
      { label: 'Essence', value: 'White' },
      { label: 'Unlocked by', value: 'Mana Generation at level 1' }
    ]);
    expect(fieldOf(byName('White_Essence_Champ'), 'Unlocked by')).toBeUndefined();
    expect(fieldOf(byName('Muddah'), 'Unlocked by')).toBe('The 5th Spelunking lore boss (Teal Summoning)');
  });

  it('flag the doubler on exactly the flagged rows', () => {
    expect(upgrades.filter((node) => fieldOf(node, 'Summoning Doubler')).map((node) => spaced(node.name))).toEqual(
      data.summoningUpgrades.filter((entry) => Number(entry.filler) === 1).map((entry) => spaced(entry.name))
    );
  });

  // The cut drops only the live readouts; every description keeps its leading sentence.
  it('cut only readout tails from the text', () => {
    const changed = data.summoningUpgrades.filter((entry) => tidy(entry.bonus) !== nodes[`summoningupgrade:SummonUpg${data.summoningUpgrades.indexOf(entry)}`].description);
    expect(changed.length).toBeGreaterThan(0);
    for (const entry of changed) {
      const node = nodes[`summoningupgrade:SummonUpg${data.summoningUpgrades.indexOf(entry)}`];
      expect(tidy(entry.bonus).startsWith(node.description)).toBe(true);
    }
    expect(upgrades.filter((node) => /\||Total_bonus|Total_Bonus_Spike/i.test(node.description))).toEqual([]);
  });
});

describe('summoning battles', () => {
  const battles = ofKind('summoningbattle');
  const byName = (name) => battles.find((node) => node.name === name);
  const skippedBy = (reason) => report.summoningbattle.skipped
    .filter((skip) => skip.reason === reason)
    .map((skip) => data.summoningEnemies[skip.index].enemyId);

  it('skip every non-battle row with its reason', () => {
    expect({
      empty: skippedBy('placeholder: empty slot'),
      circuit: skippedBy('not on a circuit'),
      stones: skippedBy('summoning stone boss: no winner bonus'),
      endless: skippedBy('endless or Gambit opponent: no winner bonus'),
      unnamed: skippedBy('no name')
    }).toEqual({
      empty: ['Copper', 'Iron', 'Plat', 'Void', 'Starfire'],
      circuit: ['poopD'],
      stones: ['babaMummy', 'slimeB', 'mini6a', 'mini3a', 'mini4a', 'mini5a', 'Boss6', 'babayaga', 'babayaga'],
      endless: ['rift1', 'rift2', 'rift3', 'rift4', 'rift5', 'Crystal1', 'Crystal2', 'Crystal3', 'Crystal4', 'Crystal0', 'Crystal5'],
      unnamed: ['w7b7', 'w7b8']
    });
    expect(battles).toHaveLength(data.summoningEnemies.length - report.summoningbattle.skipped.length);
  });

  // The extractor reads w7b7 and w7b8 the first two endless rewards (features/world-6/summoning.js:46-62).
  it('keep the unreleased World 7 opponents out by their own rule', () => {
    const unreleased = data.summoningEnemies.filter((entry) => ['w7b7', 'w7b8'].includes(entry.enemyId));
    expect(unreleased).toHaveLength(2);
    expect(unreleased.map((entry) => summoningBattle.skip(entry))).toEqual([
      'unreleased: the extractor reads its winner bonus from the endless list',
      'unreleased: the extractor reads its winner bonus from the endless list'
    ]);
  });

  // Oracle: N.js:109371 prints 3.5 x the table quantity, floored for `{` (NotateNumber "Big"), two decimals for `<`.
  it.each([
    ['Jonesy_and_his_Lil_Mushies', 'Winner bonus: 1.53x Total DMG', 'Green', 'Green Mushroom'],
    ['Eugene_and_his_Frosted_Crabs', 'Winner bonus: +7% Drop Rate', 'Yellow', 'Crabcake'],
    ['Pablo_and_his_Plump_Piggies', 'Winner bonus: 1.28x Total DMG', 'White', 'Mr Pig'],
    ['Shinji_and_his_Inevitable_Army', 'Winner bonus: +10 Library Max', 'Cyan', 'Samurai Guardian'],
    ['Danny_and_his_Shiny_Fishies', 'Winner bonus: 9.75x Total DMG', 'Teal', 'Equinox Broadbass']
  ])('read %s', (name, description, circuit, opponent) => {
    const node = byName(name);
    expect(spaced(node.description)).toBe(description);
    expect(node.fields).toEqual([
      { label: 'Circuit', value: `${circuit} circuit` },
      { label: 'Opponent', value: opponent }
    ]);
  });

  it('give every battle a circuit', () => {
    expect(battles.filter((node) => !fieldOf(node, 'Circuit')).map((node) => node.name)).toEqual([]);
  });
});
