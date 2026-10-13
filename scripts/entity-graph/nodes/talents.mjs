import { titleCase } from '../registry/text.mjs';

// Every talent in the game, one page each.
//
// Talents are the largest thing the site knows about and never showed publicly: they render only
// inside /account (which needs an uploaded save) and inside a build's grid on /tools/builds, where
// a talent appears as a cell rather than as a page. Nothing answers "what does Chemical Warfare do,
// and what does it cost to cast".
//
// The file is keyed class -> talent -> data, 433 rows, but only 376 distinct talents: the three
// Basics tabs repeat the whole Beginner tab verbatim, and a handful of talents are shared between
// two elite classes. skillIndex is the game's own identity for a talent and is what dedupes them,
// so a shared talent is one page listing every class that has it rather than four near-identical
// pages competing for the same search.
//
// The four "Special Talent" tabs are the Star Talent tabs, which is what the game calls them
// everywhere a player can see.
const STAR_TAB = /^Special Talent \d+$/;

const className = (tab) => (STAR_TAB.test(tab) ? 'Star Talents' : tab.replace(/_/g, ' '));

// The description carries `{` and `}` where the values go, and both depend on the talent's level,
// so the growth inputs travel on the node as two terms and the page fills them at whatever level
// the reader types.
const talentTerms = (talent) => ({
  levelLabel: 'Talent level',
  cap: null,
  terms: [
    { token: '{', formula: 'growth', args: { func: talent.funcX, x1: talent.x1, x2: talent.x2 } },
    { token: '}', formula: 'growth', args: { func: talent.funcY ?? null, x1: talent.y1 ?? null, x2: talent.y2 ?? null } }
  ]
});
// What an attack talent costs to use. 91 of the 376 have these; the rest are passives.
const ATTACK_FIELDS = ['cooldown', 'castTime', 'manaCost'];

const pick = (source, fields) => Object.fromEntries(
  fields.filter((field) => source?.[field] !== undefined && source?.[field] !== null)
    .map((field) => [field, source[field]])
);

// The listing bands and sorts by this rather than alphabetically, so the page reads in the game's
// own tab order (Beginner, Journeyman, Maestro, ...) instead of opening on Arcane Cultist.
const TAB_STRIDE = 1000;

export const talentNodes = (talents) => {
  const nodes = {};
  for (const [tabIndex, [tab, tabTalents]] of Object.entries(talents || {}).entries()) {
    for (const [position, [id, talent]] of Object.entries(tabTalents || {}).entries()) {
      if (talent?.skillIndex == null) continue;
      const key = `talent:${talent.skillIndex}`;
      const existing = nodes[key];
      if (existing) {
        // A talent two classes share. One page, both classes named on it, and the class it was
        // first filed under stays the category so the listing bands the way the game's tabs do.
        if (!existing.classes.includes(className(tab))) existing.classes.push(className(tab));
        continue;
      }
      nodes[key] = {
        kind: 'talent',
        rawName: id,
        // HEALTH_BOOSTER would read "HEALTH BOOSTER" through the usual underscore strip, so it is
        // title-cased into the shape builds.json already uses (Health_Booster).
        name: titleCase(id),
        icon: `/data/UISkillIcon${talent.skillIndex}.png`,
        category: className(tab),
        classes: [className(tab)],
        order: tabIndex * TAB_STRIDE + position,
        description: talent.description || null,
        ...(talent.funcX ? { effect: talentTerms(talent) } : {}),
        ...pick(talent, ATTACK_FIELDS)
      };
    }
  }
  return nodes;
};
