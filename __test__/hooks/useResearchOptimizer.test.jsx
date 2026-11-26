// @vitest-environment jsdom
import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useResearchOptimizer } from '@hooks/useResearchOptimizer';

// One square shape (+50%) and one levelled node, Pts Every Ten (50), that adds to Research EXP: the best single move
// puts the square on it. With no worker in jsdom the hook runs inline, the fallback a failed worker takes.
const input = {
  shapesOwned: 1,
  canRotate: false,
  placements: [{ shape: 0, x: 10, y: 20, rot: 0 }],
  owners: Array(240).fill(-1),
  selectable: Array(240).fill(true),
  levels: Array.from({ length: 240 }, (_, node) => (node === 50 ? 1 : 0)),
  nodeValue: Array.from({ length: 240 }, (_, node) => (node === 50 ? 5 : 0)),
  shapeCatalog: { polygons: ['1,1;31,1;31,31;1,31'], dims: ['33,33'], bonusPcts: ['50'] },
  totalOccurrencesFound: 1,
  expAdditive: 105,
  expGrid70: 0,
  expMulti: 2.05,
  observationsFound: 1,
  insightLevels: [0],
  insightExp: [0],
  lensSlots: [{ observation: 0, type: 0 }],
  lensCap: 1,
  kaleiOther: 30,
  monocleRate: 3,
  afkRatePct: 100
};

describe('useResearchOptimizer', () => {
  it('runs a shape search to the end and cancels back to idle', () => {
    const { result } = renderHook(() => useResearchOptimizer());
    act(() => result.current.run('shapes', input, { maxMoves: 1 }));
    expect(result.current.status).toBe('done');
    const [plan] = result.current.result.plans;
    expect(plan.steps[0].holds).toEqual([50]);
    expect(plan.ratio).toBeCloseTo(1 + 2.5 / 205, 12);
    act(() => result.current.cancel());
    expect(result.current.status).toBe('idle');
  });

  it('reuses a finished result for the same input and options, and reruns when either changes', () => {
    const first = renderHook(() => useResearchOptimizer());
    act(() => first.result.current.run('lenses', input, { goal: 'researchExp' }));
    const cached = first.result.current.result;
    // Another component (the Observations hint) leaving defaults out gets the same entry
    const second = renderHook(() => useResearchOptimizer());
    act(() => second.result.current.run('lenses', input, { goal: 'researchExp', realHours: 0, keepMonocles: false }));
    expect(second.result.current.result).toBe(cached);
    act(() => second.result.current.run('lenses', input, { goal: 'insight' }));
    expect(second.result.current.result).not.toBe(cached);
    act(() => second.result.current.run('lenses', { ...input, expMulti: 3 }, { goal: 'researchExp' }));
    expect(second.result.current.result).not.toBe(cached);
  });
});
