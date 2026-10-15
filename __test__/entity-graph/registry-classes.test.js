import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryEdges, registryNodes, registryReport } from '../../scripts/entity-graph/registry/build.mjs';
import classes from '../../scripts/entity-graph/registry/classes/index.mjs';
import { getCompassTotalUpgradeCost } from '../../parsers/class-specific/compass';
import { calcGrimoireBonus, getGrimoireTotalUpgradeCost } from '../../parsers/class-specific/grimoire';
import { calcTesseractBonus, getTesseractTotalUpgradeCost } from '../../parsers/class-specific/tesseract';
import { getArmoryUpgradeCost } from '../../parsers/class-specific/royalGuardian';
import { costsAt, costsToMax, FORMULAS, formatAmount, levelledText } from '../../utility/wiki/effects.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, classes);
const report = registryReport(data, classes);
const edges = registryEdges(data, classes);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);
const spaced = (text) => String(text).replace(/_/g, ' ');
const fieldOf = (node, label) => node.fields?.find((field) => field.label === label)?.value;
// The parser's bonus functions as the boost oracle: with every upgrade at level 1, a row the boost skips returns exactly x5.
const unboosted = (table, calc, live) => {
  const levelled = table.map((upgrade) => ({ ...upgrade, level: 1 }));
  return table.map((entry, index) => index).filter((index) => live(table[index]) && calc(levelled, index, 0) === levelled[index].x5);
};

// Both parsers price a node with every upgrade at level 0 exactly as the game prices it before discounts, so the wiki's
// cost formula at level L - 1 is compared with the parser's one-level total (the panel's notateBig floor comes after).
// `keep` leaves out the levels where the node's own level discounts the parser's price (account state).
const parityMismatches = (kind, parserCost, keep = () => true) => ofKind(kind).flatMap((node) => [1, 2, 10]
  .map((level) => Math.min(level, node.effect.cap ?? level))
  .filter((level) => keep(node, level))
  .map((level) => {
    const wiki = FORMULAS[node.cost.args.formula](level - 1, node.cost.args.args);
    const game = parserCost(node.order, level);
    // A free upgrade (the Armory's tools) prices 0 on both sides, where the relative error has no meaning.
    return wiki === game || Math.abs(wiki - game) / game < 1e-12 ? null : `${node.rawName}@${level}`;
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
    expect(upgrades.filter((node) => !fieldOf(node, 'Boosted by')).map((node) => node.order))
      .toEqual(unboosted(data.grimoire, calcGrimoireBonus, (entry) => !ripped(entry)));
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
      { label: 'Class', value: 'Death Bringer', links: ['class:Death_Bringer'], linkAs: 'belongsTo' },
      { label: 'Boosted by', value: 'Writhing Grimoire' },
      { label: 'Note', value: help }
    ]);
    expect(byName('Wraith Accuracy').fields).toEqual([
      { label: 'Class', value: 'Death Bringer', links: ['class:Death_Bringer'], linkAs: 'belongsTo' },
      { label: 'Unlocks at', value: '1 total Grimoire upgrade level' },
      { label: 'Boosted by', value: 'Writhing Grimoire' }
    ]);
    expect(byName('Knockout!').fields).toEqual([
      { label: 'Class', value: 'Death Bringer', links: ['class:Death_Bringer'], linkAs: 'belongsTo' },
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
    expect(upgrades.filter((node) => !fieldOf(node, 'Boosted by')).map((node) => node.order))
      .toEqual(unboosted(data.tesseract, calcTesseractBonus, (entry) => !unreleased(entry)));
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
  });

  it('read the class, the unlock and the help, and what caps or lowers an upgrade', () => {
    expect(byName('The Prisma Bubble is Real').fields).toEqual([
      { label: 'Class', value: 'Arcane Cultist', links: ['class:Arcane_Cultist'], linkAs: 'belongsTo' },
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
    if (ROOTS.includes(index) || index === 170) return 'Pathfinder at level 1';
    if (index === 171) return 'Weapon Drop at level 1';
    if (index === 172) return 'Stone Drop at level 1';
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

  // UPKEEP: Knockoff Compass (36) and Abomination Slayer XVIII (77) discount every compass price, their own included, by their
  // level (N.js:107077), so above level 1 the parser's price for them carries account state.
  const SELF_DISCOUNTED = [36, 77];
  it('price every level as the parser does', () => {
    const compass = data.compass.map((upgrade, index) => ({ ...upgrade, index, level: 0 }));
    const account = { accountOptions: [], serverVars: { DustCost: 6.2 }, compass: { upgrades: compass } };
    expect(parityMismatches('compassupgrade', (index, level) => getCompassTotalUpgradeCost(account, { ...compass[index], level: level - 1 }, level),
      (node, level) => level === 1 || !SELF_DISCOUNTED.includes(node.order))).toEqual([]);
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
    const windWalker = { label: 'Class', value: 'Wind Walker', links: ['class:Wind_Walker'], linkAs: 'belongsTo' };
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

// Oracles: N.js:107842 (ArmoryUpgCost), 122263 (buy check), 122298-122373 (panel, hover help), RoyalG.js:45-113, 191-214, 324-443.
describe('royal armory upgrades', () => {
  const upgrades = ofKind('armoryupgrade');
  const byName = (name) => upgrades.find((node) => spaced(node.name) === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);
  const costToMax = (name) => formatAmount(costsToMax(byName(name))[0].value);
  const shelf = data.research[43].map(Number);
  const unshelved = data.armoryUpgrades.map((entry, id) => id).filter((id) => !shelf.includes(id));
  const shelfLine = (count) => (count > 0 ? `${count.toLocaleString('en-US')} total Armory upgrade level${count === 1 ? '' : 's'}` : undefined);

  it('lay the pages out in shelf order', () => {
    expect([...upgrades].sort((a, b) => a.order - b.order).map((node) => node.rawName)).toEqual(shelf.map((id) => `ArmoryUpg${id}`));
  });

  it('skip only the upgrades no shelf shows, naming each', () => {
    expect(report.armoryupgrade.skipped).toEqual(unshelved.map((id, k) => ({ index: shelf.length + k, reason: `not on an Armory shelf: ArmoryUpg${id}` })));
  });

  // The shelf, its threshold and its currency follow the slot; everything else follows the id behind it.
  it('read the shelf, its threshold and its currency from the slot row', () => {
    expect(upgrades.map((node) => [node.rawName, fieldOf(node, 'Shelf'), fieldOf(node, 'Unlocks at'), node.cost.currency, node.cost.currencyIcon]))
      .toEqual(shelf.map((id, slot) => [
        `ArmoryUpg${id}`, slot + 1, shelfLine(data.armoryUpgrades[slot].unlockTotalLevels), 'Kingdom Resources',
        `/data/RGres${data.armoryUpgrades[slot].costResourceIndex}.png`
      ]));
  });

  it('price every level as the parser does', () => {
    expect(parityMismatches('armoryupgrade', (slot, level) => {
      const levels = [];
      levels[shelf[slot]] = level - 1;
      return getArmoryUpgradeCost(slot, shelf, levels, 1);
    })).toEqual([]);
  });

  it('link no upgrade to an item', () => {
    expect(edges.filter((edge) => edge.from.startsWith('armoryupgrade:'))).toEqual([]);
  });

  // Royal Talent Points I sits in slot 1, whose row unlocks at 1 and costs resource 0; its own row says 1,350 and resource 22.
  it('price Royal Talent Points I from slot 1', () => {
    const node = byName('Royal Talent Points I');
    expect([fieldOf(node, 'Unlocks at'), costsAt(node, 1)[0].currencyIcon, node.icon, costAt('Royal Talent Points I', 10), costToMax('Royal Talent Points I')])
      .toEqual(['1 total Armory upgrade level', '/data/RGres0.png', '/data/RAupg46.png', '149', '1.57e13']);
  });

  it('cap the 1,000 level upgrades and price Solo Militia Status', () => {
    expect([byName('Solo Militia Status').effect.cap, byName('Resource Replenish').effect.cap, byName('Blunder Outpost PTS').effect.cap]).toEqual([1000, 1000, null]);
    expect([costAt('Solo Militia Status', 1), costAt('Solo Militia Status', 2), costToMax('Solo Militia Status')]).toEqual(['3', '57', '8.97e66']);
  });

  it.each([
    ['Royal Marble', 1, '1 in 990'],
    ['Royal Marble', 50, '1 in 667'],
    ['Trading Rank', 6, 'every 5 Ranks'],
    ['Mighty Militia', 1, '5,000 Monsters/hr'],
    ['Mighty Militia', 10, '14,000 Monsters/hr'],
    ['Perfect Purification', 1, '3.01x'],
    ['Perfect Purification', 300, '6x'],
    ['Wonderful Workers', 1, '+60%'],
    ['Great Guards', 1, '+30px'],
    ['State-Wide Propoganda', 100, '11x'],
    ['Peacetime Milita', 1, '0.5 EXP/hr'],
    ['Blunder Hills Militia', 1, '4,000/hr']
  ])('fill %s at level %i with %s', (name, level, expected) => {
    expect(textAt(name, level)).toContain(expected);
  });

  it.each([
    ['Trading Rank', 'Each Trading Rank of an Outpost gives +1 PTS for Upgrades. You now get +1 additional PTS every 10 Ranks'],
    ['Support Camps', 'You can modify 1 Outposts per World into Support Camps. Connects to other outposts, givin\' 3x EXP & 3x Collection Rate!'],
    ['Purity Rank', 'Achieving a PURITY Rank of 1 means that Outpost and Map are Purified. Click the button to see Purified Bonuses.'],
    ['Kingdom Sovereignty', 'Recruits new Movable Unit every time you buy this upgrade!'],
    ['Compounding Outposting', 'Pick a stat to boost! More outposts built means bigger boost!']
  ])('write %s at level 1 as the game does', (name, expected) => {
    expect(textAt(name, 1)).toBe(expected);
  });

  it.each([
    ['Trading Rank', '1.55e39'],
    ['Support Camps', '6.49e24'],
    ['Collect Resources Tool', '0']
  ])('total %s to its cap at %s', (name, expected) => {
    expect(costToMax(name)).toBe(expected);
  });

  it('charge nothing for the free tools', () => {
    expect(costAt('Collect Resources Tool', 1)).toBe('0');
  });

  it('read the odds, the recruits, the choices and the boosts', () => {
    expect(fieldOf(byName('Royal Marble'), 'Odds by world, before bonuses')).toEqual([
      'World 1: 1 in 1,000', 'World 2: 1 in 1,300', 'World 3: 1 in 2,200', 'World 4: 1 in 3,700'
    ]);
    const recruits = fieldOf(byName('Kingdom Sovereignty'), 'Recruit order');
    expect([recruits.length, recruits[0]]).toEqual([data.gameTables.royalRecruitOrder.role.length, 'Level 1: Commander for World 1']);
    expect(fieldOf(byName('Compounding Outposting'), 'Choices')).toEqual([
      'Construction Build Rate', 'Research EXP Gain', 'Spelunking Stamina Regen', 'Minehead Currency Gain'
    ]);
    expect(['Support Camps', 'Savage Strongholds', 'Blunder Hills Militia'].map((name) => fieldOf(byName(name), 'Boosted by')))
      .toEqual(['Super Support', 'Super Savagery', 'Mighty Militia']);
  });

  it('read the class and the help', () => {
    expect(byName('Resource Grades').fields).toEqual([
      { label: 'Class', value: 'Royal Guardian', links: ['class:Royal_Guardian'], linkAs: 'belongsTo' },
      { label: 'Shelf', value: shelf.indexOf(0) + 1 },
      { label: 'Unlocks at', value: shelfLine(data.armoryUpgrades[shelf.indexOf(0)].unlockTotalLevels) },
      { label: 'Note', value: 'A resource\'s Grade is shown by its border, and its Collection Rate bonus is applied to all Outposts connected to it!' }
    ]);
  });
});

// Oracles: N.js:106632-106633 (OrbletMarketCost, bonus), 119257-119261 (panel, row gating), 119505 (buy); royalGuardian.ts:686-707 agrees.
describe('orblet market upgrades', () => {
  const upgrades = ofKind('orbletupgrade');
  const byName = (name) => upgrades.find((node) => spaced(node.name) === name);
  const costAt = (name, level) => formatAmount(costsAt(byName(name), level)[0].value);
  const costToMax = (name) => formatAmount(costsToMax(byName(name))[0].value);

  it('make a page of every row', () => {
    expect([report.orbletupgrade.count, report.orbletupgrade.skipped]).toEqual([data.orbletMarket.length, []]);
  });

  it('gate every row but the first on the one before it', () => {
    expect(upgrades.map((node) => fieldOf(node, 'Unlocked by'))).toEqual(
      upgrades.map((node, index) => (index > 0 ? `${spaced(upgrades[index - 1].name)} at level 1` : undefined))
    );
    expect(['Emulsion', 'Full Clear', 'Stronk Rank', 'Long Range'].every((name) => byName(name))).toBe(true);
  });

  it.each([
    ['Emulsion', 5, '12,500,004'],
    ['Hydration', 1, '3'],
    ['Hydration', 2, '4'],
    ['Hydration', 10, '14']
  ])('price %s level %i at %s', (name, level, expected) => {
    expect(costAt(name, level)).toBe(expected);
  });

  it.each([
    ['Emulsion', '12,755,112'],
    ['Hydration', '181,480,393'],
    ['Bargain', '5,050,323'],
    ['Long Range', '12,308'],
    ['Parchmore', '3.91e9'],
    ['Glorification', '25']
  ])('total %s to its cap at %s', (name, expected) => {
    expect(costToMax(name)).toBe(expected);
  });

  it('describe Glorification, which never passes level 1', () => {
    const node = byName('Glorification');
    expect([spaced(levelledText(node, 1)), node.effect.cap, costAt('Glorification', 1)]).toEqual(['10% chance to Glorify the current Outpost', 1, '25']);
    expect(node.fields).toEqual([
      { label: 'Class', value: 'Royal Guardian', links: ['class:Royal_Guardian'], linkAs: 'belongsTo' },
      { label: 'Unlocked by', value: 'Full Clear at level 1' },
      { label: 'Glorified outposts get', value: '+10 PTS, 2x Rank EXP, and +1 Worker' },
      { label: 'Each later attempt', value: '32 Orblets' }
    ]);
  });

  it('spend Orblets with no discount', () => {
    expect([...new Set(upgrades.map((node) => [node.cost.currency, node.cost.currencyOne, node.cost.note].join('|')))]).toEqual(['Orblets|Orblet|No discounts apply.']);
    expect(edges.filter((edge) => edge.from.startsWith('orbletupgrade:')).map((edge) => [edge.from, edge.to])).toEqual(
      data.orbletMarket.map((entry, index) => [`orbletupgrade:OrbletMarket${index}`, 'item:Orblet'])
    );
  });
});

// Every page of a class system names its class by id, which is what lists it under the class page's Upgrades.
describe('class fields', () => {
  it.each([
    ['grimoireupgrade', 'Death_Bringer'],
    ['compassupgrade', 'Wind_Walker'],
    ['tesseractupgrade', 'Arcane_Cultist'],
    ['armoryupgrade', 'Royal_Guardian'],
    ['orbletupgrade', 'Royal_Guardian']
  ])('link every %s page to %s', (kind, CLASS) => {
    const fields = new Set(ofKind(kind).map((node) => JSON.stringify(node.fields.find((field) => field.label === 'Class'))));
    expect([...fields]).toEqual([JSON.stringify({ label: 'Class', value: spaced(CLASS), links: [`class:${CLASS}`], linkAs: 'belongsTo' })]);
  });
});
