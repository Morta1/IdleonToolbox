import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes } from '../../scripts/entity-graph/registry/build.mjs';
import world2 from '../../scripts/entity-graph/registry/world-2/index.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, world2);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);

describe('weekly bosses', () => {
  it('build one page per boss', () => {
    expect(ofKind('weeklyboss').map((node) => node.rawName).sort())
      .toEqual(data.weeklyBosses.map((boss) => boss.bossName).sort());
  });

  // Oracle: weeklyBosses.ts / N.js BossHPmax = x4 * x5^bars, five bars.
  it('list the five health bars', () => {
    const boss = data.weeklyBosses[0];
    const bars = [0, 1, 2, 3, 4].map((n) => (boss.x4 * Math.pow(boss.x5, n)).toLocaleString('en-US', { maximumFractionDigits: 2 }));
    expect(nodes[`weeklyboss:${boss.bossName}`].fields[0]).toEqual({ label: 'Health bars', value: bars.join(' / ') });
  });

  it('name the three tasks a turn can draw', () => {
    const boss = data.weeklyBosses[0];
    const node = nodes[`weeklyboss:${boss.bossName}`];
    expect(node.fields.slice(1).map((field) => field.label)).toEqual(['Task 1', 'Task 2', 'Task 3']);
    expect(node.fields.slice(1).every((field) => !/[{}_]/.test(field.value))).toBe(true);
  });
});
