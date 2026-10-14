import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { enrichClasses } from '../../scripts/entity-graph/enrich-classes.mjs';
import { buildBotIndex } from '../../scripts/entity-graph/bot-index.mjs';
import { classNodes } from '../../scripts/entity-graph/nodes/classes.mjs';
import { FORMULAS, levelledText } from '../../utility/wiki/effects.mjs';
import { entityDescription } from '../../utility/wiki/seo';
import { getFamilyBonusBonus } from '../../parsers/family';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));

// The before/after snapshots name exactly which nodes the enrichment touched.
const blank = () => classNodes(data.classPromotions);
const before = blank();
const snapshot = Object.fromEntries(Object.entries(before).map(([id, node]) => [id, JSON.stringify(node)]));
const nodes = blank();
enrichClasses(nodes, data);
const changed = (prefix) => Object.keys(nodes).filter((id) => id.startsWith(prefix) && JSON.stringify(nodes[id]) !== snapshot[id]).sort();
const familyOf = (name) => nodes[`class:${name}`].familyBonus;
const textAt = (name, level) => levelledText(familyOf(name), level);

describe('which class nodes are enriched', () => {
  it('enrich every released class whose family row is not a placeholder', () => {
    const placeholder = (bonus) => ['NO_FAMILY_BONUS', 'NOPE', 'FILLER'].includes(bonus.name) || bonus.func === 'txt';
    const expected = Object.entries(data.classPromotions)
      .filter(([name, entry]) => nodes[`class:${name}`] && !placeholder(data.classFamilyBonuses[entry.index]))
      .map(([name]) => `class:${name}`)
      .sort();
    expect(expected.length).toBeGreaterThan(0);
    expect(changed('class:')).toEqual(expected);
    expect(changed('class:')).not.toContain('class:Beginner');
  });

  // seo.js and the bot read `effect` and `description`, and a family bonus at class level 1 reads "+0%".
  it('adds nothing but familyBonus, so no `effect` or `fields` reaches search, the bot or the page description', () => {
    const extras = changed('class:').map((id) => Object.keys(nodes[id]).filter((key) => !(key in before[id])));
    expect(extras).toEqual(changed('class:').map(() => ['familyBonus']));
  });

  it('leave the bot entry and the page description of a class exactly as they were', () => {
    const withSlugs = (set) => Object.fromEntries(Object.entries(set).map(([id, node]) => [id, { ...node, slug: node.rawName.toLowerCase() }]));
    const botEntries = (set) => buildBotIndex(withSlugs(set), []).sort((a, b) => a.id.localeCompare(b.id));
    expect(botEntries(nodes)).toEqual(botEntries(before));
    const descriptions = (set) => Object.entries(set).map(([id, node]) => entityDescription(node, [], id));
    expect(descriptions(nodes)).toEqual(descriptions(before));
  });
});

// Oracle: FamilyBonsuesREAL / FormatBonuses (N.js:80499-80504), cross-checked by getFamilyBonusBonus
// (parsers/family.ts:6-9, raw values).
describe('family bonus text', () => {
  it('carries the Blood Berserker curve as the family panel reads it', () => {
    expect(familyOf('Blood_Berserker')).toEqual({
      description: '+{%_TOTAL_DAMAGE',
      effect: {
        levelLabel: 'Class level',
        cap: null,
        from: 70,
        terms: [{ token: '{', formula: 'familyBonus', args: { func: 'decay', x1: 20, x2: 180, offset: 69 } }]
      }
    });
  });

  it('writes the game multiplier glyph as an x', () => {
    expect(familyOf('Wind_Walker').description).toBe('{x_COINS_FROM_MOBS');
    expect(textAt('Shaman', 100)).toBe('1.17x HIGHER BONUSES FROM GOLDEN FOODS');
  });

  it.each([
    ['Death_Bringer', 130, '+0.07% KILL PER KILL'],
    ['Squire', 200, '+25% TOTAL HP'],
    ['Elemental_Sorcerer', 200, '+5.45 LV FOR ALL TALENTS ABOVE LV 1']
  ])('reads %s at class level %s as the panel does', (name, level, expected) => {
    expect(textAt(name, level)).toBe(expected);
  });

  it('opens each bonus at the level the game starts it', () => {
    expect(familyOf('Death_Bringer').effect.from).toBe(130);
  });

  it('agrees with the parser on the raw value, to the panel rounding', () => {
    const drift = changed('class:').flatMap((id) => {
      const { description, effect } = nodes[id].familyBonus;
      const bonus = data.classFamilyBonuses[data.classPromotions[id.slice('class:'.length)].index];
      return [effect.from, 200, 500].map((level) => {
        const shown = FORMULAS.familyBonus(level, effect.terms[0].args);
        const raw = getFamilyBonusBonus(data.classFamilyBonuses, bonus.name, level);
        // FormatBonuses rounds to a whole number at most, so the shown value is never further than 0.5 away.
        return Math.abs(shown - raw) <= 0.5 ? null : [description, level, shown, raw];
      });
    }).filter(Boolean);
    expect(drift).toEqual([]);
  });

  // Class nodes are not registry nodes, so the generic sweep never reads these.
  it('leaves no placeholder, stray glyph or non-ASCII character at either end of the range', () => {
    const LEFTOVER = /[{}$#@^~|<]|NaN|Infinity|\bundefined\b|\bnull\b|\[object Object\]|[^\x20-\x7e]/;
    const bad = changed('class:').flatMap((id) => {
      const { from } = nodes[id].familyBonus.effect;
      return [from, 10000].map((level) => [id, level, levelledText(nodes[id].familyBonus, level)]);
    }).filter(([, , text]) => LEFTOVER.test(text));
    expect(bad).toEqual([]);
  });
});
