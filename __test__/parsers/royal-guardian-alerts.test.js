import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import { getWorld7Alerts } from '@utility/dashboard/account';
import { migrateConfig } from '@utility/migrations';
import raw from '../../data/raw.json';

// Shaped like what useAlerts hands the world alert builders: the tracker's fields and its options.
const FIELDS = { royalGuardian: { checked: true } };
// The seven the group shipped with in v70 - migration 73 adds the three unit-composition alerts
// after them, so the v69 -> v70 test below still has to compare against this list alone.
const V70_OPTION_NAMES = [
  'idleOutposts',
  'unwiredOutposts',
  'idleSupportCamps',
  'unspentPts',
  'claimableMaps',
  'idleUnits',
  'restockLocked'
];
// v73 shipped the three unit alerts; v74 adds the daily-reset modifier under the first of them.
const V73_OPTION_NAMES = [
  ...V70_OPTION_NAMES.slice(0, -1),
  'overkillWorkers',
  'strandedWorkers',
  'sharedNodes',
  'restockLocked'
];
const OPTION_NAMES = [
  ...V70_OPTION_NAMES.slice(0, -1),
  'overkillWorkers',
  'overkillBeforeReset',
  'strandedWorkers',
  'sharedNodes',
  'restockLocked'
];
const OPTIONS = {
  royalGuardian: Object.fromEntries(OPTION_NAMES.map((name) => [name, {
    // overkillBeforeReset stays off here so the horizon is the fixed 10 these tests assert on.
    checked: name !== 'overkillBeforeReset',
    props: { value: 10 }
  }]))
};

const parse = () => parseData(raw.data, raw.charNames, raw.companion, raw.guildData, raw.serverVars,
  raw.accountCreateTime);

describe('royal guardian dashboard alerts', () => {
  it('only reports outposts a rewire would actually help', () => {
    const { account, characters } = parse();
    const alerts = getWorld7Alerts(account, FIELDS, OPTIONS, characters)?.royalGuardian;

    // An outpost whose resource is empty is only worth flagging while its reach still holds one
    // with something left; the rest have to wait for the daily restock either way.
    const spent = account.royalGuardian.outposts.filter(({ mode, connectedNodes }) => mode !== 1
      && connectedNodes.length > 0 && connectedNodes.every(({ exhausted }) => exhausted));
    expect(spent.length).toBeGreaterThan(alerts.idleOutposts.length);
    expect(alerts.idleOutposts.length).toBe(spent.filter(({ freshNodeInReach }) => freshNodeInReach).length);

    // Support camps collect nothing by design, so they never appear in a collection alert.
    const supportNames = new Set(account.royalGuardian.outposts
      .filter(({ mode }) => mode === 1)
      .map(({ name }) => name));
    [...alerts.idleOutposts, ...(alerts.unwiredOutposts ?? [])]
      .forEach(({ name }) => expect(supportNames.has(name)).toBe(false));
  });

  it('counts unspent PTS per outpost and claimable maps off the kill requirement', () => {
    const { account, characters } = parse();
    const alerts = getWorld7Alerts(account, FIELDS, OPTIONS, characters)?.royalGuardian;

    // PTS are spent per outpost, so the alert counts the outposts that can each afford something,
    // never the account-wide total.
    const affordable = account.royalGuardian.outposts.filter(({ ptsLeft }) => ptsLeft >= 10);
    const total = account.royalGuardian.outposts.reduce((sum, { ptsLeft }) => sum + Math.max(0, ptsLeft), 0);
    expect(alerts.unspentPts.count).toBe(affordable.length);
    expect(alerts.unspentPts.count).toBeLessThan(total);
    expect(alerts.unspentPts.threshold).toBe(10);
    expect(alerts.unspentPts.outposts.map(({ name }) => name)).toEqual(affordable.map(({ name }) => name));
    alerts.unspentPts.outposts.forEach(({ ptsLeft }) => expect(ptsLeft).toBeGreaterThanOrEqual(10));

    const claimable = account.royalGuardian.clearingMaps.filter(({ progress }) => progress >= 1);
    expect(alerts.claimableMaps.length).toBe(claimable.length);
  });

  it('names the world and native monster of every listed map', () => {
    const { account, characters } = parse();
    const alerts = getWorld7Alerts(account, FIELDS, OPTIONS, characters)?.royalGuardian;
    const listed = [
      ...(alerts.idleOutposts ?? []),
      ...(alerts.unwiredOutposts ?? []),
      ...(alerts.idleSupportCamps ?? []),
      ...(alerts.unspentPts?.outposts ?? []),
      ...(alerts.claimableMaps ?? []),
      ...(alerts.strandedWorkers?.outposts ?? [])
    ];
    expect(listed.length).toBeGreaterThan(0);

    listed.forEach(({ mapIndex, world, monsterName }) => {
      expect(world).toBe(1 + Math.floor(mapIndex / 50));
      // Only the few outpost slots with nothing to idle on (towns, Grand Owl Perch) go nameless.
      if (monsterName !== null) expect(monsterName).not.toMatch(/[_]/);
    });
  });

  it('resolves both fighting monsters and resource nodes off the same lookup', () => {
    const { account } = parse();
    const byMap = new Map(account.royalGuardian.outposts
      .concat(account.royalGuardian.clearingMaps)
      .map((entry) => [entry.mapIndex, entry]));

    // A fighting map and a mining map are the two shapes the requester asked for; both come out of
    // mapEnemiesArray -> monsters, so one lookup has to cover "Green Mushroom" and "Plat" alike.
    expect(byMap.get(1)?.monsterName).toBe('Green Mushroom');
    expect(byMap.get(1)?.monsterRawName).toBe('mushG');
    expect(byMap.get(10)?.monsterName).toBe('Plat');

    // Outpost slots with no AFK target report null rather than the game's "_" placeholder.
    expect(byMap.get(42)?.monsterName ?? null).toBe(null);
  });

  it('flags units clearing a map that is already claimed', () => {
    const { account, characters } = parse();
    const alerts = getWorld7Alerts(account, FIELDS, OPTIONS, characters)?.royalGuardian;
    const wasted = account.royalGuardian.deployments
      .filter(({ idle, unassigned, hasClearableMap }) => (idle || unassigned) && hasClearableMap);

    expect(alerts.idleUnits.count).toBe(wasted.length);
    // With Peacetime Militia those units earn half rank EXP rather than nothing, and the alert says so.
    expect(alerts.idleUnits.discounted).toBe(account.royalGuardian.outpostStats.peacetimeMilitia);
  });

  it('only reports outposts that could be wired to something right now', () => {
    const { account, characters } = parse();
    const alerts = getWorld7Alerts(account, FIELDS, OPTIONS, characters)?.royalGuardian;

    // An outpost with nothing in reach cannot be connected at all, so it is not a mistake to fix.
    const unwired = account.royalGuardian.outposts
      .filter(({ mode, connectedNodes }) => mode !== 1 && connectedNodes.length === 0);
    expect(alerts.unwiredOutposts?.length ?? 0)
      .toBe(unwired.filter(({ reachableNodes }) => reachableNodes.length > 0).length);
    (alerts.unwiredOutposts ?? []).forEach(({ mapIndex }) => {
      const outpost = account.royalGuardian.outposts.find((entry) => entry.mapIndex === mapIndex);
      expect(outpost.reachableNodes.length).toBeGreaterThan(0);
    });
  });

  it('leaves units alone once their world has nothing left to clear', () => {
    const { account, characters } = parse();
    const deployments = account.royalGuardian.deployments
      .map((deployment) => ({ ...deployment, hasClearableMap: false }));
    const stuck = { ...account, royalGuardian: { ...account.royalGuardian, deployments } };

    expect(getWorld7Alerts(stuck, FIELDS, OPTIONS, characters)?.royalGuardian?.idleUnits).toBeUndefined();
  });

  it('reports nothing when the tracker or its options are off', () => {
    const { account, characters } = parse();
    const allOff = {
      royalGuardian: Object.fromEntries(OPTION_NAMES.map((name) => [name, { checked: false, props: { value: 10 } }]))
    };

    expect(getWorld7Alerts(account, FIELDS, allOff, characters)?.royalGuardian).toBeUndefined();
    expect(getWorld7Alerts(account, { royalGuardian: { checked: false } }, OPTIONS, characters)?.royalGuardian)
      .toBeUndefined();
  });

  it('migrates a v69 config into the new tracker group', () => {
    const stored = {
      version: 69,
      account: { 'World 7': { gallery: { checked: true, options: [] } } },
      characters: {},
      timers: { 'World 7': {} }
    };

    const migrated = migrateConfig({ version: 70 }, stored);

    expect(migrated.version).toBe(70);
    expect(migrated.account['World 7'].royalGuardian.options.map(({ name }) => name)).toEqual(V70_OPTION_NAMES);
    expect(migrated.timers['World 7'].royalNodeCap.checked).toBe(true);
    // Inserted ahead of gallery so the group order matches baseTrackers.
    expect(Object.keys(migrated.account['World 7'])).toEqual(['royalGuardian', 'gallery']);
  });

  it('adds the unit composition alerts ahead of restockLocked, and only once', () => {
    const stored = {
      version: 69,
      account: { 'World 7': { gallery: { checked: true, options: [] } } },
      characters: {},
      timers: { 'World 7': {} }
    };

    const migrated = migrateConfig({ version: 73 }, stored);

    expect(migrated.version).toBe(73);
    expect(migrated.account['World 7'].royalGuardian.options.map(({ name }) => name)).toEqual(V73_OPTION_NAMES);
    // Re-running it must not duplicate what it already inserted.
    const twice = migrateConfig({ version: 73 }, { ...migrated, version: 72 });
    expect(twice.account['World 7'].royalGuardian.options.map(({ name }) => name)).toEqual(V73_OPTION_NAMES);
  });

  it('flags Workers stranded on a spent outpost with nothing left to rewire to', () => {
    const { account, characters } = parse();
    const alerts = getWorld7Alerts(account, FIELDS, OPTIONS, characters)?.royalGuardian;
    const outpostBy = (name) => account.royalGuardian.outposts.find((outpost) => outpost.name === name);

    // The kingdom in this save is fully drained, which is exactly the stranded case.
    expect(alerts.strandedWorkers.count).toBeGreaterThan(0);
    expect(alerts.strandedWorkers.count).toBe(alerts.strandedWorkers.outposts.length);

    // Stranded is the case idleOutposts deliberately skips: nothing better is in range, so the
    // Workers are the thing to change rather than the connection.
    const idleNames = new Set((alerts.idleOutposts ?? []).map(({ name }) => name));
    alerts.strandedWorkers.outposts.forEach(({ name, workers }) => {
      const outpost = outpostBy(name);
      expect(workers).toBe(outpost.unitSlots.filter((unit) => unit === 0).length);
      expect(workers).toBeGreaterThan(0);
      expect(outpost.mode).not.toBe(1);
      expect(outpost.freshNodeInReach).toBe(false);
      expect(outpost.connectedNodes.every(({ exhausted }) => exhausted)).toBe(true);
      expect(idleNames.has(name)).toBe(false);
    });
  });

  // Every node in data/raw.json is already spent, so the two alerts that need a LIVE node are
  // driven off a hand-built kingdom instead, small enough that the counts are checkable on paper.
  const stubAccount = () => ({
    // getWorld7Alerts gates the whole world on World 6 being finished.
    finishedWorlds: { World6: true },
    royalGuardian: {
      unlocked: true,
      resources: [],
      clearingMaps: [],
      deployments: [],
      outpostStats: { workerRateBonus: 100, restockUnlocked: true, peacetimeMilitia: false },
      outposts: [
        {
          // 3 Workers draining 100/h into a node with 500 left, against a 10h horizon. Worker
          // bonus 100 puts the current rate at 1 + 3 = 4x; 500 / 10 = 50/h needs only 2x of that,
          // which one Worker already buys, so the other two could be Traders.
          name: 'Overkill', mapIndex: 2, world: 1, monsterRawName: 'mushG', monsterName: 'Green Mushroom',
          mode: 0, freshNodeInReach: false,
          unitSlots: [0, 0, 0, 1], unitCounts: [3, 1, 0, 0],
          rankBars: [{ expPerUnit: 10 }],
          connectedNodes: [{ index: 5, exhausted: false, drainRate: 100, collected: 0, maxQuantity: 500 }]
        },
        {
          // Same outpost against twice the node: 1000 / 10 = 100/h is the whole current rate, so
          // every Worker on it is load-bearing.
          name: 'Tight', mapIndex: 3, mode: 0, freshNodeInReach: false,
          unitSlots: [0, 0, 0, 1], unitCounts: [3, 1, 0, 0],
          rankBars: [{ expPerUnit: 10 }],
          connectedNodes: [{ index: 6, exhausted: false, drainRate: 100, collected: 0, maxQuantity: 1000 }]
        },
        {
          // Node 9 is wired to both of these. The fast one empties it alone well inside 10h...
          name: 'Fast', mapIndex: 4, mode: 0, freshNodeInReach: false,
          unitSlots: [1, 1], unitCounts: [0, 2, 0, 0],
          rankBars: [{ expPerUnit: 10 }],
          connectedNodes: [{ index: 9, exhausted: false, drainRate: 100, collected: 0, maxQuantity: 500 }]
        },
        {
          // ...so this one is spending a connection slot on a node it is not needed for.
          name: 'Slow', mapIndex: 5, world: 1, monsterRawName: 'frogG', monsterName: 'Frog',
          mode: 0, freshNodeInReach: false,
          unitSlots: [1, 1], unitCounts: [0, 2, 0, 0],
          rankBars: [{ expPerUnit: 10 }],
          connectedNodes: [{ index: 9, exhausted: false, drainRate: 5, collected: 0, maxQuantity: 500 }]
        },
        {
          // A Support Camp drains nothing, so no collection alert may ever name it.
          name: 'Camp', mapIndex: 6, mode: 1, freshNodeInReach: false,
          unitSlots: [0, 0], unitCounts: [2, 0, 0, 0], supportLinks: [2],
          rankBars: [{ expPerUnit: 10 }],
          connectedNodes: []
        }
      ]
    }
  });

  it('counts the Workers a live node no longer needs', () => {
    const alerts = getWorld7Alerts(stubAccount(), FIELDS, OPTIONS, [])?.royalGuardian;

    expect(alerts.overkillWorkers.horizon).toBe(10);
    expect(alerts.overkillWorkers.outposts).toEqual([
      {
        name: 'Overkill', mapIndex: 2, world: 1, monsterRawName: 'mushG', monsterName: 'Green Mushroom',
        workers: 2, expPerHour: 20
      }
    ]);
    expect(alerts.overkillWorkers.count).toBe(1);
  });

  it('flags the spare side of a shared node, keeping the outpost that empties it', () => {
    const alerts = getWorld7Alerts(stubAccount(), FIELDS, OPTIONS, [])?.royalGuardian;

    // Only the slower of the two, and only because the faster one finishes the node alone.
    expect(alerts.sharedNodes.outposts).toEqual([
      { name: 'Slow', mapIndex: 5, world: 1, monsterRawName: 'frogG', monsterName: 'Frog' }
    ]);
    expect(alerts.sharedNodes.count).toBe(1);
  });
  // A node needing only 200 more: the 10h window frees all 3 Workers, a 5h deadline only 2.
  const quickOutpost = () => ({
    name: 'Quick', mapIndex: 7, world: 1, monsterRawName: 'mushG', monsterName: 'Green Mushroom',
    mode: 0, freshNodeInReach: false,
    unitSlots: [0, 0, 0], unitCounts: [3, 0, 0, 0],
    rankBars: [{ expPerUnit: 10 }],
    connectedNodes: [{ index: 11, exhausted: false, drainRate: 100, collected: 0, maxQuantity: 200 }]
  });
  const resetOptions = () => ({
    royalGuardian: Object.fromEntries(OPTION_NAMES.map((name) => [name, { checked: true, props: { value: 10 } }]))
  });

  it('sizes the overkill horizon by the daily reset when asked to', () => {
    // game: "RestockRes" only refills and levels a node that is ALREADY spent at the reset, so the
    // reset is the real deadline - a rolling window frees Workers the node then misses the reset without.
    const account = stubAccount();
    account.timeAway = { GlobalTime: Date.now() / 1000, ShopRestock: 5 * 3600 };
    account.royalGuardian.outposts.push(quickOutpost());

    const alerts = getWorld7Alerts(account, FIELDS, resetOptions(), [])?.royalGuardian;

    expect(alerts.overkillWorkers.beforeReset).toBe(true);
    expect(alerts.overkillWorkers.horizon).toBeCloseTo(5, 2);
    // Quick still finishes inside 5h without one Worker, but not without two.
    expect(alerts.overkillWorkers.outposts.find(({ name }) => name === 'Quick').workers).toBe(2);
    // Overkill needs its whole current rate to spend 500 in 5h, so it drops out entirely.
    expect(alerts.overkillWorkers.outposts.find(({ name }) => name === 'Overkill')).toBeUndefined();
  });

  it('frees more Workers on the same kingdom when the horizon is the plain hour input', () => {
    // Same account, reset modifier off: the 10h window is looser, so both outposts qualify and
    // Quick gives up all three. This is the comparison that shows the option actually bites.
    const account = stubAccount();
    account.timeAway = { GlobalTime: Date.now() / 1000, ShopRestock: 5 * 3600 };
    account.royalGuardian.outposts.push(quickOutpost());
    const options = resetOptions();
    options.royalGuardian.overkillBeforeReset.checked = false;

    const alerts = getWorld7Alerts(account, FIELDS, options, [])?.royalGuardian;

    expect(alerts.overkillWorkers.beforeReset).toBe(false);
    expect(alerts.overkillWorkers.horizon).toBe(10);
    expect(alerts.overkillWorkers.outposts.find(({ name }) => name === 'Quick').workers).toBe(3);
    expect(alerts.overkillWorkers.outposts.find(({ name }) => name === 'Overkill').workers).toBe(2);
  });

  it('falls back to the fixed hours when the save is older than the reset it counted down to', () => {
    const account = stubAccount();
    // Saved 6h ago with 5h then left on the clock: that reset has already happened, so there is no
    // deadline left to read and the hour input has to take over.
    account.timeAway = { GlobalTime: Date.now() / 1000 - 6 * 3600, ShopRestock: 5 * 3600 };
    const alerts = getWorld7Alerts(account, FIELDS, resetOptions(), [])?.royalGuardian;

    expect(alerts.overkillWorkers.beforeReset).toBe(false);
    expect(alerts.overkillWorkers.horizon).toBe(10);
  });

  it('adds the daily reset option under the alert it modifies', () => {
    const stored = {
      version: 69,
      account: { 'World 7': { gallery: { checked: true, options: [] } } },
      characters: {},
      timers: { 'World 7': {} }
    };

    const migrated = migrateConfig({ version: 74 }, stored);

    expect(migrated.version).toBe(74);
    expect(migrated.account['World 7'].royalGuardian.options.map(({ name }) => name)).toEqual(OPTION_NAMES);
    // Re-running it must not duplicate what it already inserted.
    const twice = migrateConfig({ version: 74 }, { ...migrated, version: 73 });
    expect(twice.account['World 7'].royalGuardian.options.map(({ name }) => name)).toEqual(OPTION_NAMES);
  });
});