import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import latest from '../fixtures/latest.json';
import highend from '../fixtures/highend.json';
import fresh from '../fixtures/fresh.json';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import { PAGES } from '@components/constants';
import { DESCRIPTORS, descriptorsForRoute, getDescriptor, withDescriptors } from '@utility/goals/registry';
import { GOAL_ROUTES, hasGoals } from '@utility/goals/routes';
import { GOAL_TABS, systemForTab } from '@utility/goals/tabs';
import { getTabs } from '@utility/helpers';
import { realCap } from '@utility/goals/caps';
import { findQuantityOwned, getAllItems } from '@parsers/items';
import { BEANSTALK_BREAKPOINTS, getBeanstalkFoods, isCountedGreenstack, isMissingGreenstack, SKILL_MASTERY_THRESHOLDS, SKILLS_WITHOUT_MASTERY } from '@parsers/misc';
import { constructionMasteryThresholds } from '@parsers/world-3/construction';
import { greenstackGoal, GREENSTACK_AMOUNT } from '@utility/goals/registry/greenstack';
import { getCachedAllItems, ownedItemsOf } from '@utility/goals/registry/ownedItems';
import { resolveGoal } from '@utility/goals/resolve';
import { createGoal } from '@utility/goals/store';
import { liveEntries } from '@parsers/catalog';
import { achievements, cauldrons, constellations, dungeonCreditShop, emperorBonuses, exoticMarketInfo, riftInfo, gemShop, gamingImports, generalSpelunky, itemsArray, jadeUpgrades, legendTalents, merits, mineheadUpgrades, ninjaExtraInfo, ninjaUpgrades, prayers, researchGridSquares, researchOccurrences, tasks, tomeData, upgradeVault } from '@website-data';
import { cleanUpgradeName } from '@utility/goals/registry/names';
import { isTrackableItem } from '@utility/materialTracker';
import { ARTIFACT_TIERS } from '@components/account/Worlds/World5/Sailing/sailing.consts';

const fixtures = { latest, highend, fresh };
const contexts = (d, parsed) => d.scope === 'character'
  ? parsed.characters.map((character) => ({ ...parsed, character }))
  : [parsed];

const kebab = (s) => s.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();
const pageRoutes = () => [
  ...Object.keys(PAGES.GENERAL).map((key) => `/${kebab(key)}`),
  ...Object.entries(PAGES.ACCOUNT).flatMap(([category, { categories }]) =>
    categories.map(({ label }) => `/account/${kebab(category)}/${kebab(label)}`)),
  ...Object.keys(PAGES.TOOLS).map((key) => `/tools/${kebab(key)}`)
];

describe.each(DESCRIPTORS.map((d) => [d.system, d]))('%s descriptor', (system, d) => {
  it.each(Object.entries(fixtures))('%s: unique non-empty keys, finite values, null-or-positive max', (_, fx) => {
    for (const ctx of contexts(d, parseFixture(fx))) {
      const rows = d.list(ctx);
      const keys = rows.map(d.key);
      expect(keys.every((k) => typeof k === 'string' && k.length > 0)).toBe(true);
      expect(new Set(keys).size).toBe(keys.length);
      for (const [name, m] of Object.entries(d.metrics)) {
        for (const row of rows) {
          expect(Number.isFinite(m.value(row, ctx)), `${name} ${d.key(row)}`).toBe(true);
          const max = m.max?.(row, ctx) ?? null;
          expect(max === null || (Number.isFinite(max) && max > 0), `${name} max ${d.key(row)}`).toBe(true);
        }
      }
    }
  });

  it('the same entry has the same key in latest and highend', () => {
    const [a] = contexts(d, parseFixture(latest));
    const [b] = contexts(d, parseFixture(highend));
    const other = new Map(d.list(b).map((row) => [d.name(row), d.key(row)]));
    const sample = d.list(a).filter((row) => other.has(d.name(row))).slice(0, 5);
    expect(sample.length).toBeGreaterThan(0);
    for (const row of sample) expect(d.key(row)).toBe(other.get(d.name(row)));
  });

  it('every icon exists under public/', () => {
    const [ctx] = contexts(d, parseFixture(latest));
    const rows = (d.iconRows ?? ((r) => r))(d.list(ctx), ctx);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(existsSync(join(process.cwd(), 'public', `${d.icon(row)}.png`)), d.icon(row)).toBe(true);
    }
  });

  // iconRows narrows the check above to rows known to have art; this one covers every row the UI can
  // request, so art that only ships as <name>_x1.png is caught even when the fixture does not own it
  it.each(Object.entries(fixtures))('%s: every row with art requests the file that exists', (_, fx) => {
    const art = (path) => existsSync(join(process.cwd(), 'public', `${path}.png`));
    const wrong = [];
    for (const ctx of contexts(d, parseFixture(fx))) {
      for (const row of d.list(ctx)) {
        const icon = d.icon(row);
        if (!icon || art(icon)) continue;
        const base = icon.replace(/_x1$/, '');
        if (art(base) || art(`${base}_x1`)) wrong.push(icon);
      }
    }
    expect([...new Set(wrong)]).toEqual([]);
  });

  it('route is a page in PAGES and in GOAL_ROUTES', () => {
    expect(pageRoutes()).toContain(d.route);
    expect(GOAL_ROUTES[system]).toBe(d.route);
    expect(hasGoals(d.route)).toBe(true);
    expect(descriptorsForRoute(d.route).map((x) => x.system)).toContain(system);
  });

  it('empty account lists without throwing, with finite values and a null-or-positive max', () => {
    for (const ctx of contexts(d, parseEmpty())) {
      expect(() => d.list(ctx)).not.toThrow();
      for (const [name, m] of Object.entries(d.metrics)) {
        for (const row of d.list(ctx)) {
          expect(Number.isFinite(m.value(row, ctx)), `${name} ${d.key(row)}`).toBe(true);
          const max = m.max?.(row, ctx) ?? null;
          expect(max === null || (Number.isFinite(max) && max > 0), `${name} max ${d.key(row)}`).toBe(true);
        }
      }
    }
  });
});

it('system ids are unique and GOAL_ROUTES has exactly the registered systems', () => {
  const systems = DESCRIPTORS.map((d) => d.system);
  expect(new Set(systems).size).toBe(systems.length);
  expect(Object.keys(GOAL_ROUTES).sort()).toEqual([...systems].sort());
});

describe('tab to system map', () => {
  const pageTabs = (route) => Object.entries(PAGES.ACCOUNT).flatMap(([category, { categories }]) => categories
    .filter(({ label }) => `/account/${kebab(category)}/${kebab(label)}` === route)
    .flatMap(({ label }) => getTabs(categories, label)));

  it.each(Object.entries(GOAL_TABS))('%s maps real page tabs to that page systems', (route, tabs) => {
    expect(Object.keys(tabs).filter((tab) => !pageTabs(route).includes(tab))).toEqual([]);
    expect(Object.values(tabs).filter((system) => GOAL_ROUTES[system] !== route)).toEqual([]);
  });

  it.each([
    ['a mapped tab', { t: 'Measure' }, 'measurement'],
    ['an unknown tab', { t: 'Nope' }, 'villager'],
    ['no tab', {}, 'villager']
  ])('on the Hole page %s opens %s', (_, query, system) => {
    const route = '/account/world-5/hole';
    expect(systemForTab(route, query, descriptorsForRoute(route))).toBe(system);
  });

  it('a tab system the popover was not given falls back to the first one', () => {
    expect(systemForTab('/account/world-5/hole', { t: 'Measure' }, [getDescriptor('study')])).toBe('study');
  });
});

it('hasGoals ignores query, hash and trailing slash and rejects other pages', () => {
  expect(hasGoals('/account/world-2/bubbles?x=1')).toBe(true);
  expect(hasGoals('/account/world-2/bubbles/')).toBe(true);
  expect(hasGoals('/account/world-2/alchemy')).toBe(false);
  expect(hasGoals(undefined)).toBe(false);
});

describe('withDescriptors', () => {
  const stub = { system: 'stub', route: '/stub' };
  it('swaps the list and restores it, also when fn throws or is async', async () => {
    withDescriptors([stub], () => expect(getDescriptor('stub')).toBe(stub));
    expect(getDescriptor('stub')).toBeUndefined();
    expect(() => withDescriptors([stub], () => { throw new Error('boom'); })).toThrow('boom');
    expect(getDescriptor('bubble')).toBeDefined();
    await withDescriptors([stub], async () => {
      await Promise.resolve();
      expect(getDescriptor('stub')).toBe(stub);
    });
    expect(getDescriptor('stub')).toBeUndefined();
    await expect(withDescriptors([stub], async () => { throw new Error('late'); })).rejects.toThrow('late');
    expect(getDescriptor('bubble')).toBeDefined();
  });
});

it.each([[999999, 999999, null], [200, 999999, 200], [998, 999, 998], [999, 999, null], [null, undefined, null], [-1, undefined, null], [0, undefined, null]])(
  'realCap(%j, %j) = %j', (n, p, out) => expect(realCap(n, p)).toBe(out));

it('cleanUpgradeName strips glyphs and help markers', () => {
  expect(cleanUpgradeName('Wraith_Damage(Tap_for_more_info)船')).toBe('Wraith Damage');
});

// Lists that are filtered after the catalog position is known: the key must stay the catalog position
// (or the game's own id), whatever the filter drops, in every fixture.
const catalogKeys = {
  statue: ({ account }) => account.statues.map(({ index }) => String(index)),
  arcade: ({ account }) => account.arcade.shop.map((u, i) => [u, i]).filter(([u]) => !/who_knows/i.test(u.effect ?? '')).map(([, i]) => String(i)),
  sigil: ({ account }) => account.alchemy.p2w.sigils.filter(({ index }) => index <= 24).map(({ index }) => String(index)),
  killroyShop: ({ account }) => account.killroy.permanentUpgrades.map((_, i) => String(i)).filter((k) => k !== '2'),
  vial: ({ account }) => account.alchemy.vials.map(({ mainItem }) => mainItem),
  prayer: () => liveEntries(prayers).map(({ index }) => String(index)),
  equinoxUpgrade: ({ account }) => account.equinox.upgrades.map((u, i) => [u, i]).filter(([u]) => u.name !== 'Hmm...').map(([, i]) => String(i)),
  // the Tome page lists entries by display rank, the key stays the catalog position
  tome: () => tomeData.map((_, i) => i).toSorted((a, b) => ninjaExtraInfo[32].indexOf(String(a)) - ninjaExtraInfo[32].indexOf(String(b))).map(String),
  achievement: () => achievements.map((a, i) => [a, i]).filter(([a]) => a.visualIndex !== -1 && !a.name?.includes('FILLER')).map(([, i]) => String(i)),
  task: () => tasks.flatMap((world, w) => world.slice(0, 9).map((t, i) => [t, w, i]))
    .filter(([t, , i]) => i !== 8 && t.name !== 'Undisclosed_Task').map(([, w, i]) => `${w}:${i}`),
  merit: () => merits.flatMap((world, w) => world.map((m, i) => [m, w, i]))
    .filter(([m]) => m.descLine1 !== 'IDK_YET' && m.meritCost !== null).map(([, w, i]) => `${w}:${i}`),
  // the parser drops the empty box; the key is the game index inside the sprite name
  gamingImport: () => gamingImports.map((item, i) => [item, i]).filter(([item]) => !item.boxName.includes('Empty_Box')).map(([, i]) => String(i)),
  // the page hides the 'i' placeholder rows; the key stays the catalog position
  measurement: ({ account }) => account.hole.measurements.map((m, i) => [m, i]).filter(([m]) => m.description !== 'i').map(([, i]) => String(i)),
  // the last palette entry is the final bonus number
  palette: ({ account }) => account.gaming.palette.map((p, i) => [p, i]).filter(([p]) => typeof p === 'object').map(([, i]) => String(i)),
  // the parser drops the NAME_MAGNI placeholder; the key stays the game index
  exoticMarket: () => exoticMarketInfo.map((u, i) => [u, i]).filter(([u]) => u.name !== 'NAME_MAGNI').map(([, i]) => String(i)),
  // the page lists the emporium by display order and hides placeholders; the key is the game upgrade id
  jade: () => jadeUpgrades.map((u, i) => [u, i]).toSorted(([, a], [, b]) => ninjaExtraInfo[24].indexOf(String(a)) - ninjaExtraInfo[24].indexOf(String(b)))
    .filter(([u]) => u.name !== 'UNDER_CONSTRUCTION').map(([, i]) => String(i)),
  sneakUpgrade: () => ninjaUpgrades.map((u, i) => [u, i]).filter(([u]) => u.name !== 'Name').map(([, i]) => String(i)),
  // the parser drops the numeric placeholder bosses; the key is the cave
  loreBoss: () => generalSpelunky[14].map((description, i) => [description, i])
    .filter(([description]) => description && Number.isNaN(Number(description))).map(([, i]) => String(i)),
  // the page hides the 'Name' grid squares; the key stays the grid cell
  researchSquare: () => researchGridSquares.map((s, i) => [s, i]).filter(([s]) => s.name !== 'Name').map(([, i]) => String(i)),
  // the parser skips the 'Name' observations; the key stays the game's observation index
  observation: () => researchOccurrences.map((o, i) => [o, i]).filter(([o]) => o.name !== 'Name').map(([, i]) => String(i)),
  mineheadUpgrade: () => mineheadUpgrades.map((u, i) => [u, i]).filter(([u]) => Number(u.baseCost) > 0).map(([, i]) => String(i)),
  // the page skips the Blank rows and the specials (their slots are shared with the past specials); the first row of an index wins
  gemShop: () => [...new Set(gemShop.filter(({ name }) => name !== 'past_limited_specials')
    .flatMap(({ sections }) => Object.entries(sections).filter(([section]) => section !== 'Limited_Specials').flatMap(([, items]) => items))
    .filter(({ rawName, displayName }) => rawName !== 'Blank' && displayName !== 'NAME_OF_ITEM')
    .map(({ globalIndex }) => String(globalIndex)))],
  // the key is the game's index, set before the parser drops placeholder rows
  dungeonItem: () => liveEntries(dungeonCreditShop).map(({ index }) => String(index)),
  vaultUpgrade: () => liveEntries(upgradeVault).map(({ index }) => String(index)),
  // the unreleased "BUBBLE" rows cost the game's Not_Yet filler material
  bubble: ({ account }) => account.alchemy.bubblesFlat
    .filter(({ cauldron, index }) => !cauldrons[cauldron][index].itemReq.some(({ rawName }) => rawName === 'FillerMaterial'))
    .map(({ bubbleIndex }) => bubbleIndex),
  // the Bonuses tab shows only the rift rows that carry a bonus; the key is the rift index
  riftBonus: () => riftInfo.map((r, i) => [r, i]).filter(([r]) => r.riftBonus).map(([, i]) => String(i)),
  // the Mastery tab's "no bonus here yet" placeholders are left out; the key is the mastery index
  ninjaMastery: ({ account }) => account.sneaking.ninjaMasteryBonuses.filter(({ description }) => !/no_bonus_here_yet/i.test(description))
    .map(({ index }) => String(index)),
  // the beanstalk skips the numbers in its food list; the key is the golden food
  beanstalk: () => ninjaExtraInfo[29].filter((str) => isNaN(str)),
  // the catalog repeats each bonus once per unlock level; the key is the bonus id
  emperorBonus: () => [...new Set(emperorBonuses.map(({ index }) => String(index)))],
  // the parser drops the constellations with no map; the key is the save index
  constellation: () => constellations.filter(({ mapIndex }) => mapIndex != null).map(({ rawIndex, mapIndex }) => String(rawIndex ?? mapIndex))
};
describe('filtered lists keep catalog keys', () => {
  it.each(Object.keys(catalogKeys).flatMap((system) => Object.keys(fixtures).map((name) => [system, name])))(
    '%s in %s', (system, name) => {
      const parsed = parseFixture(fixtures[name]);
      expect(getDescriptor(system).list(parsed).map(getDescriptor(system).key)).toEqual(catalogKeys[system](parsed));
    });
});

// The page sorts these by what you own, so the order moves with the save; the key set must not.
const sortedCatalogKeys = {
  // the page lists by display index and drops the filler rows; the key is the game's talent index
  legendTalent: () => legendTalents.map((t, i) => [t, i]).filter(([t]) => t.name !== 'filler').map(([, i]) => String(i)),
  trophy: () => itemsArray.filter((item) => item?.Type === 'TROPHY').map((item) => item.rawName),
  nametag: () => itemsArray.filter((item) => item?.Type === 'NAMETAG').map((item) => item.rawName)
};
describe('sorted lists keep catalog keys', () => {
  it.each(Object.keys(sortedCatalogKeys).flatMap((system) => Object.keys(fixtures).map((name) => [system, name])))(
    '%s in %s', (system, name) => {
      const parsed = parseFixture(fixtures[name]);
      expect(getDescriptor(system).list(parsed).map(getDescriptor(system).key).toSorted()).toEqual(sortedCatalogKeys[system]().toSorted());
    });
});

// Membership comes from the catalog (or a rule over it) that the descriptor filters, so no fixture may add or drop an entry.
const catalogDrivenSystems = ['companion', 'starSign', 'gemShop', 'constellation', 'royalStatue', 'apocalypse', 'dungeonUpgrade'];
it.each(catalogDrivenSystems)('%s lists the same keys in latest and highend', (system) => {
  const d = getDescriptor(system);
  const keysOf = (fx) => d.list(contexts(d, parseFixture(fx))[0]).map(d.key).toSorted();
  const keys = keysOf(latest);
  expect(keys.length).toBeGreaterThan(0);
  expect(keysOf(highend)).toEqual(keys);
});

describe('item and greenstack goals', () => {
  const { account, characters } = parseFixture(latest);
  const ctx = { account, characters };
  const owned = getAllItems(characters, account);

  it('goals and the dashboard alerts share one owned-items list per account and characters', () => {
    const list = ownedItemsOf(ctx);
    expect(list).toEqual(owned);
    expect(getCachedAllItems(characters, account)).toBe(list);
    expect(getCachedAllItems(characters.slice(0, 1), account)).not.toBe(list);
  });

  it('item quantity is the owned amount and routes to the material tracker', () => {
    const row = owned.find(({ amount, displayName }) => amount > 1 && displayName);
    const goal = createGoal({ system: 'item', key: row.rawName, metric: 'quantity', target: 1 });
    expect(resolveGoal(goal, ctx).value).toBe(findQuantityOwned(owned, row.displayName).amount);
    expect(GOAL_ROUTES.item).toBe('/tools/material-tracker');
    expect(GOAL_ROUTES.greenstack).toBe('/tools/material-tracker');
  });

  it('item search lists the old tracker items (no gear, no placeholders) under unique names', () => {
    const d = getDescriptor('item');
    const rows = d.list(ctx);
    expect(rows.map(d.key)).toEqual(itemsArray.filter(isTrackableItem).map(({ rawName }) => rawName));
    expect(rows.filter((row) => row.itemType === 'Equip' || /ERROR|Blank|Filler|DONTFILL|FILLER/.test(`${row.displayName} ${row.rawName}`))).toEqual([]);
    const names = rows.map(d.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('slab goals skip slab ids with no item behind them', () => {
    const d = getDescriptor('slab');
    const named = account.looty.slabItems.filter(({ name }) => name);
    expect(named.length).toBeLessThan(account.looty.slabItems.length);
    expect(d.list(ctx).map(d.key)).toEqual(named.map(({ itemRawName }) => itemRawName));
  });

  it('slab goals cover every slab item in one of the named categories, and take no single item', () => {
    const d = getDescriptor('slab');
    const rows = d.list(ctx);
    expect(d.allOnly).toBe(true);
    expect(rows.filter((row) => !Object.hasOwn(d.groups.names, d.groups.of(row)))).toEqual([]);
    const used = new Set(rows.map(d.groups.of));
    expect(Object.keys(d.groups.names).filter((id) => !used.has(id))).toEqual([]);
  });

  it('a watch item goal at zero owned resolves ok', () => {
    const row = getDescriptor('item').list(ctx).find((r) => r.displayName && !findQuantityOwned(owned, r.displayName).amount);
    const view = resolveGoal(createGoal({ system: 'item', key: row.rawName, metric: 'quantity', target: 1, watch: true }), ctx);
    expect(view.status).toBe('ok');
    expect(view.value).toBe(0);
  });

  it.each(Object.keys(fixtures))('%s: the greenstack-everything goal matches the slab page and isMissingGreenstack', (name) => {
    const fx = parseFixture(fixtures[name]);
    const fxOwned = getAllItems(fx.characters, fx.account);
    const view = resolveGoal(greenstackGoal(), { account: fx.account, characters: fx.characters });
    const slab = fx.account.looty.slabItems;
    const stackedByOwning = slab.filter((i) => isMissingGreenstack(i) && findQuantityOwned(fxOwned, i.name).amount >= GREENSTACK_AMOUNT).length;
    expect(view.total).toBe(fx.account.looty.greenstackableCount);
    expect(view.met).toBe(fx.account.looty.greenstackableStackedCount + stackedByOwning);
    expect(view.total - view.met).toBe(slab.filter(isMissingGreenstack).length - stackedByOwning);
  });

  it('greenstack goals list exactly the rows the slab page counts, stacked unobtainable ones included', () => {
    const rows = [
      { itemRawName: 'a', greenstackable: true },
      { itemRawName: 'b', greenstackable: true, greenStacked: true, unobtainable: true },
      { itemRawName: 'c', greenstackable: true, unobtainable: true },
      { itemRawName: 'd', greenstackable: true, greenStacked: true, unrealisticGreenstack: true },
      { itemRawName: 'e', greenstackable: true, unrealisticGreenstack: true },
      { itemRawName: 'f', greenStacked: true }
    ];
    const listed = getDescriptor('greenstack').list({ account: { looty: { slabItems: rows } } }).map(({ itemRawName }) => itemRawName);
    expect(listed).toEqual(['a', 'b', 'd']);
    expect(rows.filter(isCountedGreenstack).map(({ itemRawName }) => itemRawName)).toEqual(listed);
  });

  it('a registered greenstack below 10M owned counts as met', () => {
    const row = getDescriptor('greenstack').list(ctx).find((r) => r.greenStacked && findQuantityOwned(owned, r.name).amount < GREENSTACK_AMOUNT);
    expect(row).toBeDefined();
    const view = resolveGoal(createGoal({ system: 'greenstack', key: row.itemRawName, metric: 'quantity', target: 'max' }), ctx);
    expect(view.status).toBe('reached');
  });
});


describe('world 5 descriptors', () => {
  it('artifact tiers are None plus the Artifacts page wording', () => {
    const tiers = getDescriptor('artifact').metrics.tier.tiers;
    expect(tiers.slice(0, 3)).toEqual(['None', 'Tier 1: Base', 'Tier 2: Ancient']);
    expect(tiers).toEqual(['None', ...ARTIFACT_TIERS.map(({ level, full }) => `Tier ${level}: ${full}`)]);
  });
});

const systemsOfWorld = (world) => Object.entries(GOAL_ROUTES).filter(([, route]) => route.startsWith(`/account/world-${world}/`)).map(([system]) => system);
const MISC_SYSTEMS = ['guildBonus', 'gemShop', 'companion', 'dungeonItem', 'dungeonUpgrade', 'vaultUpgrade', 'constellation', 'starSign', 'key',
  'orblet', 'royalStatue', 'statueFlair', 'apocalypse', 'bones', 'dust', 'tachyon'];

it.each(Object.keys(fixtures))('%s: no descriptor name has a raw game placeholder or underscore', (name) => {
  const parsed = parseFixture(fixtures[name]);
  const bad = DESCRIPTORS.flatMap((d) => contexts(d, parsed).flatMap((ctx) => d.list(ctx))
    .map((row) => `${d.system}: ${d.name(row)}`)
    .filter((text) => !/:\s\S/.test(text) || /[{}_|$^@]/.test(text.slice(text.indexOf(':') + 1))));
  expect(bad).toEqual([]);
});

// A goal keeps its entry across saves, so the name must not be built from a level or a live value.
it.each([['world 7', systemsOfWorld(7)], ['misc and class-specific', MISC_SYSTEMS], ['merits', ['merit']]])('%s entries keep the same name in every fixture', (_, systems) => {
  const [latestParsed, highendParsed] = [latest, highend].map(parseFixture);
  for (const system of systems) {
    const d = getDescriptor(system);
    const namesOf = (parsed) => new Map(d.list(contexts(d, parsed)[0]).map((row) => [d.key(row), d.name(row)]));
    const other = namesOf(highendParsed);
    for (const [key, name] of namesOf(latestParsed)) {
      if (other.has(key)) expect(other.get(key), `${system} ${key}`).toBe(name);
    }
  }
});

describe('named gaps: rift, divinity, sneaking and missing pages', () => {
  const ctx = parseFixture(latest);
  const { account, characters } = ctx;
  const rowsOf = (system, c = ctx) => getDescriptor(system).list(c);
  const byKey = (system, key, c = ctx) => rowsOf(system, c).find((row) => getDescriptor(system).key(row) === key);
  const value = (system, metric, row, c = ctx) => getDescriptor(system).metrics[metric].value(row, c);

  it('Coral Kid upgrades sit on the Divinity page, grouped by page with the Singularity spiral on page 2', () => {
    const d = getDescriptor('coralKid');
    expect(d.route).toBe('/account/world-5/divinity');
    expect(d.groups.names).toEqual({ 0: 'Coral Kid', 1: 'Singularity' });
    const rows = d.list(ctx);
    expect([...new Set(rows.map(d.groups.of))]).toEqual(['0', '1']);
    expect([...new Set(rows.filter((row) => row.page === 1).map(d.icon))]).toEqual(['data/CKsing']);
  });

  it('land ranks are labelled like the Rank database tab', () => {
    expect(getDescriptor('landRank').label).toBe('Rank database');
  });

  it('skill mastery: one row per skill with mastery, tiers are the page thresholds', () => {
    const d = getDescriptor('skillMastery');
    const skills = Object.keys(account.totalSkillsLevels).filter((skill) => !SKILLS_WITHOUT_MASTERY.includes(skill));
    expect(rowsOf('skillMastery').map(d.key)).toEqual(skills);
    expect(d.metrics.rank.tiers).toEqual(['None', ...SKILL_MASTERY_THRESHOLDS.map((lv) => `Lv. ${lv}`)]);
    for (const skill of skills) {
      const row = byKey('skillMastery', skill);
      expect(value('skillMastery', 'level', row)).toBe(account.totalSkillsLevels[skill].level);
      expect(value('skillMastery', 'rank', row)).toBe(account.totalSkillsLevels[skill].rank);
    }
  });

  it('construct mastery reads the total tower level against the construction thresholds', () => {
    const d = getDescriptor('constructMastery');
    const [row] = rowsOf('constructMastery');
    expect(value('constructMastery', 'level', row)).toBe(account.towers.totalLevels);
    expect(d.metrics.rank.tiers).toEqual(['None', ...constructionMasteryThresholds.map((lv) => `Lv. ${lv}`)]);
    expect(value('constructMastery', 'rank', row)).toBe(constructionMasteryThresholds.filter((lv) => account.towers.totalLevels >= lv).length);
  });

  it('rift bonuses are unlocked at their rift like the Bonuses tab', () => {
    const d = getDescriptor('riftBonus');
    expect(rowsOf('riftBonus').map((row) => value('riftBonus', 'unlocked', row)))
      .toEqual(rowsOf('riftBonus').map((row) => (Number(d.key(row)) <= account.rift.currentRift ? 1 : 0)));
  });

  it('ninja mastery bonuses unlock one per mastery level', () => {
    const rows = rowsOf('ninjaMastery');
    expect(rows.map((row) => value('ninjaMastery', 'unlocked', row)))
      .toEqual(rows.map((row) => (account.sneaking.ninjaMastery >= row.index + 1 ? 1 : 0)));
  });

  it('each ninja shows its floor and sneaking level', () => {
    const d = getDescriptor('ninja');
    expect(d.scope).toBe('character');
    for (const character of characters) {
      const c = { ...ctx, character };
      const [row] = d.list(c);
      expect(value('ninja', 'floor', row, c)).toBe(account.sneaking.players[character.playerId].floor + 1);
      expect(value('ninja', 'level', row, c)).toBe(character.skillsInfo.sneaking.level);
    }
  });

  it('beanstalk foods climb the page breakpoints', () => {
    const d = getDescriptor('beanstalk');
    expect(d.metrics.rank.tiers).toHaveLength(BEANSTALK_BREAKPOINTS.length + 1);
    const foods = getBeanstalkFoods(account.sneaking.beanstalkData);
    expect(foods.map(({ rawName }) => value('beanstalk', 'rank', byKey('beanstalk', rawName)))).toEqual(foods.map(({ rank }) => rank ?? 0));
  });

  it('every emperor showdown level unlocks one bonus level', () => {
    const total = rowsOf('emperorBonus').reduce((sum, row) => sum + value('emperorBonus', 'levels', row), 0);
    expect(total).toBe(account.emperor.highestEmperorShowdown);
  });

  it('summoning stones, plots, zenith market and advice fish read the page values', () => {
    const stones = account.summoning.summoningStones;
    expect(stones.map(({ index }) => value('summonStone', 'kills', byKey('summonStone', String(index))))).toEqual(stones.map(({ kills }) => kills));
    const plots = account.farming.plot;
    expect(plots.map(({ index }) => [value('farmPlot', 'rank', byKey('farmPlot', String(index))), value('farmPlot', 'og', byKey('farmPlot', String(index)))]))
      .toEqual(plots.map(({ rank, currentOG }) => [rank ?? 0, currentOG ?? 0]));
    const zenith = getDescriptor('zenithUpgrade');
    expect(account.zenith.market.map((_, i) => [value('zenithUpgrade', 'level', byKey('zenithUpgrade', String(i))), zenith.metrics.level.max(byKey('zenithUpgrade', String(i)))]))
      .toEqual(account.zenith.market.map(({ level, x3 }) => [level, x3 || null]));
    expect(account.adviceFish.upgrades.map((_, i) => value('adviceFish', 'level', byKey('adviceFish', String(i)))))
      .toEqual(account.adviceFish.upgrades.map(({ level }) => level));
  });

  it.each([
    ['/account/world-6/beanstalk', 'beanstalk'],
    ['/account/world-7/advice-fish', 'adviceFish'],
    ['/account/world-7/zenith-market', 'zenithUpgrade'],
    ['/account/class-specific/speedrun', 'speedrunTotals']
  ])('%s gets a goal button', (route, system) => {
    expect(hasGoals(route)).toBe(true);
    expect(descriptorsForRoute(route)[0].system).toBe(system);
  });

  it.each([
    ['/account/world-4/rift', 'Skill Mastery', 'skillMastery'],
    ['/account/world-4/rift', 'Construct Mastery', 'constructMastery'],
    ['/account/world-4/rift', 'Bonuses', 'riftBonus'],
    ['/account/world-5/divinity', 'Coral Kid Upgrades', 'coralKid'],
    ['/account/world-6/sneaking', 'Mastery', 'ninjaMastery'],
    ['/account/world-6/farming', 'Plot', 'farmPlot'],
    ['/account/world-6/summoning', 'Stones', 'summonStone']
  ])('%s tab %s opens %s', (route, t, system) => {
    expect(systemForTab(route, { t }, descriptorsForRoute(route))).toBe(system);
  });
});
