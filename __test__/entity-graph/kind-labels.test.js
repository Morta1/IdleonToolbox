import { describe, expect, it } from 'vitest';
import { KIND_LABELS, KIND_PLURALS } from '@utility/wiki/kind-labels.mjs';
import * as panel from '@components/wiki/EntityPanel';

describe('kind labels module', () => {
  it('labels every kind the graph emits', () => {
    for (const kind of ['item', 'monster', 'npc', 'quest', 'talent', 'chip', 'jade', 'map', 'spice', 'station']) {
      expect(typeof KIND_LABELS[kind]).toBe('string');
      expect(typeof KIND_PLURALS[kind]).toBe('string');
    }
    expect(KIND_LABELS.chip).toBe('Lab Chip');
    expect(KIND_PLURALS.npc).toBe('NPCs');
  });

  it('EntityPanel re-exports the same objects', () => {
    expect(panel.KIND_LABELS).toBe(KIND_LABELS);
    expect(panel.KIND_PLURALS).toBe(KIND_PLURALS);
  });
});
