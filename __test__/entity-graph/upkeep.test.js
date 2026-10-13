import path from 'path';
import { describe, expect, it } from 'vitest';
import { findUpkeep } from '../../scripts/entity-graph/upkeep.mjs';

describe('findUpkeep', () => {
  const found = findUpkeep(path.join(process.cwd(), 'scripts', 'entity-graph'));

  it('lists the marked hand-kept spots, file and line', () => {
    expect(found.map(({ file }) => file)).toEqual(expect.arrayContaining([
      'edges/beanstalk.mjs', 'edges/glimbo.mjs', 'nodes/catalogs-b.mjs'
    ]));
    expect(found.every(({ line, text }) => line > 0 && text.startsWith('UPKEEP:'))).toBe(true);
  });

  it('does not list itself', () => {
    expect(found.some(({ file }) => file === 'upkeep.mjs')).toBe(false);
  });
});
