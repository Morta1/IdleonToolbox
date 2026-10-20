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
import { realCap } from '@utility/goals/caps';
import { findQuantityOwned, getAllItems } from '@parsers/items';
import { isMissingGreenstack } from '@parsers/misc';
import { greenstackGoal, GREENSTACK_AMOUNT } from '@utility/goals/registry/greenstack';
import { resolveGoal } from '@utility/goals/resolve';
import { createGoal } from '@utility/goals/store';
import { cleanUpgradeName } from '@utility/goals/registry/names';

const fixtures = { latest, highend, fresh };
const contexts = (d, parsed) => d.scope === 'character'
  ? parsed.characters.map((character) => ({ ...parsed, character }))
  : [parsed];

const kebab = (s) => s.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();
const pageRoutes = () => [
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

  it('route is a page in PAGES and in GOAL_ROUTES', () => {
    expect(pageRoutes()).toContain(d.route);
    expect(GOAL_ROUTES[system]).toBe(d.route);
    expect(hasGoals(d.route)).toBe(true);
    expect(descriptorsForRoute(d.route).map((x) => x.system)).toContain(system);
  });

  it('empty account lists without throwing', () => {
    for (const ctx of contexts(d, parseEmpty())) expect(() => d.list(ctx)).not.toThrow();
  });
});

it('system ids are unique and GOAL_ROUTES has exactly the registered systems', () => {
  const systems = DESCRIPTORS.map((d) => d.system);
  expect(new Set(systems).size).toBe(systems.length);
  expect(Object.keys(GOAL_ROUTES).sort()).toEqual([...systems].sort());
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

describe('item and greenstack goals', () => {
  const { account, characters } = parseFixture(latest);
  const ctx = { account, characters };
  const owned = getAllItems(characters, account);

  it('item quantity is the owned amount and routes to the material tracker', () => {
    const row = owned.find(({ amount, displayName }) => amount > 1 && displayName);
    const goal = createGoal({ system: 'item', key: row.rawName, metric: 'quantity', target: 1 });
    expect(resolveGoal(goal, ctx).value).toBe(findQuantityOwned(owned, row.displayName).amount);
    expect(GOAL_ROUTES.item).toBe('/tools/material-tracker');
    expect(GOAL_ROUTES.greenstack).toBe('/tools/material-tracker');
  });

  it('a watch item goal at zero owned resolves ok', () => {
    const row = getDescriptor('item').list(ctx).find((r) => r.displayName && !findQuantityOwned(owned, r.displayName).amount);
    const view = resolveGoal(createGoal({ system: 'item', key: row.rawName, metric: 'quantity', target: 1, watch: true }), ctx);
    expect(view.status).toBe('ok');
    expect(view.value).toBe(0);
  });

  it('the greenstack-everything goal matches the slab page and isMissingGreenstack', () => {
    const view = resolveGoal(greenstackGoal(), ctx);
    const slab = account.looty.slabItems;
    const stackedByOwning = slab.filter((i) => isMissingGreenstack(i) && findQuantityOwned(owned, i.name).amount >= GREENSTACK_AMOUNT).length;
    expect(view.total).toBe(account.looty.greenstackableCount);
    expect(view.met).toBe(account.looty.greenstackableStackedCount + stackedByOwning);
    expect(view.total - view.met).toBe(slab.filter(isMissingGreenstack).length - stackedByOwning);
  });

  it('a registered greenstack below 10M owned counts as met', () => {
    const row = getDescriptor('greenstack').list(ctx).find((r) => r.greenStacked && findQuantityOwned(owned, r.name).amount < GREENSTACK_AMOUNT);
    expect(row).toBeDefined();
    const view = resolveGoal(createGoal({ system: 'greenstack', key: row.itemRawName, metric: 'quantity', target: 'max' }), ctx);
    expect(view.status).toBe('reached');
  });
});
