import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryEdges, registryNodes, registryReport } from '../../scripts/entity-graph/registry/build.mjs';
import world5 from '../../scripts/entity-graph/registry/world-5/index.mjs';
import { artifactIslands } from '../../scripts/entity-graph/nodes/catalogs-b.mjs';
import { costsAt, costsToMax, formatAmount, FORMULAS, levelledText } from '../../utility/wiki/effects.mjs';
import { getCosmoBonus, getStudyBonus } from '@parsers/world-5/hole';
import { getFountainBonusTotal } from '@parsers/world-5/caverns/the-fountain';
import { getJarBonus } from '@parsers/world-5/caverns/the-jars';
import { getCglunkoBonus } from '@parsers/world-5/caverns/crystal-glunko-cove';
import { tidy } from '../../scripts/entity-graph/registry/text.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, world5);
const report = registryReport(data, world5);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);
const spaced = (text) => String(text).replace(/_/g, ' ');
const fieldOf = (node, label) => node.fields?.find((field) => field.label === label)?.value;

describe('divinity styles', () => {
  const styles = ofKind('divstyle');
  const byName = (name) => styles.find((node) => node.name === name);

  it('build one page per style', () => {
    expect(styles).toHaveLength(data.divStyles.length);
    expect(report.divstyle).toEqual({ count: data.divStyles.length, skipped: [] });
  });

  // Oracle: Divinity.js:6-7 StyleLvReq, the level at which each style stops drawing locked. Kinesis needs none.
  it('read the Divinity level each style needs off the game ladder', () => {
    expect(Object.fromEntries(styles.map((node) => [spaced(node.name), fieldOf(node, 'Divinity level needed')]))).toEqual({
      Kinesis: undefined,
      Chakra: 5,
      Focus: 10,
      Mantra: 15,
      Vitalic: 25,
      TranQi: 40,
      Zen: 60,
      Mindful: 80
    });
  });

  it('read Mindful as the game does', () => {
    expect(spaced(byName('Mindful').description)).toBe('Feel connected to every atom of the universe! Gives 15 Divinity and 10 EXP per hour');
  });
});

describe('lamp wishes', () => {
  const wishes = ofKind('lampwish');
  const byName = (name) => wishes.find((node) => node.name === name);
  const costAtTimes = (name, times) => costsAt(byName(name), times)[0].value;

  it('build one page per wish', () => {
    expect(wishes).toHaveLength(data.lampWishes.length);
  });

  // Oracle: Holes.js:797-822 LampBonuses, filled per wish. getWishCost is unexported, so the values are pinned.
  it.each([
    ['World_4_Stuff', 1, 'Uhh, sure, how about these bonuses: +25% Cooking Speed. +10% Shiny Mob LV Up & Breedability Rate. +8% Lab EXP gain'],
    ['World_4_Stuff', 5, 'Uhh, sure, how about these bonuses: +125% Cooking Speed. +50% Shiny Mob LV Up & Breedability Rate. +40% Lab EXP gain'],
    ['World_5_Things', 1, 'Wow very specific! How about: +15% Sailing Loot Value. +40% Bits gain. +10% Divinity Pts gain'],
    ['World_6_Majigers', 1, 'Yes yes majigers, how about things like: +20% Next Crop chance. +35% Stealth for Ninja twins. +12% All Essence gain']
  ])('fill %s at %i times wished', (name, times, sentence) => {
    expect(spaced(levelledText(byName(name), times))).toBe(sentence);
  });

  it('fill the Infinite Resources multipliers', () => {
    const node = byName('Infinite_Resources');
    expect(spaced(levelledText(node, 1))).toContain('1.25x bonus to Well and Harp resource gain! Oh, and 1.06x for Jar Rupie');
    expect(spaced(levelledText(node, 4))).toContain('2x bonus to Well and Harp resource gain! Oh, and 1.25x for Jar Rupie');
  });

  it('price World 4 Stuff at 1 for five wishes and 2 for the sixth', () => {
    expect([1, 2, 3, 4, 5, 6].map((times) => costAtTimes('World_4_Stuff', times))).toEqual([1, 1, 1, 1, 1, 2]);
  });

  it('cap More Wishes at 11 and total 506 wishes', () => {
    const node = byName('More_Wishes');
    expect(node.effect.cap).toBe(11);
    expect(costsToMax(node)[0].value).toBe(506);
    expect(costsAt(node, 1)[0].label).toBe('Cost of this wish');
  });

  it('price 1000000 Opals at 71 for the eleventh wish', () => {
    expect(costAtTimes('1000000_Opals', 11)).toBe(71);
  });

  it('list the choices on the two choice wishes and keep no pipe', () => {
    expect(wishes.filter((node) => node.description.includes('|'))).toEqual([]);
    expect(['Another_Try', 'Bring_Them_Back'].map((name) => spaced(byName(name).description).includes('Choices: '))).toEqual([true, true]);
    expect(spaced(byName('Bring_Them_Back').description)).toContain('Bravery, Justice or Wisdom Monument');
  });

  // Rule: the field exists exactly where the text carries a number the Zenith Market bonus would change.
  it('mark "Bonus shown" on the wishes whose text carries a filled number', () => {
    expect(wishes.filter((node) => fieldOf(node, 'Bonus shown')).map((node) => node.order)).toEqual([4, 6, 7, 8, 10]);
  });
});

describe('gaming imports', () => {
  const imports = ofKind('gamingimport');
  const byName = (name) => imports.find((node) => node.name === name);

  it('skip only the empty box', () => {
    expect(report.gamingimport.skipped.map(({ index }) => data.gamingImports[index].boxName)).toEqual(['Empty_Box']);
    expect(imports).toHaveLength(data.gamingImports.length - 1);
  });

  // Oracle: GamingStatType.js:462-487 ImportItemBonus; calcImportBonus (gaming.ts:479) is unexported, so the values are pinned.
  // One point per row proves its arguments: the curves themselves are pinned in formulas.test.js.
  it.each([
    ['Dirty_Shovel', 1000, '+722.2% big nugget luck'],
    ['Bog_Log', 1000, '54.5% chance for free game'],
    ['Autumn_Squirrel', 10, '+50% acorns found']
  ])('fill %s at level %i', (name, level, expected) => {
    expect(spaced(levelledText(byName(name), level))).toContain(expected);
  });

  // Oracle: GamingStatType.js:459-461 BoxCost and 482-487 ImportItemCOST (calcImportCost, gaming.ts:497): pinned.
  it('price the Little Sprinkler box and levels', () => {
    const node = byName('Little_Sprinkler');
    expect(fieldOf(node, 'Box cost')).toBe('200,000 bits');
    expect([1, 2, 10].map((level) => formatAmount(costsAt(node, level)[0].value))).toEqual(['50,000', '70,000', '1,033,052']);
  });

  it('print the King Rat box and first level in exponent form', () => {
    const node = byName('King_Rat_of_Olde');
    expect(fieldOf(node, 'Box cost')).toBe('1.00e50 bits');
    expect(formatAmount(costsAt(node, 1)[0].value)).toBe('2.50e49');
  });

  it('draw the Elegant Seashell at shell rank 0', () => {
    expect(byName('Elegant_Seashell').icon).toBe('/data/GamingItem3_0.png');
  });

  it('keep no bits glyph or line-break pipe in any text', () => {
    expect(imports.filter((node) => /[₣|]/.test(node.description))).toEqual([]);
  });

  it('read the game line breaks as sentences and the mid-sentence wraps as spaces', () => {
    expect(spaced(byName('Kitsune_Roxie').description)).toContain('all give 3x less bits. Tap rock');
    expect(spaced(byName('King_Rat_of_Olde').description)).toContain('for every Crown found, and generates');
  });
});

describe('palette colours', () => {
  const colours = ofKind('palette');
  const byName = (name) => colours.find((node) => node.name === name);
  const UNLOCK = 'Base unlock odds (before Palette Luck)';

  it('skip exactly the four placeholder colours', () => {
    expect(report.palette.skipped.map(({ index }) => data.gamingPalette[index].name)).toEqual(['Olive_Green', 'Sky_Blue', 'Bleu_Royale', 'Lavendar']);
    expect(colours).toHaveLength(data.gamingPalette.length - report.palette.skipped.length);
  });

  // Oracles: GamingStatType.js:45-92 PaletteBonus / LVupChance / PalUnlockChance, cross-checked by gaming.ts:703-707 and 758.
  // Golden Yellow's `#` is floored to hundredths, so L1 reads 1.53, not the rounded 1.54.
  it.each([
    ['Pair_Green', ['+5% All Skill Efficiency', '+50% All Skill Efficiency', '+500% All Skill Efficiency'], ['60', '310'], '1 in 200'],
    ['Mossy_Green', ['+0.12% all Cell DMG in Jelly Operator', '+0.86% all Cell DMG in Jelly Operator', '+2.4% all Cell DMG in Jelly Operator'], ['2,600', '27,572'], '1 in 650,000'],
    ['Bright_Cyan', ['1.12x Artifact Find chance', '1.86x Artifact Find chance', '3.4x Artifact Find chance'], ['6,250', '46,566'], '1 in 1,000,000'],
    ['Golden_Yellow', ['+1.53% Gold Ball gain from Arcade', '+11.42% Gold Ball gain from Arcade', '+32% Gold Ball gain from Arcade'], ['1,170', '12,407'], '1 in 400,000']
  ])('read %s at levels 1, 10 and 100, with its odds and unlock', (name, texts, odds, unlock) => {
    const node = byName(name);
    expect([1, 10, 100].map((level) => spaced(levelledText(node, level)))).toEqual(texts);
    expect([1, 10].map((level) => formatAmount(costsAt(node, level)[0].value))).toEqual(odds);
    expect(fieldOf(node, UNLOCK)).toBe(unlock);
  });

  it('leave the unlock odds off the three colours that are always available', () => {
    expect(colours.filter((node) => !fieldOf(node, UNLOCK)).map((node) => spaced(node.name))).toEqual(['Pastel Yellow', 'Offwhite', 'Light Cyan']);
  });

  it('name the superbit that doubles each of six colours', () => {
    expect(colours.filter((node) => fieldOf(node, 'Doubled by superbit')).map((node) => [spaced(node.name), fieldOf(node, 'Doubled by superbit')])).toEqual([
      ['Neon Tree', 'Everybody Talks'],
      ['Babby Blue', 'Babbiest Blue'],
      ['Ocean Blue', 'Bluer Ocean'],
      ['Offwhite', 'Further Offcolour'],
      ['Peachy Pink', 'Peachier Peach'],
      ['Red Orange', 'Redder Orange']
    ]);
  });
});

describe('sailing islands', () => {
  const islands = ofKind('sailingisland');
  const byName = (name) => islands.find((node) => spaced(node.name) === name);
  const artifactsOn = (island) => {
    const owners = artifactIslands(data.artifacts, data.islands);
    return data.artifacts.filter((artifact, i) => owners[i] === island).map((artifact) => spaced(artifact.name));
  };

  it('build one page per island, with no description', () => {
    expect(islands).toHaveLength(data.islands.length);
    expect(report.sailingisland).toEqual({ count: data.islands.length, skipped: [] });
    expect(islands.map((node) => node.description)).toEqual(islands.map(() => null));
  });

  it('read the first island off the boat panel', () => {
    expect(byName('Safari Island').fields).toEqual([
      { label: 'Distance', value: '25 m' },
      { label: 'Captain EXP per trip (base)', value: 2 },
      { label: 'Artifacts found here', value: ['Moai Head', 'Maneki Kat', 'Ruble Cuble', 'Fauxory Tusk'] }
    ]);
  });

  it('count The Edge as four lanterns', () => {
    const edge = byName('The Edge');
    expect(fieldOf(edge, 'Distance')).toBe('100,000,000 m');
    expect(fieldOf(edge, 'Artifacts found here')).toEqual(['The True Lantern', 'The Onyx Lantern', 'The Shim Lantern', 'The Winz Lantern']);
  });

  it('list The Maw artifacts from artifactIslands, Fang of the Gods to Enigma Fragment', () => {
    const maw = byName('The Maw');
    const found = fieldOf(maw, 'Artifacts found here');
    expect(fieldOf(maw, 'Distance')).toBe('2.00e11 m');
    expect(found).toEqual(artifactsOn('The_Maw'));
    expect([found[0], found.at(-1)]).toEqual(['Fang of the Gods', 'Enigma Fragment']);
  });

  // The extractor mangles the island cloud field, so no page may carry it.
  it('carry only the three fields the data gives cleanly', () => {
    const labels = islands.flatMap((node) => (node.fields || []).map((field) => field.label));
    expect([...new Set(labels)]).toEqual(['Distance', 'Captain EXP per trip (base)', 'Artifacts found here']);
  });
});

describe('engineer schematics', () => {
  const schematics = ofKind('schematic');
  const byName = (name) => schematics.find((node) => spaced(node.name) === name);
  const COST = 'Cost to create (before the lamp wish discount)';
  const LEVEL = 'Engineer level needed';

  it('skip the placeholder and the one past the 105-schematic limit, each with its reason', () => {
    const nameOf = ({ index }) => data.holesBuildings[index].name;
    expect(Object.fromEntries(report.schematic.skipped.map((skip) => [nameOf(skip), skip.reason]))).toEqual({
      NameNameName: 'placeholder: not in the creation order',
      Bee_String: 'never offered: past the 105-schematic limit'
    });
    expect(schematics).toHaveLength(data.holesBuildings.length - report.schematic.skipped.length);
  });

  // Oracles: Holes.js:205-224 SchematicsAvailable and BuildCost. getEngineerUpgradeCost is unexported, so the values are pinned.
  // Position, cost and Engineer level all come from the creation order holesInfo[40], not the table index.
  it.each([
    ['Opal Dividends', '6 Well sediment 1', undefined],
    ["Loadin' some 'Lode", '12 Well sediment 1', 1],
    ["Cavern 'Porting", '60 Well sediment 1', 2],
    ['Heavy Redstone Seasoning', '14,615 Well sediment 3', 6],
    ['Fractalfly ~ Harp Synergy', '23,190 Harp note 4', 10],
    ['White Amplifier', '2.62e9 Well sediment 7', 17],
    ['Dark Luck', '22,674,881 Jar rupie 8', 25],
    ['Rift Guy', '8.37e16 Well sediment 1', 33]
  ])('price %s at %s', (name, cost, level) => {
    expect(byName(name).fields).toEqual([
      { label: COST, value: cost },
      ...(level ? [{ label: LEVEL, value: level }] : [])
    ]);
  });

  it('leave no account readout in any description', () => {
    expect(schematics.filter((node) => /total.bonus|currently.have|so.far!|尬/i.test(node.description))).toEqual([]);
  });
});

describe('caverns', () => {
  const caverns = ofKind('cavern');
  const byName = (name) => caverns.find((node) => spaced(node.name) === name);
  const studyAt = (name, level) => costsAt(byName(name), level)[0];

  it('skip the two spare BRUH slots', () => {
    expect(report.cavern.skipped.map(({ index }) => data.holesInfo[68][index])).toEqual(['BRUH', 'BRUH']);
    expect(caverns).toHaveLength(data.holesInfo[68].length - report.cavern.skipped.length);
  });

  // Oracle: Holes.js:135 CavernsOwned = min(18, ExplorerLV), so cavern t opens at Explorer level t + 1.
  it('open each cavern one Explorer level after the previous', () => {
    expect(Object.fromEntries(caverns.map((node) => [node.order, fieldOf(node, 'Explorer level needed')]))).toEqual(
      Object.fromEntries(caverns.map((node) => [node.order, node.order + 1]))
    );
  });

  // Oracles: Holes2.js:134-151 StudyReqForBolaia and StudyBolaiaBonuses; getStudyBonus covers the bonus side in the parity test below.
  it('read The Well study text and price its levels', () => {
    expect(spaced(levelledText(byName('The Well'), 1))).toContain('+10% Bucket Fill Rate per Bar Expansion');
    expect([1, 2, 10].map((level) => formatAmount(studyAt('The Well', level).value))).toEqual(['4,000', '5,000', '29,802']);
    expect(studyAt('The Well', 1)).toMatchObject({ currency: 'Study progress', note: 'No discounts apply; study rate bonuses only fill it faster.' });
  });

  it('start The Cove at 13,500 study progress, a 1.5x step for every five caverns', () => {
    expect(formatAmount(studyAt('The Cove', 1).value)).toBe('13,500');
  });

  it('keep the game name for cavern 17', () => {
    expect(caverns.at(-1).name).toBe('The_Cove');
  });

  it('read Justice as a multiplier that starts at 2x', () => {
    expect([1, 2].map((level) => spaced(levelledText(byName('Justice'), level)).match(/Also, (\S+) chance/)[1])).toEqual(['2x', '2.5x']);
  });

  it('cap Bravery at 32%', () => {
    expect([1, 7].map((level) => spaced(levelledText(byName('Bravery'), level)).match(/at least (\S+) of Max/)[1])).toEqual(['15%', '32%']);
  });

  // Oracle: getStudyBonus (hole.ts:743); `{` prints the bonus and `}` prints 1 + bonus / 100 (hole.ts:767).
  // Rounded to six places: m / 100 * L and (L * m) / 100 differ by float noise only.
  it('match getStudyBonus at levels 1 and 10 on every cavern', () => {
    const six = (value) => Math.round(value * 1e6) / 1e6;
    const derived = {};
    const expected = {};
    for (const node of caverns) {
      for (const level of [1, 10]) {
        const bonus = getStudyBonus({ studyStuff: { [node.order]: level } }, node.order, 0);
        for (const { token, formula, args } of node.effect.terms) {
          derived[`${node.order}:${level}:${token}`] = six(FORMULAS[formula](level, args));
          expected[`${node.order}:${level}:${token}`] = six(token === '{' ? bonus : 1 + bonus / 100);
        }
      }
    }
    expect(derived).toEqual(expected);
  });
});

describe('conjuror majiks', () => {
  const majiks = ofKind('majik');
  const byName = (name) => majiks.find((node) => node.name === name);
  const TREES = ['Hole', 'Village', 'IdleOn'];
  const flat = data.cosmoUpgrades.flatMap((tree, t) => tree.map((upgrade, i) => ({ ...upgrade, t, i })));

  it('skip every Confused_Bonus filler row', () => {
    const fillers = flat.filter((upgrade) => upgrade.name === 'Confused_Bonus');
    expect(report.majik.skipped.map(({ index }) => flat[index].name)).toEqual(fillers.map(() => 'Confused_Bonus'));
    expect(majiks).toHaveLength(flat.length - fillers.length);
  });

  // Oracle: Holes.js:259-262 CosmoBonusQTY filled per level; the cap is EnhanceMaxLV + 1 (holesInfo[56 + tree]).
  it.each([
    ['Monumental_Vibes', 4, '1.25x higher', '2x higher'],
    ['Wishy_Washy', 3, '+30% chance', '+90% chance'],
    ['Rupies_Everywhere', 5, 'by +35%', 'by +175%'],
    ['Opal_Enthusiasm', 5, 'by +30%', 'by +150%'],
    ['Beeg_Beeg_Forge', 5, 'by 3x', 'by 243x'],
    ['Resource_Bursting', 3, 'by 100%', 'by 300%'],
    ['Weapon_Relevancy', 4, 'is 75% higher', 'is 300% higher'],
    ['Pocket_Divinity', 2, 'Get the link bonuses', 'Get the link bonuses']
  ])('read %s at level 1 and its cap of %i', (name, cap, first, last) => {
    const node = byName(name);
    expect(node.effect.cap).toBe(cap);
    expect(spaced(levelledText(node, 1))).toContain(first);
    expect(spaced(levelledText(node, cap))).toContain(last);
  });

  it('cost one Majik Point per level, so the total to max is the cap', () => {
    expect(Object.fromEntries(majiks.map((node) => [node.rawName, costsToMax(node)[0].value]))).toEqual(
      Object.fromEntries(majiks.map((node) => [node.rawName, node.effect.cap]))
    );
  });

  it('describe Pocket Divinity without the player-linked gods', () => {
    expect(spaced(byName('Pocket_Divinity').description)).toBe('Get the link bonuses of a god you pick, one god per level.');
  });

  it('name the majik tree on every page', () => {
    expect(Object.fromEntries(majiks.map((node) => [node.name, fieldOf(node, 'Tree')]))).toEqual(
      Object.fromEntries(flat.filter((upgrade) => upgrade.name !== 'Confused_Bonus').map((upgrade) => [upgrade.name, `${TREES[upgrade.t]} majik`]))
    );
  });

  // Oracle: getCosmoBonus (hole.ts:490), the `{` value at level 1 and at the cap.
  it('match getCosmoBonus at level 1 and the cap on every majik', () => {
    const derived = {};
    const expected = {};
    for (const upgrade of flat) {
      const node = majiks.find((candidate) => candidate.rawName === `Majik${upgrade.t}_${upgrade.i}`);
      if (!node) continue;
      const { formula, args } = node.effect.terms.find(({ token }) => token === '{');
      for (const level of [1, node.effect.cap]) {
        derived[`${node.rawName}:${level}`] = FORMULAS[formula](level, args);
        expected[`${node.rawName}:${level}`] = getCosmoBonus({ majik: { [upgrade.i]: level }, t: upgrade.t, i: upgrade.i });
      }
    }
    expect(derived).toEqual(expected);
  });
});

describe('fountain upgrades', () => {
  const upgrades = ofKind('fountainupgrade');
  const byName = (name) => upgrades.find((node) => spaced(node.name) === name);
  const flat = data.holeFountUpg.flatMap((water, t) => water.map((upgrade, i) => ({ ...upgrade, t, i, rawName: `Fountain${t}_${i}` })));
  const nodeOf = (upgrade) => upgrades.find((node) => node.rawName === upgrade.rawName);
  const priceAt = (name, level) => costsAt(byName(name), level)[0];
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const BOOSTER_TAIL = 'Currencies are ALL money types here at the Fountain, from coins to dollars and more!';

  it('build one page per upgrade on all three waters', () => {
    expect(upgrades.map((node) => node.rawName)).toEqual(flat.map((upgrade) => upgrade.rawName));
    expect(report.fountainupgrade.skipped).toEqual([]);
  });

  // Oracle: Holes2.js:179-184 Cost_FountainUPG, baseCost == 1 ? (L + 1) * costMulti^L : baseCost * costMulti^L.
  // getFountainUpgradeCost (the-fountain.ts:38) is unexported, so the values are pinned.
  it('price Currency Booster I in Golden Coins', () => {
    expect([1, 2, 10].map((level) => formatAmount(priceAt('Currency Booster I', level).value))).toEqual(['1,500', '1,800', '7,740']);
    expect(priceAt('Currency Booster I', 1)).toMatchObject({ currency: 'Golden Coins', note: 'No discounts apply.' });
  });

  it('price Penny Lane in Bronze Coins from (L + 1) times the multiplier', () => {
    const prices = [1, 2, 10].map((level) => priceAt('Penny Lane', level));
    expect(prices.map(({ currency }) => currency)).toEqual(['Bronze Coins', 'Bronze Coins', 'Bronze Coins']);
    expect(prices[0].value).toBeCloseTo(1);
    expect(prices[1].value).toBeCloseTo(2.12);
    expect(prices[2].value).toBeCloseTo(16.89);
  });

  it('price Extra Space at 5, 100 and 2.56e12', () => {
    expect([1, 2, 10].map((level) => formatAmount(priceAt('Extra Space', level).value))).toEqual(['5', '100', '2.56e12']);
  });

  // Oracles: Holes2.js:222-238 Fountain_BonTOT with no marbles ({ = L * bonusPerLevel) and the-fountain.ts helpers
  // getSpacesOwned :164, getMaxStackSize :166, getFountCurrencyKeep :75 and getFountDuckChance :87 (unexported: pinned).
  it.each([
    ['Currency Booster I', 1, `All currencies are worth +10% more. ${BOOSTER_TAIL}`],
    ['Currency Booster I', 10, `All currencies are worth +100% more. ${BOOSTER_TAIL}`],
    ['Extra Space', 1, 'Coins can appear in 2 different areas on the ground.'],
    ['Extra Space', 20, 'Coins can appear in 16 different areas on the ground.'],
    ['Taller Stacks', 60, 'Each area can stack up to 50 coins, this upgrade increases it by +60.'],
    ['Rubber Ducky', 10, 'Adds a new fountain bar, which when filled has a 1 in 2 chance of giving +1 Rubber Ducky stack.'],
    ['Money Back Guarantee', 10, 'Currency generated while at maximum capacity aren\'t wasted, and instead auto collected at 14.55% of their value.'],
    ['Royal Stacks', 1, "There's a 1 in 297 chance for a currency stack to become 'royal' when the fountain fills. All coins in a royal stack are worth more."],
    ["Luck fo' REAL", 1, 'All currencies collected have a 1 in 990 of being LUCKY, multiplying the value of that currency type forever! Each additional one is 4x rarer'],
    ['Rubber Ducky', 1, 'Adds a new fountain bar, which when filled has a 1 in 3 chance of giving +1 Rubber Ducky stack.']
  ])('read %s at level %i', (name, level, sentence) => {
    expect(textAt(name, level)).toBe(sentence);
  });

  // Oracle: getFountainBonusTotal (the-fountain.ts:44) with no marbles; `}` prints 1 + bonus / 100 (the-fountain.ts:182).
  it('match getFountainBonusTotal at levels 1 and 10 on every upgrade', () => {
    const six = (value) => Math.round(value * 1e6) / 1e6;
    const derived = {};
    const expected = {};
    for (const upgrade of flat) {
      for (const level of [1, 10]) {
        const bonus = getFountainBonusTotal({ fountainUpgradeLevels: { [upgrade.t]: { [upgrade.i]: level } } }, upgrade.t, upgrade.i);
        for (const { token, formula, args } of nodeOf(upgrade).effect.terms.filter((term) => term.token !== '$')) {
          derived[`${upgrade.rawName}:${level}:${token}`] = six(FORMULAS[formula](level, args));
          expected[`${upgrade.rawName}:${level}:${token}`] = six(token === '{' ? bonus : 1 + bonus / 100);
        }
      }
    }
    expect(derived).toEqual(expected);
  });

  it('carry no cap: the game has none', () => {
    expect(upgrades.filter((node) => node.effect.cap !== null)).toEqual([]);
  });

  // The filter drops every account readout segment and keeps each text's first sentence.
  it('drop only the account readouts, keeping the first sentence of every changed text', () => {
    const changed = flat.filter((upgrade) => nodeOf(upgrade).description !== tidy(upgrade.description));
    expect(changed.map(({ t, i }) => `${t}_${i}`)).toEqual([
      '0_2', '0_3', '0_4', '0_9', '0_10', '0_11', '0_19', '1_2', '1_3', '1_4', '1_19', '2_2', '2_3', '2_4', '2_11'
    ]);
    expect(changed.filter((upgrade) => !nodeOf(upgrade).description.startsWith(tidy(upgrade.description.split('@')[0])))).toEqual([]);
    expect(upgrades.filter((node) => /[#^鉢]|Total_(Ducky_)?Bonus|Total_Currency/i.test(node.description))).toEqual([]);
  });

  // Oracle: Holes2.js:171-177 Fountain_UpgUnlocked, the prereq at level 10, or at 1 for water 0 slots 2 and 14.
  it('name the prereq and the level it needs', () => {
    const early = ['Fountain0_2', 'Fountain0_14'];
    expect(Object.fromEntries(upgrades.map((node) => [node.rawName, fieldOf(node, 'Unlocked by')?.match(/at level (\d+)$/)[1]]))).toEqual(
      Object.fromEntries(flat.map((upgrade) => [upgrade.rawName, upgrade.prereqIndex === -1 ? undefined : early.includes(upgrade.rawName) ? '1' : '10']))
    );
    expect(fieldOf(byName('Penny Lane'), 'Unlocked by')).toBe('Fountain Filling at level 1');
    expect(fieldOf(byName('Stackin\' Monayy'), 'Water')).toBe('Yellow water');
  });
});

describe('jar collectibles', () => {
  const collectibles = ofKind('jarcollectible');
  const byName = (name) => collectibles.find((node) => spaced(node.name) === name);
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const raw = data.holesInfo[67];
  // UPKEEP: the five "Boosts a future cavern" rows of HolesInfo[67], read off the data.
  const FUTURE = [31, 32, 37, 38, 39];

  it('skip only the future cavern placeholders', () => {
    expect(report.jarcollectible.skipped.map(({ index }) => index)).toEqual(FUTURE);
    expect(collectibles).toHaveLength(raw.length - FUTURE.length);
  });

  // Oracle: the-jars.ts:82 prints `{` as the bonus and `}` as 1 + bonus / 100.
  it.each([
    ['Abnormal Rupie', 1, 'Rupies found are worth +20% more.'],
    ['Abnormal Rupie', 10, 'Rupies found are worth +200% more.'],
    ['Tortole Rock', 1, 'All rupies found are worth a whopping 1.25x more!'],
    ['Deep Blue Square', 1, '+1% Gambit PTS']
  ])('read %s at level %i', (name, level, sentence) => {
    expect(textAt(name, level)).toBe(sentence);
  });

  it('drop the live Current Rupie Value readout', () => {
    expect(collectibles.filter((node) => /Current_Rupie_Value|:\$/.test(node.description))).toEqual([]);
  });

  // Oracle: getJarBonus (the-jars.ts:281), with legend talent 29 at 0 so its multiplier is 1; `}` is 1 + bonus / 100.
  it('match getJarBonus at levels 1 and 10 on every collectible', () => {
    const six = (value) => Math.round(value * 1e6) / 1e6;
    const account = { legendTalents: { talents: [{ originalIndex: 29, bonus: 0 }] } };
    const derived = {};
    const expected = {};
    for (const node of collectibles) {
      const i = node.order;
      for (const level of [1, 10]) {
        const bonus = getJarBonus({ holesObject: { jarStuff: { [i]: level } }, i, account });
        for (const { token, formula, args } of node.effect.terms) {
          derived[`${node.rawName}:${level}:${token}`] = six(FORMULAS[formula](level, args));
          expected[`${node.rawName}:${level}:${token}`] = six(token === '{' ? bonus : 1 + bonus / 100);
        }
      }
    }
    expect(derived).toEqual(expected);
  });
});

describe('cove upgrades', () => {
  const upgrades = ofKind('coveupgrade');
  const byName = (name) => upgrades.find((node) => spaced(node.name) === name);
  const priceAt = (name, level) => costsAt(byName(name), level)[0];
  const textAt = (name, level) => spaced(levelledText(byName(name), level));
  const names = data.randomList2[11];
  const skipped = names.indexOf('IDK_Broh');

  it('skip only the unreleased World 7 slot', () => {
    expect(report.coveupgrade.skipped.map(({ index }) => names[index])).toEqual(['IDK_Broh']);
    expect(upgrades).toHaveLength(names.length - 1);
  });

  // Oracle: Holes2.js:498-515 Cglunko_upgCost. getCglunkoUpgCost is unexported, so the values are pinned
  // (the level 1 and 2 points sit in formulas.test.js).
  it('price Opal Find and Slop Drop, a slot pair, in Gooey Triangles', () => {
    expect(formatAmount(priceAt('Opal Find', 10).value)).toBe('75,084,695');
    expect(priceAt('Opal Find', 10).currency).toBe('Gooey Triangle');
    expect(priceAt('Slop Drop', 10).value).toBe(119);
    expect(priceAt('Slop Drop', 10).currency).toBe('Gooey Triangle');
  });

  it('read the discount on Active Drops', () => {
    expect(textAt('Active Drops', 1)).toBe('Decrease the cost of all upgrades here by 2.91%');
    expect(textAt('Active Drops', 10)).toBe('Decrease the cost of all upgrades here by 23.07%');
  });

  it('put slots below 12 on the Crystal tab and the rest on Jeweled', () => {
    expect(Object.fromEntries(upgrades.map((node) => [node.rawName, fieldOf(node, 'Tab')]))).toEqual(
      Object.fromEntries(names.map((name, t) => [`CoveUpgrade${t}`, t < 12 ? 'Crystal' : 'Jeweled']).filter(([key]) => key !== `CoveUpgrade${skipped}`))
    );
  });

  // Oracle: Cglunko_upgCost pays slot t in shape floor((t % 12) / 2) + 6 floor(t / 12), at 1 (even) or 5 (odd) for level 1.
  it('link each upgrade to its gooey shape', () => {
    const edges = registryEdges(data, world5).filter((edge) => edge.from.startsWith('coveupgrade:'));
    const expected = names.map((name, t) => ({
      from: `coveupgrade:CoveUpgrade${t}`,
      to: `item:HoleGshape${Math.floor((t % 12) / 2) + 6 * Math.floor(t / 12)}`,
      rel: 'upgradedWith',
      meta: { baseCost: t % 2 === 1 ? 5 : 1 },
      source: 'registry'
    })).filter((edge) => edge.from !== `coveupgrade:CoveUpgrade${skipped}`);
    expect(edges).toEqual(expected);
    expect(edges.filter((edge) => !data.items[edge.to.replace('item:', '')])).toEqual([]);
  });

  // Oracle: getCglunkoBonus (crystal-glunko-cove.ts:16); `}` prints 1 + bonus / 100 and `$` the floored 1 / (1 + bonus / 100) cut.
  it('match getCglunkoBonus at levels 1 and 10 on every upgrade', () => {
    const six = (value) => Math.round(value * 1e6) / 1e6;
    const derived = {};
    const expected = {};
    for (const node of upgrades) {
      const t = node.order;
      for (const level of [1, 10]) {
        const bonus = getCglunkoBonus({ accountOptions: { [630 + t]: level } }, t);
        const wanted = { '{': bonus, '}': 1 + bonus / 100, $: Math.floor(1e4 * (1 - 1 / (1 + bonus / 100))) / 100 };
        for (const { token, formula, args } of node.effect.terms) {
          derived[`${node.rawName}:${level}:${token}`] = six(FORMULAS[formula](level, args));
          expected[`${node.rawName}:${level}:${token}`] = six(wanted[token]);
        }
      }
    }
    expect(derived).toEqual(expected);
  });
});
