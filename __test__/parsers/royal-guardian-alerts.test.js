import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import { getWorld7Alerts } from '@utility/dashboard/account';
import { migrateConfig } from '@utility/migrations';
import raw from '../../data/raw.json';

// Shaped like what useAlerts hands the world alert builders: the tracker's fields and its options.
const FIELDS = { royalGuardian: { checked: true } };
const OPTION_NAMES = [
  'idleOutposts',
  'unwiredOutposts',
  'idleSupportCamps',
  'unspentPts',
  'claimableMaps',
  'idleUnits',
  'restockLocked'
];
const OPTIONS = {
  royalGuardian: Object.fromEntries(OPTION_NAMES.map((name) => [name, {
    checked: true,
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
    expect(migrated.account['World 7'].royalGuardian.options.map(({ name }) => name)).toEqual(OPTION_NAMES);
    expect(migrated.timers['World 7'].royalNodeCap.checked).toBe(true);
    // Inserted ahead of gallery so the group order matches baseTrackers.
    expect(Object.keys(migrated.account['World 7'])).toEqual(['royalGuardian', 'gallery']);
  });
});
