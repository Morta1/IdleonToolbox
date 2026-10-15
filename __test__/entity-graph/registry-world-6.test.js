import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes, registryReport } from '../../scripts/entity-graph/registry/build.mjs';
import world6 from '../../scripts/entity-graph/registry/world-6/index.mjs';
import summoningBattle from '../../scripts/entity-graph/registry/world-6/summoning-battle.mjs';
import { ESSENCE } from '../../scripts/entity-graph/registry/world-6/summoning-upgrade.mjs';
import { tidy } from '../../scripts/entity-graph/registry/text.mjs';
import { costsAt, costsToMax, formatAmount, FORMULAS, levelledText } from '../../utility/wiki/effects.mjs';
import { oneIn, percentLabel } from '../../utility/wiki/odds.mjs';
import { summonEssenceColor } from '@parsers/world-6/summoning';
import { getDoorMaxHps, getFloorDifficulty, getStealthForDetection } from '@parsers/world-6/sneaking';
import { isFifthColumnRank } from '@parsers/world-6/farming';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, world6);
const report = registryReport(data, world6);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);
const spaced = (text) => String(text).replace(/_/g, ' ');
const fieldOf = (node, label) => node.fields?.find((field) => field.label === label)?.value;
// The whole field, links included, of the page with this id.
const fieldAt = (id, label) => nodes[id].fields.find((field) => field.label === label);

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

  // Oracle: the buy check (N.js:110248) stops a purchase at maxLvl, the 9999 rows included.
  it('cap every upgrade at its maxLvl', () => {
    expect(upgrades.map((node) => [node.rawName, node.effect.cap])).toEqual(
      data.summoningUpgrades.map((entry, index) => [`SummonUpg${index}`, entry.maxLvl])
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
      { label: 'Unlocked by', value: 'White Essence Champ at level 1', links: ['summoningupgrade:SummonUpg0'], linkAs: 'unlockedBy' },
      { label: 'Summoning Doubler', value: 'Can be doubled' }
    ]);
    expect(byName('Dodge_Roll').fields).toEqual([
      { label: 'Essence', value: 'White' },
      { label: 'Unlocked by', value: 'Mana Generation at level 1', links: ['summoningupgrade:SummonUpg5'], linkAs: 'unlockedBy' }
    ]);
    expect(fieldOf(byName('White_Essence_Champ'), 'Unlocked by')).toBeUndefined();
    expect(fieldOf(byName('Muddah'), 'Unlocked by')).toBe('Blind Gallopera, the lore boss of Chucklemire (Teal Summoning)');
    expect(fieldAt('summoningupgrade:SummonUpg71', 'Unlocked by')).toEqual({
      label: 'Unlocked by',
      value: 'Blind Gallopera, the lore boss of Chucklemire (Teal Summoning)',
      links: ['spelunktunnel:SpelunkTunnel4'],
      linkAs: 'unlockedBy'
    });
    expect(['Sharpened_Spikes', 'Unit_Ache_Pea'].map((name) => fieldOf(byName(name), 'Unlocked by'))).toEqual(['Another Slot (Yellow) at level 1', 'Another Slot (Blue) at level 1']);
    // The two share a name, so the pair resolves by idReq.
    expect([fieldAt('summoningupgrade:SummonUpg35', 'Unlocked by'), fieldAt('summoningupgrade:SummonUpg68', 'Unlocked by')].map((field) => field.links)).toEqual([
      ['summoningupgrade:SummonUpg34'],
      ['summoningupgrade:SummonUpg25']
    ]);
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
    ['Jonesy_and_his_Lil_Mushies', 'Winner bonus: 1.53x Total DMG', 'Green', 'Green Mushroom', 'mushG'],
    ['Eugene_and_his_Frosted_Crabs', 'Winner bonus: +7% Drop Rate', 'Yellow', 'Crabcake', 'crabcake'],
    ['Pablo_and_his_Plump_Piggies', 'Winner bonus: 1.28x Total DMG', 'White', 'Mr Pig', 'Pet1'],
    ['Shinji_and_his_Inevitable_Army', 'Winner bonus: +10 Library Max', 'Cyan', 'Samurai Guardian', 'w6d3'],
    ['Danny_and_his_Shiny_Fishies', 'Winner bonus: 9.75x Total DMG', 'Teal', 'Equinox Broadbass', 'w7a1']
  ])('read %s', (name, description, circuit, opponent, enemyId) => {
    const node = byName(name);
    expect(spaced(node.description)).toBe(description);
    expect(node.fields).toEqual([
      { label: 'Circuit', value: `${circuit} circuit` },
      { label: 'Opponent', value: opponent, links: [`monster:${enemyId}`], linkAs: 'features' }
    ]);
  });

  // Names collide (a Bunny in the pet and the breeding tables), so the link is the enemy id, never the text.
  it('link the opponent by enemy id', () => {
    expect(fieldAt('summoningbattle:SummonBattle_w7b1', 'Opponent')).toEqual({
      label: 'Opponent',
      value: 'Trench Fish',
      links: ['monster:w7b1'],
      linkAs: 'features'
    });
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
    ['Overgrowth', 1, 'Each OG doubles crop value & EXP'],
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
      {
        label: 'Base max level',
        value: "500 (raised by the Day 'N' Nite research square)",
        links: ['researchsquare:ResGrid171'],
        linkAs: 'maxRaisedBy'
      },
      { label: 'Crop paid', value: 'Basic crop 2 at level 1, Basic crop 3 at level 10' }
    ]);
    expect(fieldOf(byName('Biology Boost'), 'Crop paid')).toBe('Bulbo crop 1 at level 1, Bulbo crop 2 at level 13');
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

describe('farming seeds', () => {
  const seeds = ofKind('seed');
  const byName = (name) => seeds.find((node) => node.name === name);

  it('build one page per seed, with no description', () => {
    expect(report.seed).toEqual({ count: data.seedInfo.length, skipped: [] });
    expect(seeds.filter((node) => node.description)).toEqual([]);
    expect(seeds.map((node) => node.icon)).toEqual(data.seedInfo.map((entry) => `/etc/Seed_${entry.seedId}.png`));
  });

  // Oracle: FarmingStuffs.js:285-372 NextCropChance, cross-checked by farming.ts:1196-1197.
  it('read the level, crops and decay of the Basic, Glassy and Medal seeds', () => {
    expect(byName('Basic').fields).toEqual([
      { label: 'Farming level needed', value: 1 },
      { label: 'Crops', value: 21 },
      { label: 'Base evolution chance', value: '30% on the first crop, x0.75 per crop after' }
    ]);
    expect(byName('Glassy').fields).toEqual([
      { label: 'Farming level needed', value: 120 },
      { label: 'Crops', value: 123 },
      { label: 'Base evolution chance', value: '30% on the first crop, x0.05 per crop after' }
    ]);
    expect(byName('Medal').fields).toEqual([
      { label: 'Farming level needed', value: 120 },
      { label: 'Crops', value: 100 },
      { label: 'Base evolution chance', value: '30% on the first crop, x0.003 per crop after' },
      { label: 'Unlocked by', value: 'Greg, the lore boss of Blushpit', links: ['spelunktunnel:SpelunkTunnel3'], linkAs: 'unlockedBy' }
    ]);
  });

  // The game fills the base list with SeedInfo[0][5] for every seed (N.js:110611), so seedInfo[1..6].nextCropChance is never read.
  it('start every seed at the first seed chance', () => {
    expect(seeds.map((node) => fieldOf(node, 'Base evolution chance').slice(0, 3))).toEqual(seeds.map(() => '30%'));
    expect(data.seedInfo.slice(1).some((entry) => entry.nextCropChance !== data.seedInfo[0].nextCropChance)).toBe(true);
  });

  it('flag only the Medal seed as lore-gated', () => {
    expect(seeds.filter((node) => fieldOf(node, 'Unlocked by')).map((node) => node.name)).toEqual(['Medal']);
  });
});

describe('land rank upgrades', () => {
  const upgrades = ofKind('landrank');
  const byName = (name) => upgrades.find((node) => spaced(node.name) === name);
  const indexOf = (node) => Number(node.rawName.replace('LandRank', ''));
  const textAt = (name, level) => spaced(levelledText(byName(name), level));

  it('build one page per name', () => {
    expect(report.landrank).toEqual({ count: data.ninjaExtraInfo[34].length, skipped: [] });
    expect(upgrades.map((node) => node.icon)).toEqual(data.ninjaExtraInfo[34].map((name, i) => `/data/RankUpg${i}.png`));
  });

  // Oracle: farming.ts:860 isFifthColumnRank. The linear column is the one with a base maximum.
  it('mark the fifth column as linear with a base maximum', () => {
    const linear = upgrades.filter((node) => node.effect.terms.some((term) => term.formula === 'linear'));
    expect(linear.map(indexOf)).toEqual(upgrades.map(indexOf).filter(isFifthColumnRank));
    expect(upgrades.filter((node) => fieldOf(node, 'Base max level')).map(indexOf)).toEqual(linear.map(indexOf));
    expect(upgrades.filter((node) => node.effect.cap !== null)).toEqual([]);
  });

  // Oracle: FarmingStuffs.js:109-118 LankRankUpgBonus, filled through N.js:108680. calcRankBonus (farming.ts:852) is unexported.
  it.each([
    ['Evolution Boost', 1, 'Increases next crop chance by +5.25% per rank of the land plot'],
    ['Evolution Boost', 10, '+47.22%'],
    ['Evolution Boost', 100, '+236.11%'],
    ['Seed of Loot', 1, '+10%'],
    ['Seed of Loot', 10, '+100%'],
    ['Evolution Ultraboost', 1, '+839.51%']
  ])('fill %s at level %i', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it('read the total rank needed', () => {
    expect(['Evolution Boost', 'Seed of Loot', 'Evolution Ultraboost'].map((name) => fieldOf(byName(name), 'Total Land Rank needed'))).toEqual([1, 400, 1300]);
    expect(fieldOf(byName('Seed of Loot'), 'Base max level')).toBe('1 (raised by the Grimoire, the Datadigging exotic upgrade and a legend talent)');
    expect(fieldAt('landrank:LandRank4', 'Base max level')).toEqual({
      label: 'Base max level',
      value: '1 (raised by the Grimoire, the Datadigging exotic upgrade and a legend talent)',
      links: ['exoticupgrade:ExoticMarket15'],
      linkAs: 'maxRaisedBy'
    });
  });

  it('spend one Land Rank point per level', () => {
    expect([1, 10].map((level) => costsAt(byName('Evolution Boost'), level)[0])).toEqual([
      { value: 1, currency: 'Land Rank points', currencyOne: 'Land Rank point', note: 'One point per level.' },
      { value: 1, currency: 'Land Rank points', currencyOne: 'Land Rank point', note: 'One point per level.' }
    ]);
  });
});

describe('ninja knowledge upgrades', () => {
  const upgrades = ofKind('ninjaupgrade');
  const byName = (name) => upgrades.find((node) => spaced(node.name) === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const costsOf = (name) => [1, 2, 10].map((level) => formatAmount(costsAt(byName(name), level)[0].value));

  // Oracle: the unnamed spare slot reads 'Name' / 'Desc' in the data; the index is derived, never typed.
  it('skip exactly the placeholder slot', () => {
    const spare = data.ninjaUpgrades.flatMap((entry, index) => (entry.name === 'Name' ? [index] : []));
    expect(spare).toHaveLength(1);
    expect(report.ninjaupgrade.skipped).toEqual([{ index: spare[0], reason: 'placeholder: no upgrade yet' }]);
    expect(upgrades).toHaveLength(data.ninjaUpgrades.length - 1);
  });

  // Oracle: Ninja.js:187-273 JadeUpgCost (the parser's cost is inside getSneaking), display N.js:109130-109132.
  it.each([
    ['Centurion Lineage', 'costs 1.05x less every 100th level', 'costs 1.5x less every 100th level', ['2.00e45', '2.62e45', '2.27e46']],
    ['Way of Bargain', 'by 1.01x', 'by 1.1x', ['100,000,000', '113,000,000', '300,404,194']],
    ['Respect for the Art', '+3% bonus', '+30% bonus', ['8,500', '9,520', '23,571']],
    ['Way of Stealth', '+1 Stealth per Sneaking Lv', '+10 Stealth per Sneaking Lv', ['50', '54', '99']],
    ['Star Sweeping', 'up to 1 times a day', 'up to 10 times a day', ['25,000', '625,000', '9.54e16']],
    ['Strange Symbols', 'successful 1.02x more often', 'successful 1.2x more often', ['1.00e17', '3.10e17', '2.64e21']],
    ['Jadevalanche', '1.03x higher Jade Gain', '1.3x higher Jade Gain', ['1.00e44', '1.25e44', '7.45e44']]
  ])('fill and price %s', (name, atOne, atTen, costs) => {
    expect(textAt(name, 1)).toContain(atOne);
    expect(textAt(name, 10)).toContain(atTen);
    expect(costsOf(name)).toEqual(costs);
    expect(costsAt(byName(name), 1)[0]).toMatchObject({ currency: 'Jade Coins', note: undefined });
  });

  // Oracle: N.js:109130-109132 draws the arrow only behind the prerequisite; N.js:80489 rewrites four of them by Ninja Mastery.
  it('name what unlocks each upgrade', () => {
    const gated = ['Centurion Lineage', 'Way of Bargain', 'Mastery Loot', 'Gemstone Pilfer'];
    expect(Object.fromEntries(gated.map((name) => [name, fieldOf(byName(name), 'Unlocked by')]))).toEqual({
      'Centurion Lineage': 'Ninja Mastery 5, then Way of Bargain at level 1',
      'Way of Bargain': 'Ninja Mastery 3, then Way of Haste at level 1',
      'Mastery Loot': 'Ninja Mastery 1, then Mahjong Boosters at level 1',
      'Gemstone Pilfer': 'Ninja Mastery 1, then Glove Ingenuity at level 1'
    });
    expect(fieldAt('ninjaupgrade:NinjaUpg0', 'Unlocked by')).toEqual({
      label: 'Unlocked by',
      value: 'Ninja Mastery 5, then Way of Bargain at level 1',
      links: ['ninjaupgrade:NinjaUpg1'],
      linkAs: 'unlockedBy'
    });
    expect(fieldOf(byName('Way of Stealth'), 'Unlocked by')).toBeUndefined();
    expect(fieldOf(byName('Respect for the Art'), 'Unlocked by')).toBe('Currency Conduit at level 1');
  });

  // Oracle: N.js:109130, 80489 (Spelunk[13][3] > t - 17, the Coral Reef mini upgrade).
  it('unlock the last rows one at a time with Coral Reef', () => {
    expect(fieldOf(byName('Strange Symbols'), 'Unlocked by')).toBe('Coral Reef: level 1 of the upgrade that adds mini Ninja Knowledge upgrades');
    expect(fieldAt('ninjaupgrade:NinjaUpg17', 'Unlocked by')).toEqual({
      label: 'Unlocked by',
      value: 'Coral Reef: level 1 of the upgrade that adds mini Ninja Knowledge upgrades',
      links: ['station:coralreef'],
      linkAs: 'unlockedBy'
    });
    expect(fieldOf(byName('Jadevalanche'), 'Unlocked by')).toBe('Coral Reef: level 12 of the upgrade that adds mini Ninja Knowledge upgrades');
  });

  it('have no cap', () => {
    expect(upgrades.filter((node) => node.effect.cap !== null)).toEqual([]);
  });
});

describe('pristine charms', () => {
  const charms = ofKind('pristinecharm');
  const byName = (name) => charms.find((node) => spaced(node.name) === name);

  it('build one page per charm', () => {
    expect(report.pristinecharm).toEqual({ count: data.pristineCharms.length, skipped: [] });
    expect(charms.map((node) => node.icon)).toEqual(data.pristineCharms.map((entry) => `/data/${entry.rawName}.png`));
  });

  // Oracle: Ninja.js:583 PristineBon is x3 once collected; sneaking.ts:214-219 reads the same list.
  it('fill the bonus from its value', () => {
    expect(spaced(byName('Sparkle Log').description)).toBe('1.2x Total DMG. Hold down to add this Pristine Charm to your collection in the Lobby. Click it there to see its bonus.');
    expect(spaced(byName('Fruit Rolle').description)).toMatch(/^\+20% AGI/);
    expect(spaced(byName('Crystal Comb').description)).toMatch(/^1\.3x Bigger Summoning Winner Bonuses/);
    expect(spaced(byName('Stick of Chew').description)).toMatch(/^1\.3x All Essence Generation/);
  });

  it('carry a fixed value: no calculator and no cost', () => {
    expect(charms.filter((node) => node.effect || node.cost)).toEqual([]);
  });

  // Oracle: N.js:106325, cross-checked by sneaking.ts:228-232.
  it('say the same thing about where every charm is found', () => {
    expect([...new Set(charms.map((node) => fieldOf(node, 'Found')))]).toEqual([
      'Replaces a sneaking charm drop: a base 0.15% on the first charm of the day, falling to 0 after 120 (before the Pristine Collector compass bonus)'
    ]);
    expect(fieldAt('pristinecharm:NjTrP0', 'Found')).toEqual({
      label: 'Found',
      value: 'Replaces a sneaking charm drop: a base 0.15% on the first charm of the day, falling to 0 after 120 (before the Pristine Collector compass bonus)',
      links: ['compassupgrade:CompassUpg54'],
      linkAs: 'boostedBy'
    });
  });
});

describe('sneaking items', () => {
  const items = ofKind('ninjaitem');
  const equipment = Object.values(data.ninjaEquipment);
  const byName = (name) => items.find((node) => spaced(node.name) === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const familyOf = (rawName) => rawName.replace(/\d+$/, '');
  const rawNames = items.map((node) => node.rawName);

  it('skip exactly the empty slot', () => {
    const blank = equipment.findIndex((entry) => entry.rawName === 'Blank');
    expect(blank).toBeGreaterThanOrEqual(0);
    expect(report.ninjaitem).toEqual({ count: equipment.length - 1, skipped: [{ index: blank, reason: 'placeholder: empty slot' }] });
  });

  // Oracle: the rawName families Ninja.js names its items by; weapons split by NjEQ subType (1 nunchaku, 2 kunai).
  it('name the type of every item', () => {
    const FAMILY = { NjItem: 'Hat', NjTr: 'Charm', NjGem: 'Gemstone', NjSym: 'Symbol', NjGl: 'Gloves' };
    const WEAPON = { 1: 'Nunchaku', 2: 'Kunai' };
    expect(Object.fromEntries(items.map((node) => [node.rawName, fieldOf(node, 'Type')]))).toEqual(Object.fromEntries(rawNames.map(
      (rawName) => [rawName, FAMILY[familyOf(rawName)] ?? WEAPON[data.ninjaEquipment[rawName].subType]]
    )));
  });

  it('give hats and symbols no calculator', () => {
    expect(items.filter((node) => !node.effect).map((node) => node.rawName)).toEqual(
      rawNames.filter((rawName) => ['NjItem', 'NjSym'].includes(familyOf(rawName)))
    );
  });

  // Oracle: Ninja.js:422-464 ItemStat and Ninja.js:9-21 GemstoneBonus, printed through N.js:109113 and 109135, where
  // NotateNumber "Big" floors below 1,000. getGemstoneBonus (sneaking.ts:301) is unexported, so the values are pinned.
  it.each([
    ['Ninja Log', 10, 'If detected, +10% chance to not be knocked out'],
    ['Ninja Log', 100, 'If detected, +14% chance to not be knocked out'],
    ['Silk Veil', 1000, 'Gives you 15.99x Total Stealth'],
    ['Gold Star', 1, "If in Inventory, charms found have a +2 higher Max LV. Doesn't stack with other Gold Stars"],
    ['Wood Nunchaku', 10, 'When equipped, deal damage to the door to unlock the next floor. Base Damage: 79'],
    ['Wood Nunchaku', 200, 'When equipped, deal damage to the door to unlock the next floor. Base Damage: 1.65e12'],
    ['Basic Kunai', 1, 'When equipped, untie any trapped ninja on the same floor. Base Rate: 6'],
    ['Basic Kunai', 100, 'When equipped, untie any trapped ninja on the same floor. Base Rate: 923,076,501'],
    ['Leather Gloves', 10, 'When equipped, you search for Jade and Items faster. Base Rate: 20%'],
    ['Aquamarine', 1, '+49% Stealth for all Ninjas'],
    ['Aquamarine', 1000, '+5,040% Stealth for all Ninjas'],
    ['Emerald', 1000, '92% Cheaper Upgrades']
  ])('fill %s at level %i', (name, level, expected) => {
    expect(textAt(name, level)).toBe(expected);
  });

  it('count gems added for gemstones and item levels for the rest', () => {
    expect([byName('Aquamarine').effect, byName('Ninja Log').effect].map(({ levelLabel, cap }) => ({ levelLabel, cap }))).toEqual([
      { levelLabel: 'Gems added', cap: null },
      { levelLabel: 'Item level', cap: null }
    ]);
  });

  // Oracle: N.js:109113 appends the hat line; the symbol sentence drops its slot readouts.
  it('read hats as cosmetic and symbols by their boost chance', () => {
    expect(spaced(byName('Straw Hat').description)).toBe('A basic hat made of straw held together by string! Hats are just cosmetic.');
    expect(['Lesser Symbol', 'Modest Symbol', 'Grand Symbol'].map((name) => [spaced(byName(name).description), fieldOf(byName(name), 'Boost chance')])).toEqual([
      ['Hold down for a chance to boost this slot. Charms here will then give a higher bonus!', undefined],
      ['Hold down for a chance to boost this slot. Charms here will then give a higher bonus!', "5x a Lesser Symbol's"],
      ['Hold down for a chance to boost this slot. Charms here will then give a higher bonus!', "20x a Lesser Symbol's"]
    ]);
  });

  // Oracle: GenerateItem (N.js:106320-106323) rolls NinjaInfo[12 + f] for floor f + 1, first hit wins and the last entry
  // takes the rest; changemonsterDEF (N.js:80489, gameTables.sneakingMasteryDrops) adds the Mastery items.
  it('list the floors each item drops on, with the real chance or the Mastery that adds it', () => {
    expect(['Straw Hat', 'Ninja Log', 'Leather Gloves'].map((name) => fieldOf(byName(name), 'Found on'))).toEqual([
      ['Floor 1: 99.9%', 'Floor 2: 1 in 20 (5.00%)'],
      ['Floor 2: 1 in 5 (19.0%)'],
      ['Floor 8: 1 in 15 (6.51%)']
    ]);
    expect(fieldAt('ninjaitem:NjGl0', 'Found on')).toEqual({
      label: 'Found on', value: ['Floor 8: 1 in 15 (6.51%)'], links: ['sneakfloor:SneakFloor7'], linkAs: 'locatedIn'
    });
    expect([fieldAt('ninjaitem:NjGem0', 'Found on'), fieldOf(byName('Emerald'), 'Found on')]).toEqual([
      { label: 'Found on', value: ['Floor 2, from Ninja Mastery 1'], links: ['sneakfloor:SneakFloor1'], linkAs: 'locatedIn' },
      ['Floor 5, from Ninja Mastery 1 (needs a Wind Walker)']
    ]);
    const dropped = new Set([
      ...data.ninjaExtraInfo.slice(12, 12 + data.ninjaExtraInfo[3].length).flat(),
      ...data.gameTables.sneakingMasteryDrops.flatMap(({ items: added }) => added.map(({ item }) => item))
    ]);
    expect(items.filter((node) => !fieldOf(node, 'Found on')).map((node) => node.rawName)).toEqual(
      rawNames.filter((rawName) => !dropped.has(rawName))
    );
  });

  // Oracle: GenerateItem's charm branch (N.js:106325, gameTables.sneakingSymbolDrop): 0.1 x max(0, 2.5 - charms today / 30)
  // once Strange Symbols (Ninja Knowledge 17) has a level, then a 10% step up to Modest and another 10% to Grand,
  // each raised by Charming Symbols (Ninja Knowledge 20). The charm count resets daily (N.js:139953).
  it('say how a charm drop turns into each symbol', () => {
    const found = {
      label: 'Found',
      value: 'Replaces a charm drop once Strange Symbols is at level 1: 25% on the first charm of the day, falling to 0 after 75',
      links: ['ninjaupgrade:NinjaUpg17'],
      linkAs: 'unlockedBy'
    };
    const share = (value, links) => ({ label: 'Share of symbols', value, ...(links ? { links, linkAs: 'boostedBy' } : {}) });
    expect(['NjSym0', 'NjSym1', 'NjSym2'].map((rawName) => nodes[`ninjaitem:${rawName}`].fields.slice(-2))).toEqual([
      [found, share('90% (before Charming Symbols, which makes the rarer ones likelier)')],
      [found, share('9% (before Charming Symbols)', ['ninjaupgrade:NinjaUpg20'])],
      [found, share('1% (before Charming Symbols)', ['ninjaupgrade:NinjaUpg20'])]
    ]);
  });
});

describe('sneaking floors', () => {
  const floors = ofKind('sneakfloor');
  const info = data.ninjaExtraInfo;
  const doors = info[3];
  const valueAt = (node, token, level) => {
    const { formula, args } = node.effect.terms.find((term) => term.token === token);
    return FORMULAS[formula](level, args);
  };
  const itemName = (rawName) => spaced(data.ninjaEquipment[rawName].name);

  // Oracle: DoorMaxHP walks NinjaInfo[3] for every floor (N.js:93512); NjD<f> is the floor's door art (N.js:110010).
  it('build one page per floor, named and drawn by its door', () => {
    expect(report.sneakfloor).toEqual({ count: doors.length, skipped: [] });
    expect(floors.map((node) => [node.rawName, node.name, node.icon])).toEqual(doors.map((_, f) => [`SneakFloor${f}`, `Floor ${f + 1}`, `/data/NjD${f}.png`]));
  });

  // Oracle: the game raises Ninja Mastery whenever every floor is open, with no ceiling (N.js:93501).
  it('count Ninja Mastery from 0 with no max', () => {
    expect([...new Set(floors.map(({ effect: { levelLabel, from, cap, noMax } }) => JSON.stringify({ levelLabel, from, cap, noMax })))]).toEqual([
      JSON.stringify({ levelLabel: 'Ninja Mastery', from: 0, cap: null, noMax: true })
    ]);
  });

  // Oracle: the app's own replicas of changemonsterDEF (sneaking.ts getDoorMaxHps, getFloorDifficulty, getStealthForDetection),
  // and for the Jade Coin and EXP rows the game's rescale written out: 0.1 x row[f] x row[11]^mastery (N.js:80485-80486).
  it.each([0, 1, 2])('rescale every floor stat at Ninja Mastery %i as the game does', (mastery) => {
    const game = (row, f) => (mastery ? 0.1 * Number(info[row][f]) * Math.pow(Number(info[row][11]), mastery) : Number(info[row][f]));
    expect(floors.map((node) => ['{', '}', '$', '#'].map((token) => valueAt(node, token, mastery)))).toEqual(doors.map((_, f) => [
      getDoorMaxHps(mastery, mastery)[f],
      getStealthForDetection(0, getFloorDifficulty(f, mastery)),
      game(10, f),
      game(11, f)
    ]));
  });

  it.each([
    [0, 'Door HP: 800. Stealth for 0% detection: 800. Base Jade Coins per action: 300. Base EXP per action: 150.'],
    [1, 'Door HP: 3.20e11. Stealth for 0% detection: 1.60e9. Base Jade Coins per action: 1.80e9. Base EXP per action: 375,000,000.']
  ])('read Floor 3 at Ninja Mastery %i', (mastery, text) => {
    expect(levelledText(nodes['sneakfloor:SneakFloor2'], mastery)).toBe(text);
  });

  // Oracle: GenerateItem (N.js:106320-106323) keeps the first entry whose roll hits and always the last, so an entry
  // lands only when every roll above it missed: its own roll times the product of the misses.
  it('give each loot line its real chance at Mastery 0', () => {
    const list = info[12 + 2];
    const lines = [];
    for (let i = 0; i < list.length; i += 2) {
      const roll = i === list.length - 2 ? 1 : Number(list[i + 1]);
      let misses = 1;
      for (let j = 0; j < i; j += 2) misses *= 1 - Number(list[j + 1]);
      lines.push(`${itemName(list[i])}: ${oneIn(roll * misses)} (${percentLabel(roll * misses)})`);
    }
    expect(fieldAt('sneakfloor:SneakFloor2', 'Loot at Mastery 0')).toEqual({
      label: 'Loot at Mastery 0',
      value: lines,
      links: list.filter((_, i) => i % 2 === 0).map((rawName) => `ninjaitem:${rawName}`),
      linkAs: 'hosts'
    });
    expect(lines.at(-1)).toBe('Basic Kunai: 1 in 2 (54.2%)');
  });

  // A last entry that is likely but not certain reads as a percentage: never "1 in 1", never 100%.
  it('print a near-certain last entry as its percentage alone', () => {
    expect([fieldOf(nodes['sneakfloor:SneakFloor9'], 'Loot at Mastery 0').at(-1), fieldOf(nodes['sneakfloor:SneakFloor11'], 'Loot at Mastery 0').at(-1)])
      .toEqual(['Spiral Nunchaku: 75.0%', 'Black Belt: 99.99%']);
    expect(fieldOf(nodes['ninjaitem:NjTr19'], 'Found on')[0]).toBe('Floor 12: 99.99%');
  });

  // Oracle: GenerateItem passes over a hat already in Ninja[106] at 0.8 > randomFloat() (N.js:106322-106323, gameTables.sneakingHatReroll).
  it('note the found-before hat skip on every floor that drops a hat', () => {
    const withHats = doors.map((_, f) => f).filter((f) => info[12 + f].some((entry) => String(entry).includes('NjItem')));
    expect(floors.filter((node) => fieldOf(node, 'Hats found before')).map((node) => node.rawName)).toEqual(withHats.map((f) => `SneakFloor${f}`));
    expect(fieldOf(floors[0], 'Hats found before')).toBe('Skipped 80% of the time, the roll moving on down the list: the chances above are before that');
  });

  // Oracle: gameTables.sneakingMasteryDrops, located in changemonsterDEF (N.js:80489).
  it('list what each Ninja Mastery adds to its floor', () => {
    const fromMastery = (node) => node.fields.filter((field) => field.label.startsWith('From Ninja Mastery'));
    const expected = doors.map((_, f) => {
      const added = data.gameTables.sneakingMasteryDrops.filter(({ list }) => list === 12 + f);
      return [...new Set(added.map(({ mastery }) => mastery))].map((mastery) => {
        const here = added.filter((entry) => entry.mastery === mastery).flatMap(({ items: drops, classType }) => drops.map(({ item }) => ({ item, classType })));
        return {
          label: `From Ninja Mastery ${mastery}`,
          value: here.map(({ item, classType }) => `${itemName(item)}${classType === undefined ? '' : ` (needs a ${spaced(data.classes[classType])})`}`),
          links: here.map(({ item }) => `ninjaitem:${item}`),
          linkAs: 'hosts'
        };
      });
    });
    expect(floors.map(fromMastery)).toEqual(expected);
    expect(fromMastery(nodes['sneakfloor:SneakFloor4'])).toEqual([
      { label: 'From Ninja Mastery 1', value: ['Emerald (needs a Wind Walker)'], links: ['ninjaitem:NjGem6'], linkAs: 'hosts' },
      { label: 'From Ninja Mastery 2', value: ['Gold Star'], links: ['ninjaitem:NjTr21'], linkAs: 'hosts' }
    ]);
  });
});

// Oracle: FarmingStuffs.js:53-59 (StickerBonus), ResearchStuff.js:409 (FarmingStickersUnlocked), art N.js:109964.
describe('farming stickers', () => {
  const stickers = ofKind('sticker');
  const byName = (name) => stickers.find((node) => node.name === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));

  it('skip the joke stickers', () => {
    expect(report.sticker.skipped).toEqual(data.research[23]
      .map((name, index) => ({ name, index }))
      .filter(({ name }) => name === 'Nonexistent_Sticker')
      .map(({ index }) => ({ index, reason: 'placeholder: joke sticker' })));
  });

  it.each([
    ['Mega_Mongo_Sticker', 1, '1.1x'],
    ['Mega_Mongo_Sticker', 10, '2x'],
    ['UWU_Kawaii_Rice_Sticker', 1, '3.5x'],
    ['Laissez_Maize_Sticker', 10, '+50%']
  ])('fill %s at %i owned with %s', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it('draw the Sticker Depot art and name the square that unlocks them', () => {
    expect(byName('Mega_Mongo_Sticker').icon).toBe('/data/FarmStickerB0.png');
    expect([...new Set(stickers.map((node) => JSON.stringify(node.fields)))]).toEqual([
      JSON.stringify([{ label: 'Unlocked by', value: 'Sticker Depot research square', links: ['researchsquare:ResGrid88'], linkAs: 'unlockedBy' }])
    ]);
  });
});
