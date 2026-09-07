import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { beforeAll, describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import { getWorld6Alerts } from '@utility/dashboard/account';
import { migrateConfig } from '@utility/migrations';
import latest from '../fixtures/latest.json';

const fields = { farming: { checked: true } };
const withHours = (value) => ({
  farming: { finishedPlots: { name: 'finishedPlots', checked: true, props: { value } } }
});

let account;
let characters;

beforeAll(() => {
  const { data, charNames, companion, guildData, serverVars } = latest;
  const parsed = parseData(data, charNames, companion, guildData, serverVars);
  account = parsed.account;
  characters = parsed.characters;
});

const HOUR = 3600;
const withPlots = (plots) => ({ ...account, farming: { ...account.farming, plot: plots } });
const plot = (overrides) => ({ index: 0, seedType: 0, isLocked: 0, nextOGEta: null, ...overrides });

describe('farming finishedPlots alert', () => {
  it('flags a plot whose wait has passed the threshold', () => {
    const alerts = getWorld6Alerts(withPlots([plot({ nextOGEta: 14 * HOUR })]), fields, withHours(12), characters);
    expect(alerts?.farming?.finishedPlots?.plots).toHaveLength(1);
    expect(alerts?.farming?.finishedPlots?.hours).toBe(12);
  });

  // The reported bug: locking a plot only freezes its crop type, so it still grows, still rolls
  // for OGs and still stalls. It was being filtered out and never flagged at any threshold.
  it('flags a stalled plot that is locked', () => {
    const alerts = getWorld6Alerts(withPlots([plot({ isLocked: 1, nextOGEta: 14 * HOUR })]), fields, withHours(12), characters);
    expect(alerts?.farming?.finishedPlots?.plots).toHaveLength(1);
  });

  it('leaves a plot that doubles inside the threshold alone', () => {
    const alerts = getWorld6Alerts(withPlots([plot({ nextOGEta: 11 * HOUR })]), fields, withHours(12), characters);
    expect(alerts?.farming?.finishedPlots).toBeUndefined();
  });

  // A null eta is a plot that isn't rolling for OGs yet, not one that has stopped.
  it('leaves a plot with no eta alone', () => {
    const alerts = getWorld6Alerts(withPlots([plot({ nextOGEta: null })]), fields, withHours(1), characters);
    expect(alerts?.farming?.finishedPlots).toBeUndefined();
  });

  // The settings input stores whatever was typed, so the threshold arrives as a string.
  it('reads a threshold typed into the input as a string', () => {
    const plots = [plot({ nextOGEta: 30 * HOUR })];
    expect(getWorld6Alerts(withPlots(plots), fields, withHours('24'), characters)?.farming?.finishedPlots?.plots)
      .toHaveLength(1);
    expect(getWorld6Alerts(withPlots(plots), fields, withHours('36'), characters)?.farming?.finishedPlots)
      .toBeUndefined();
  });
});

const daysConfig = (value) => ({
  version: 74,
  account: {
    'World 6': {
      farming: {
        checked: true,
        options: [{
          name: 'finishedPlots',
          type: 'input',
          checked: true,
          props: { label: 'Days', value, minValue: 1, maxValue: 365 }
        }]
      }
    }
  }
});
const finishedPlotsProps = (config) => config.account['World 6'].farming.options[0].props;

describe('finishedPlots days to hours migration', () => {
  it('carries a stored threshold over as the same span in hours', () => {
    const migrated = migrateConfig({ version: 75 }, daysConfig(7));
    expect(finishedPlotsProps(migrated)).toMatchObject({
      label: 'Hours',
      value: 168,
      minValue: 1,
      maxValue: 8760
    });
  });

  it('carries over a decimal typed under the old day minimum', () => {
    expect(finishedPlotsProps(migrateConfig({ version: 75 }, daysConfig('0.5'))).value).toBe(12);
  });

  it('falls back to the old default rather than migrating a blank to zero', () => {
    expect(finishedPlotsProps(migrateConfig({ version: 75 }, daysConfig(''))).value).toBe(168);
  });

  it('leaves an already migrated config alone', () => {
    const once = migrateConfig({ version: 75 }, daysConfig(7));
    const twice = migrateConfig({ version: 75 }, { ...once, version: 74 });
    expect(finishedPlotsProps(twice).value).toBe(168);
  });
});
