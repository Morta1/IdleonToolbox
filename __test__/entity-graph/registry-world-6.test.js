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

describe('farming market upgrades', () => {
  const upgrades = ofKind('marketupgrade');
  const byName = (name) => upgrades.find((node) => spaced(node.name) === name);
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const indexOf = (node) => Number(node.rawName.replace('FarmMarket', ''));
  const isDay = (node) => indexOf(node) < 8;

  it('build one page per upgrade', () => {
    expect(report.marketupgrade).toEqual({ count: data.marketInfo.length, skipped: [] });
  });

  // Oracle: FarmingStuffs.js:281-284 MarketMaxLV: slot 0 of either market and Night slot 5 are hard caps.
  it('cap the three hard-capped upgrades and give the rest a base maximum', () => {
    const capped = upgrades.filter((node) => node.effect.cap !== null);
    expect(Object.fromEntries(capped.map((node) => [spaced(node.name), node.effect.cap]))).toEqual({
      'Land Plots': 20,
      Overgrowth: 1,
      'Land Rank': 1
    });
    expect(upgrades.filter((node) => fieldOf(node, 'Base max level')).map((node) => node.name)).toEqual(
      upgrades.filter((node) => node.effect.cap === null).map((node) => node.name)
    );
  });

  // Oracle: FarmingStuffs.js rows 0-7 are the Day market, 8-15 the Night market (t = floor(i / 8)).
  it('split the market and the currency at index 8', () => {
    expect(upgrades.map((node) => [indexOf(node), fieldOf(node, 'Market')])).toEqual(
      upgrades.map((node) => [indexOf(node), isDay(node) ? 'Day market' : 'Night market'])
    );
    expect(upgrades.map((node) => [indexOf(node), costsAt(node, 1)[0].currency])).toEqual(
      upgrades.map((node) => [indexOf(node), isDay(node) ? 'Crops' : 'Magic Beans'])
    );
  });

  it('keep the acronyms in the names and the default cost note', () => {
    expect(['Evolution GMO', 'OG Fertilizer'].map((name) => spaced(byName(name)?.name))).toEqual(['Evolution GMO', 'OG Fertilizer']);
    expect(costsAt(byName('Land Plots'), 1)[0].note).toBeUndefined();
  });

  // Oracle: FarmingStuffs.js:179-284 (MarketCostQTY floors below 1e8). The parser's cost (farming.ts:71)
  // is unfloored, so these are pinned from the game.
  it.each([
    ['Land Plots', 1, 'You get 1 extra plots'],
    ['Stronger Vines', 1, '+2% chance'],
    ['Stronger Vines', 10, '+20% chance'],
    ['Biology Boost', 1, '+15% chance'],
    ['Biology Boost', 10, '+150% chance'],
    ['Evolution GMO', 1, '1.01x crop evolution chance per crop you have 200 of'],
    ['Evolution GMO', 10, '1.08x crop evolution chance'],
    ['Super GMO', 1, '+0.5% all'],
    ['Super GMO', 10, '+5% all']
  ])('fill %s at level %i', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it.each([
    ['Land Plots', 2, '4'],
    ['Stronger Vines', 1, '2'],
    ['Stronger Vines', 2, '2'],
    ['Biology Boost', 1, '10'],
    ['Biology Boost', 2, '11'],
    ['Biology Boost', 10, '23'],
    ['Evolution GMO', 1, '15'],
    ['Evolution GMO', 2, '16'],
    ['Evolution GMO', 10, '29'],
    ['Super GMO', 1, '250'],
    ['Super GMO', 2, '300'],
    ['Super GMO', 10, '1,289'],
    ['Overgrowth', 1, '10'],
    ['Land Rank', 1, '80']
  ])('price %s at level %i at %s', (name, level, expected) => {
    expect(costAt(name, level)).toBe(expected);
  });

  it('total the capped upgrades and leave the raised ones open', () => {
    expect(formatAmount(costsToMax(byName('Land Plots'))[0].value)).toBe('2,097,150');
    expect(costsToMax(byName('Stronger Vines'))[0].value).toBeNull();
  });

  it('read the crop paid, the unlock and the base maximum', () => {
    expect(byName('Land Plots').fields).toEqual([
      { label: 'Market', value: 'Day market' },
      { label: 'Crop paid', value: 'Basic crop 1 at level 1, Earthy crop 14 at level 10' }
    ]);
    expect(byName('Stronger Vines').fields).toEqual([
      { label: 'Market', value: 'Day market' },
      { label: 'Crops found to unlock', value: 3 },
      { label: 'Base max level', value: "500 (raised by the Day 'N' Nite research square)" },
      { label: 'Crop paid', value: 'Basic crop 2 at level 1, Basic crop 3 at level 10' }
    ]);
    expect(fieldOf(byName('Biology Boost'), 'Crop paid')).toMatch(/^Bulbo crop 1 at level 1/);
    expect(fieldOf(byName('Evolution GMO'), 'Crops found to unlock')).toBe(25);
    expect(fieldOf(byName('Super GMO'), 'Base max level')).toBe("50 (raised by the Day 'N' Nite research square)");
    expect(fieldOf(byName('Evolution GMO'), 'Crop paid')).toBeUndefined();
  });
});

describe('exotic market upgrades', () => {
  const upgrades = ofKind('exoticupgrade');
  const byName = (name) => upgrades.find((node) => spaced(node.name) === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));

  // Oracle: farming.ts:147 drops the NAME_MAGNI spare slots the same way.
  it('skip exactly the spare slots', () => {
    const spare = data.exoticMarketInfo.flatMap((entry, index) => (entry.name === 'NAME_MAGNI' ? [index] : []));
    expect(spare.length).toBeGreaterThan(0);
    expect(report.exoticupgrade.skipped).toEqual(spare.map((index) => ({ index, reason: 'placeholder: no bonus yet' })));
    expect(upgrades).toHaveLength(data.exoticMarketInfo.length - spare.length);
  });

  it('keep the numerals and leading digits in the names', () => {
    expect(['Sproutluck I', 'Geneology IV', '4 Leaf Clover'].map((name) => spaced(byName(name)?.name))).toEqual([
      'Sproutluck I',
      'Geneology IV',
      '4 Leaf Clover'
    ]);
  });

  // Oracle: FarmingStuffs.js:251-280 ExoticBonusQTY, shown through N.js:108717 (cross-check farming.ts:106-126).
  // Datadigging at 0, 1 and 1000 is pinned with the formula; these are the levels it has not been run at.
  it.each([
    ['Sproutluck I', ['1x crop', '1.05x crop', '1.45x crop', '3.5x crop']],
    ['Geneology I', ['+0.01% crop', '+0.06% crop', '+0.55% crop', '+3% crop']],
    ['Better Day I', ['+0.04% cheaper', '+0.4% cheaper', '+3.64% cheaper', '+20% cheaper']],
    ['Briar Patch', ['+1% Total', '+10% Total', '+100% Total', '+1,000% Total']],
    ['Snapegrass', ['1.01x Jade', '1.15x Jade', '2.36x Jade', '8.5x Jade']]
  ])('fill %s at levels 1, 10, 100 and 1000', (name, expected) => {
    expect([1, 10, 100, 1000].map((level, i) => textAt(name, level).slice(0, expected[i].length))).toEqual(expected);
  });

  it('round the Datadigging level up', () => {
    expect([500, 2000].map((level) => textAt('Datadigging', level).slice(0, 9))).toEqual(['+2 higher', '+4 higher']);
  });

  it('read what each upgrade trades and the art it uses', () => {
    expect(['Sproutluck I', 'Geneology I', 'Datadigging', 'Briar Patch', 'Snapegrass'].map(
      (name) => [name, fieldOf(byName(name), 'Trades'), byName(name).icon]
    )).toEqual([
      ['Sproutluck I', 'All of your Basic crop 4', '/data/FarmCrop3.png'],
      ['Geneology I', 'All of your Basic crop 10', '/data/FarmCrop9.png'],
      ['Datadigging', 'All of your Earthy crop 5', '/data/FarmCrop25.png'],
      ['Briar Patch', 'All of your Sushi crop 4', '/data/FarmCrop64.png'],
      ['Snapegrass', 'All of your Mushie crop 8', '/data/FarmCrop91.png']
    ]);
  });

  it('name where the decay upgrades approach by their text token', () => {
    expect(['Sproutluck I', 'Geneology I', 'Datadigging', 'Better Day I', 'Snapegrass'].map(
      (name) => fieldOf(byName(name), 'Bonus approaches')
    )).toEqual(['6x', '+6%', '+5', '+40%', '16x']);
    expect(fieldOf(byName('Briar Patch'), 'Bonus approaches')).toBeUndefined();
  });

  it('give every upgrade a purchase size, no cost and no cap', () => {
    expect(upgrades.filter((node) => !fieldOf(node, 'Levels per purchase') || node.cost || node.effect.cap !== null)).toEqual([]);
  });
});
