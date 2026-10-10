import '../../polyfills';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { arcadeShop } from '@website-data';
import { getArcadeBonus } from '@parsers/world-2/arcade';

const ROOTS = ['parsers', 'components', 'pages', 'utility', 'services'];

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(entry)) out.push(full);
  }
  return out;
};

describe('getArcadeBonus', () => {
  it('matches the whole effect name, so Drop_Rate is not Marble Drop Rate', () => {
    expect(getArcadeBonus(arcadeShop, 'Drop_Rate')).toBe(arcadeShop[27]);
    expect(getArcadeBonus(arcadeShop, 'Marble_Drop_Rate')).toBe(arcadeShop[71]);
    expect(getArcadeBonus(arcadeShop, 'Rate')).toBeUndefined();
  });

  it('reads by index for names the shop repeats', () => {
    expect(getArcadeBonus(arcadeShop, 11)).toBe(arcadeShop[11]);
  });

  // A name that matches nothing returns undefined and the bonus silently reads 0, which is how
  // 'Money_from_Monsters' dropped both Cash from Mobs upgrades out of the cash multiplier.
  it('resolves every name the code passes to exactly one upgrade', () => {
    const names = ROOTS.flatMap((root) => walk(path.join(process.cwd(), root)))
      .flatMap((file) => [...readFileSync(file, 'utf8').matchAll(/getArcadeBonus\([^,]+,\s*'([^']+)'/g)].map((match) => match[1]));
    expect(names.length).toBeGreaterThan(40);
    const unresolved = [...new Set(names)].filter((name) =>
      arcadeShop.filter(({ effect }) => getArcadeBonus([{ effect }], name)).length !== 1);
    expect(unresolved).toEqual([]);
  });
});
