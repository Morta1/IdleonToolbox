import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes, registryReport } from '../../scripts/entity-graph/registry/build.mjs';
import world5 from '../../scripts/entity-graph/registry/world-5/index.mjs';
import { costsAt, costsToMax, levelledText } from '../../utility/wiki/effects.mjs';

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
