import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryEdges, registryNodes, registryReport } from '../../scripts/entity-graph/registry/build.mjs';
import classes from '../../scripts/entity-graph/registry/classes/index.mjs';
import { getCompassTotalUpgradeCost } from '../../parsers/class-specific/compass';
import { getGrimoireTotalUpgradeCost } from '../../parsers/class-specific/grimoire';
import { getTesseractTotalUpgradeCost } from '../../parsers/class-specific/tesseract';
import { costsAt, costsToMax, FORMULAS, formatAmount, levelledText } from '../../utility/wiki/effects.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, classes);
const report = registryReport(data, classes);
const edges = registryEdges(data, classes);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);
const spaced = (text) => String(text).replace(/_/g, ' ');
const fieldOf = (node, label) => node.fields?.find((field) => field.label === label)?.value;

// Both parsers price a node with every upgrade at level 0 exactly as the game prices it before discounts, so the wiki's
// cost formula at level L - 1 is compared with the parser's one-level total (the panel's notateBig floor comes after).
// `keep` leaves out the levels where the node's own level discounts the parser's price (account state).
const parityMismatches = (kind, parserCost, keep = () => true) => ofKind(kind).flatMap((node) => [1, 2, 10]
  .map((level) => Math.min(level, node.effect.cap ?? level))
  .filter((level) => keep(node, level))
  .map((level) => {
    const wiki = FORMULAS[node.cost.args.formula](level - 1, node.cost.args.args);
    const game = parserCost(node.order, level);
    return Math.abs(wiki - game) / game < 1e-12 ? null : `${node.rawName}@${level}`;
  })
  .filter(Boolean));

// Oracles: N.js:106375 (GrimoireUpgCost), 106384 (bonus), 111965-111988 (panel), Summoning.js:141-160.
describe('grimoire upgrades', () => {
  const upgrades = ofKind('grimoireupgrade');
  const byName = (name) => upgrades.find((node) => spaced(node.name) === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);
  const costToMax = (name) => formatAmount(costsToMax(byName(name))[0].value);
  const ripped = (entry) => entry.name === 'Ripped_Page';

  it('skip only the unreleased pages', () => {
    expect(report.grimoireupgrade.skipped).toEqual(data.grimoire
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => ripped(entry))
      .map(({ index }) => ({ index, reason: 'placeholder: missing page' })));
  });

  it('cap exactly the upgrades the panel prints a maximum for', () => {
    expect(upgrades.filter((node) => node.effect.cap !== null).map((node) => spaced(node.name))).toEqual(
      data.grimoire.filter((entry) => !ripped(entry) && entry.x4 < 999).map((entry) => spaced(entry.name))
    );
  });

  // N.js:106384: the rows GrimoireUpgBonus does not multiply by Writhing Grimoire.
  it('mark every upgrade Writhing Grimoire boosts', () => {
    expect(upgrades.filter((node) => !fieldOf(node, 'Boosted by')).map((node) => spaced(node.name))).toEqual([
      'Land Rank Database Maxim', 'Pure Opals', 'Grey Tome Book', 'Supreme Head Chef Status',
      'Talents for Me, not for Thee', 'Writhing Grimoire', 'Skull of Major Talent', 'Ok fine, Talents for Thee too'
    ]);
  });

  it('link each upgrade to the bone it costs', () => {
    expect(edges.filter((edge) => edge.from.startsWith('grimoireupgrade:')).map((edge) => [edge.from, edge.to, edge.rel])).toEqual(
      data.grimoire.flatMap((entry, index) => (ripped(entry) ? [] : [[`grimoireupgrade:GrimoireUpg${index}`, `item:Bone${entry.boneType}`, 'upgradedWith']]))
    );
  });

  it('price every level as the parser does', () => {
    expect(parityMismatches('grimoireupgrade', (index, level) => getGrimoireTotalUpgradeCost({}, { ...data.grimoire[index], index, level: level - 1 }, level))).toEqual([]);
  });

  it.each([
    ['Ribbon Winning', 1, 'Get +1 Daily Ribbon, +1% chance for rare quality'],
    ['Knockout!', 1, '+1% Wraith DMG per KO!'],
    ['Sacrifice of Harvest', 1, '1.05x higher Crop Evo chance'],
    // N.js:111973 floors the multiplier from a bonus of 1,000.
    ['Villager Extraciricular', 999, '10.99x Villager EXP gain in World 5'],
    ['Villager Extraciricular', 1050, '11x Villager EXP gain in World 5']
  ])('fill %s at level %i as %s', (name, level, expected) => {
    expect(textAt(name, level)).toBe(expected);
  });

  // Raw price 3,646.52: notateBig floors only below 1,000, so the wiki's notation rounds it.
  it('price the one-level Ribbon Shelf', () => {
    expect(costAt('Ribbon Shelf', 1)).toBe('3,647');
  });

  it.each([
    ['Ribbon Winning', '1.34e13'],
    ['Land Rank Database Maxim', '5.68e11'],
    ['Writhing Grimoire', '3.08e10'],
    ['Skull of Major Talent', '6.12e12'],
    ['Supreme Head Chef Status', '276,211,047']
  ])('total %s to its cap at %s', (name, expected) => {
    expect(costToMax(name)).toBe(expected);
  });

  it('name the bone in the singular where the game does', () => {
    const cost = (name) => costsAt(byName(name), 1)[0];
    expect([cost('Wraith Damage'), cost('Bovinae Hoarding'), cost('Wraith of all Trades II')].map(({ currency, currencyOne }) => [currency, currencyOne])).toEqual([
      ['Femurs', 'Femur'],
      ['Craniums', 'Cranium'],
      ['Bovinae', undefined]
    ]);
  });

  it('read the class, the unlock, the boost and the help of three upgrades', () => {
    const help = 'Enter Wraith Form using the other Talent. It lets you get bones from killing monsters! Exit Wraith Form by reusing the talent.';
    expect(byName('Wraith Damage').fields).toEqual([
      { label: 'Class', value: 'Death Bringer' },
      { label: 'Boosted by', value: 'Writhing Grimoire' },
      { label: 'Note', value: help }
    ]);
    expect(byName('Wraith Accuracy').fields).toEqual([
      { label: 'Class', value: 'Death Bringer' },
      { label: 'Unlocks at', value: '1 total Grimoire upgrade level' },
      { label: 'Boosted by', value: 'Writhing Grimoire' }
    ]);
    expect(byName('Knockout!').fields).toEqual([
      { label: 'Class', value: 'Death Bringer' },
      { label: 'Unlocks at', value: '330 total Grimoire upgrade levels' },
      { label: 'Boosted by', value: 'Writhing Grimoire' },
      { label: 'Targets', value: `${data.randomList[104].length} targets in turn, starting with Green Mushroom` },
      { label: 'Note', value: 'A Knockout, or KO, is when you kill the target monster in a single hit using your bare hands, no spears allowed!' }
    ]);
  });
});

// Oracles: N.js:107159-107181 (bonus, `$`, cost), 118290-118292 (panel), ArcaneType.js:37-118.
describe('tesseract upgrades', () => {
  const upgrades = ofKind('tesseractupgrade');
  const byName = (name) => upgrades.find((node) => spaced(node.name) === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);
  const costToMax = (name) => formatAmount(costsToMax(byName(name))[0].value);
  const unreleased = (entry) => entry.name === 'Boundless_Energy';
  // UPKEEP: the rows ArcaneUpgBonus does not multiply by Fractal Tesseract (N.js:107159).
  const NOT_FRACTAL = [3, 7, 8, 10, 13, 16, 20, 25, 26, 28, 33, 35, 39, 40, 43, 45, 48, 57, 58];

  it('skip only the unreleased pages', () => {
    expect(report.tesseractupgrade.skipped).toEqual(data.tesseract
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => unreleased(entry))
      .map(({ index }) => ({ index, reason: 'placeholder: missing page' })));
  });

  it('cap exactly the upgrades the panel prints a maximum for', () => {
    expect(upgrades.filter((node) => node.effect.cap !== null).map((node) => spaced(node.name))).toEqual(
      data.tesseract.filter((entry) => !unreleased(entry) && entry.x4 < 999).map((entry) => spaced(entry.name))
    );
  });

  it('mark every upgrade Fractal Tesseract boosts', () => {
    expect(upgrades.filter((node) => !fieldOf(node, 'Boosted by')).map((node) => spaced(node.name))).toEqual(
      NOT_FRACTAL.map((index) => spaced(data.tesseract[index].name))
    );
  });

  it('link each upgrade to the tachyon it costs', () => {
    expect(edges.filter((edge) => edge.from.startsWith('tesseractupgrade:')).map((edge) => [edge.from, edge.to, edge.rel])).toEqual(
      data.tesseract.flatMap((entry, index) => (unreleased(entry) ? [] : [[`tesseractupgrade:ArcaneUpg${index}`, `item:Tach${entry.x3}`, 'upgradedWith']]))
    );
  });

  it('price every level as the parser does', () => {
    const tesseract = data.tesseract.map((upgrade, index) => ({ ...upgrade, index, level: 0 }));
    const account = { accountOptions: [], serverVars: { DustCost: 6.2 }, tesseract: { upgrades: tesseract } };
    expect(parityMismatches('tesseractupgrade', (index, level) => getTesseractTotalUpgradeCost(account, { ...tesseract[index], level: level - 1 }, level))).toEqual([]);
  });

  it.each([
    ['The Prisma Bubble is Real', 1, 'While in Arcanist Form, 1 in 1,000 mobs drop Prisma Bubbles'],
    ['Tenteyecle Nostalgia', 1, 'only has a 2% chance'],
    ['Tenteyecle Nostalgia', 50, '100% chance'],
    ['Arcane Charging', 1, 'take 199 kills'],
    ['Arcane Charging', 100, 'take 100 kills'],
    ['Astrology Cultism', 1, 'now 1.11x instead of 1.10x'],
    ['Astrology Cultism', 10, '1.2x'],
    ['Pinnacle of Prisma', 1, '2.01x higher bonuses'],
    ['Beyond All Limits', 10, '+10x higher'],
    // N.js:118290 floors the multiplier from a bonus of 1,000.
    ['Eternal Stream', 1050, '11x']
  ])('fill %s at level %i with %s', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it.each([
    ['Arcane Charging', '1.40e17'],
    ['Pinnacle of Prisma', '4.97e35'],
    ['Universe Talent', '5.27e18']
  ])('total %s to its cap at %s', (name, expected) => {
    expect(costToMax(name)).toBe(expected);
  });

  it('pay each upgrade in its tachyon', () => {
    const cost = (name) => costsAt(byName(name), 1)[0];
    expect([cost('Singulon Hoarding'), cost('Arcanist Damage')].map(({ currency, currencyOne }) => [currency, currencyOne])).toEqual([
      ['Brown Tachyons', 'Brown Tachyon'],
      ['Purple Tachyons', 'Purple Tachyon']
    ]);
    expect(costAt('Arcanist Damage', 1)).toBe('24');
  });

  it('read the class, the unlock and the help, and what caps or lowers an upgrade', () => {
    expect(byName('The Prisma Bubble is Real').fields).toEqual([
      { label: 'Class', value: 'Arcane Cultist' },
      { label: 'Unlocks at', value: '10 total Tesseract upgrade levels' },
      { label: 'Note', value: 'This chance goes down with each Prisma Bubble you get. Also, drop chance increases based on your current World.' }
    ]);
    expect(fieldOf(byName('Tenteyecle Nostalgia'), 'Capped at')).toBe('The Tenteyecle talent\'s own chance');
    expect(fieldOf(byName('Arcane Charging'), 'Lowered by')).toBe('The Backup Energy talent, up to 10 more kills');
    expect(fieldOf(byName('Arcanist Accuracy'), 'Unlocks at')).toBe('1 total Tesseract upgrade level');
  });
});

// Oracles: N.js:107077 (CompassUpgCost), 107121-107131 (odds, bonus), 118107 (art), 118270-118271 (panel), 119734-119741 (unlocks).
describe('compass upgrades', () => {
  const upgrades = ofKind('compassupgrade');
  const byName = (name) => upgrades.find((node) => spaced(node.name) === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);
  const costToMax = (name) => formatAmount(costsToMax(byName(name))[0].value);
  const noTitan = (entry) => entry.description === 'Titan_doesnt_exist';
  const live = data.compass.map((entry, index) => ({ entry, index })).filter(({ entry }) => !noTitan(entry));
  // UPKEEP: the path roots, Worldfinder, the two drop-gated rows and the first slayer row (N.js:119734-119741).
  const ROOTS = [1, 13, 27, 40];
  const PATHFINDER = 0;
  const SLAYER_FROM = 60;
  const unlockOf = (index) => {
    if (ROOTS.includes(index) || index === 170) return 'Pathfinder';
    if (index === 171) return 'Weapon Drop';
    if (index === 172) return 'Stone Drop';
    const path = ROOTS.findIndex((root, at) => data.randomList[105 + at].includes(String(index)));
    if (path >= 0) return `${spaced(data.compass[ROOTS[path]].name)} at level ${data.randomList[105 + path].indexOf(String(index)) + 1}`;
    const titan = data.abominations[index - SLAYER_FROM];
    return `Defeating ${spaced(titan.name)} (${spaced(data.mapNames[titan.x2])})`;
  };

  it('skip only the slayers with no titan', () => {
    expect(report.compassupgrade.skipped).toEqual(data.compass
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => noTitan(entry))
      .map(({ index }) => ({ index, reason: 'placeholder: no titan for this slayer' })));
  });

  it('name what unlocks every upgrade but Pathfinder', () => {
    expect(Object.fromEntries(upgrades.map((node) => [node.rawName, fieldOf(node, 'Unlocked by')]))).toEqual(Object.fromEntries(
      live.map(({ index }) => [`CompassUpg${index}`, index === PATHFINDER ? undefined : unlockOf(index)])
    ));
  });

  it('link each upgrade to the dust it costs', () => {
    expect(edges.filter((edge) => edge.from.startsWith('compassupgrade:')).map((edge) => [edge.from, edge.to, edge.rel])).toEqual(
      live.map(({ entry, index }) => [`compassupgrade:CompassUpg${index}`, `item:Dust${entry.x3}`, 'upgradedWith'])
    );
  });

  // Knockoff Compass (36) and Abomination Slayer XVIII (77) discount every compass price by their own level in the parser.
  it('price every level as the parser does', () => {
    const compass = data.compass.map((upgrade, index) => ({ ...upgrade, index, level: 0 }));
    const account = { accountOptions: [], serverVars: { DustCost: 6.2 }, compass: { upgrades: compass } };
    expect(parityMismatches('compassupgrade', (index, level) => getCompassTotalUpgradeCost(account, { ...compass[index], level: level - 1 }, level),
      (node, level) => level === 1 || ![36, 77].includes(node.order))).toEqual([]);
  });

  it.each([
    ['Weapon Drop', 1, '1 in 1,600 chance'],
    ['Stone Drop', 1, '1 in 400'],
    ['Ring Drop', 1, '1 in 2,000'],
    ['Medallion Collection', 1, '1 in 5,000'],
    ['Moon of Print', 200, '+4% every day'],
    ['Can\'t Touch This', 1, '+0.1 sec'],
    ['Abomination Slayer XXIX', 49, '+4.9 sec'],
    ['Knockoff Compass', 100, '+50% Cheaper!'],
    ['Moon of Sneak', 150, '13x']
  ])('fill %s at level %i with %s', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it.each([
    ['Elemental Vision', 'You can now see the elemental weakness of abominations, as well as mobs in AFK Info.'],
    ['Tempest Damage IV', '+2% damage in Tempest Form'],
    ['The Luck Factor', 'Boosts the drop chance of ALL Tempest items, including medallions, by 1% of your normal Drop Rate.']
  ])('cut the account readout from %s', (name, expected) => {
    expect(textAt(name, 1)).toBe(expected);
  });

  it.each([
    ['Elemental Path', '2.75e13'],
    ['Moon of Print', '2.45e11'],
    ['Can\'t Touch This', '2.53e13'],
    ['Stone Failsafe', '256,477,425']
  ])('total %s to its cap at %s', (name, expected) => {
    expect(costToMax(name)).toBe(expected);
  });

  // Pathfinder pins DUST_COST: 6.2 x 2 / 2, floored by notateBig.
  it('price the one-level upgrades and pay in dust', () => {
    expect([costAt('Pathfinder', 1), costAt('Grumblo\'s Guarantee', 1), costsAt(byName('Moon of Sneak'), 1)[0].currency]).toEqual(['6', '62,000', 'Moondust']);
  });

  it('draw the game\'s art', () => {
    expect(['Pathfinder', 'Tempest Damage IV', 'Worldfinder'].map((name) => byName(name).icon)).toEqual([
      '/data/CompassUpg0.png', '/data/CompassUpg109.png', '/data/CompassUpg117.png'
    ]);
  });

  it('read the class, the unlock, the odds and the shape of three upgrades', () => {
    const windWalker = { label: 'Class', value: 'Wind Walker' };
    expect(byName('De Dust I').fields).toEqual([
      windWalker,
      { label: 'Unlocked by', value: 'Survival Path at level 3' },
      { label: 'Shape', value: 'Circle: boosted by Circle Supremacy and Abomination Slayer XXI' }
    ]);
    expect(byName('Abomination Slayer I').fields).toEqual([
      windWalker,
      { label: 'Unlocked by', value: 'Defeating Mushgloom (Spore Meadows)' }
    ]);
    expect(byName('Weapon Drop').fields).toEqual([
      windWalker,
      { label: 'Unlocked by', value: 'Elemental Path at level 1' },
      { label: 'Odds', value: 'Before Tempest drop bonuses, such as Top of the Mornin\'' }
    ]);
  });
});
