import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getOptions, getWorld4Alerts, getWorld6Alerts } from '../../utility/dashboard/account';

const run = (fn, account, section) => fn(account, section, getOptions(section), []);

describe('label review fixes', () => {
  it('a full ribbon shelf (0 empty slots) alerts at the default threshold 0', () => {
    const section = { cooking: { checked: true, options: [{ name: 'ribbons', checked: true, props: { value: 0 } }] } };
    const full = { finishedWorlds: { World3: true }, grimoire: { ribbons: Array(28).fill(1) }, breeding: { pets: [] } };
    const oneEmpty = { ...full, grimoire: { ribbons: [0, ...Array(27).fill(1)] } };
    const noShelf = { ...full, grimoire: {} };
    expect(run(getWorld4Alerts, full, section)?.cooking?.ribbons).toBe(0);
    expect(run(getWorld4Alerts, oneEmpty, section)?.cooking?.ribbons).toBeUndefined();
    expect(run(getWorld4Alerts, noShelf, section)?.cooking?.ribbons).toBeUndefined();
  });

  it('Sneaking last looted follows its checkbox', () => {
    const section = (checked) => ({ sneaking: { checked: true, options: [{ name: 'lastLooted', checked, props: { value: 10 } }] } });
    const account = { finishedWorlds: { World5: true }, sneaking: { lastLooted: 3600 } };
    expect(run(getWorld6Alerts, account, section(true))?.sneaking?.lastLooted).toBe(true);
    expect(run(getWorld6Alerts, account, section(false))?.sneaking?.lastLooted).toBeUndefined();
  });
});
