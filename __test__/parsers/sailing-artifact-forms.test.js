import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { gameTables } from '@website-data';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';

const { account } = parseFixture(latest);

describe('artifact form text', () => {
  // The game fills Deathskull's `$` with the line for its form; the lines come from gameTables.artifactFormText.
  it('Deathskull shows the line for its form', () => {
    const { artifact, forms } = gameTables.artifactFormText;
    const deathskull = account.sailing.artifacts[artifact];
    expect(deathskull.name).toBe('Deathskull');
    expect(deathskull.acquired).toBeGreaterThan(0);
    expect(deathskull.description).toContain(forms[Math.round(deathskull.acquired)]);
    expect(deathskull.description).not.toContain('$');
  });
});
