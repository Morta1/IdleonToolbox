import { describe, expect, it } from 'vitest';
import { KIND_LABELS, KIND_PLURALS } from '@utility/wiki/kind-labels.mjs';
import * as panel from '@components/wiki/EntityPanel';

describe('kind labels module', () => {
  it('EntityPanel re-exports the same objects', () => {
    expect(panel.KIND_LABELS).toBe(KIND_LABELS);
    expect(panel.KIND_PLURALS).toBe(KIND_PLURALS);
  });
});
