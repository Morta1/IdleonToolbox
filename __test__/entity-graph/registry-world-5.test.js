import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes, registryReport } from '../../scripts/entity-graph/registry/build.mjs';
import world5 from '../../scripts/entity-graph/registry/world-5/index.mjs';
import { costsAt, costsToMax, formatAmount, levelledText } from '../../utility/wiki/effects.mjs';

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
  it('fill the World 4 Stuff text at one and five wishes', () => {
    const node = byName('World_4_Stuff');
    expect(spaced(levelledText(node, 1))).toBe("Uhh, sure, how about these bonuses: +25% Cooking Speed. +10% Shiny Mob LV Up & Breedability Rate. +8% Lab EXP gain");
    expect(spaced(levelledText(node, 5))).toContain('+125% Cooking Speed. +50% Shiny Mob LV Up & Breedability Rate. +40% Lab EXP gain');
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
