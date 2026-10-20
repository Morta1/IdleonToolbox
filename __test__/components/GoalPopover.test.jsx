// @vitest-environment jsdom
import '../../polyfills';
import React, { useEffect } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { AppContext } from '@components/common/context/AppProvider';
import { GoalsProvider, useGoals } from '@components/goals/GoalsProvider';
import GoalPopover from '@components/goals/GoalPopover';
import { getDescriptor } from '@utility/goals/registry';
import { createGoal, GOALS_STORAGE_KEY, MAX_GOALS } from '@utility/goals/store';
import { resolveGoal } from '@utility/goals/resolve';
import { getBubbleLevelForPercent } from '@parsers/world-2/alchemy';
import { numberWithCommas } from '@utility/helpers';

const { account, characters } = parseFixture(latest);
const ctx = { account, characters };
const ACCOUNT_KEY = 'uid-test';
const bubble = getDescriptor('bubble');
const grimoire = getDescriptor('grimoire');
const stamp = getDescriptor('stamp');

let api;
const Probe = () => {
  const value = useGoals();
  useEffect(() => {
    api = value;
  });
  return null;
};

const mount = (props) => render(
  <ThemeProvider theme={darkTheme}>
    <AppContext.Provider value={{ state: { uid: ACCOUNT_KEY, characters, account } }}>
      <GoalsProvider>
        <Probe/>
        <GoalPopover anchorEl={document.body} open onClose={() => {}} source="entry" {...props}/>
      </GoalsProvider>
    </AppContext.Provider>
  </ThemeProvider>
);

const button = (name) => screen.queryByRole('button', { name });
const setTarget = (value) => fireEvent.change(screen.getByLabelText(/^Target/), { target: { value: String(value) } });
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }));

// A bubble whose effect has a percent below 90, so the 90% step is a real level above it
const bubbleRow = bubble.list(ctx).find((row) => {
  const pct = bubble.metrics.level.percentOfMax(row, ctx);
  return row.level > 0 && pct > 0 && pct < 90;
});
const grimoireRows = grimoire.list(ctx);
const cappedGrimoire = grimoireRows.find((row) => grimoire.metrics.level.max(row, ctx) != null);
const uncappedGrimoire = grimoireRows.find((row) => grimoire.metrics.level.max(row, ctx) == null);

describe('GoalPopover', () => {
  beforeEach(() => localStorage.clear());

  it('bubble one-entry shows Level and % of max chips and the 90% quick step', () => {
    mount({ systems: [bubble], initial: { system: 'bubble', key: bubble.key(bubbleRow) } });
    expect(screen.getByText('Add goal')).toBeTruthy();
    expect(button('Level')).toBeTruthy();
    expect(button('% of max')).toBeTruthy();
    const level = getBubbleLevelForPercent(account, bubbleRow, 90);
    const step = button(`90% = Lv ${numberWithCommas(level)}`);
    expect(step).toBeTruthy();
    expect(screen.getByText(new RegExp(`^Now Lv ${numberWithCommas(bubbleRow.level)} · \\d+% of max$`))).toBeTruthy();
    fireEvent.click(step);
    save();
    expect(api.goals).toHaveLength(1);
    expect(api.goals[0]).toMatchObject({
      kind: 'entry', system: 'bubble', key: bubble.key(bubbleRow), metric: 'level', unit: 'value', op: '>=', target: level
    });
  });

  it('grimoire shows no group option, no metric chips, and a Max chip only for capped upgrades', () => {
    const capped = mount({ systems: [grimoire], initial: { system: 'grimoire', key: grimoire.key(cappedGrimoire) } });
    expect(button(/^By /)).toBeNull();
    expect(button('Level')).toBeNull();
    expect(button('% of max')).toBeNull();
    const max = grimoire.metrics.level.max(cappedGrimoire, ctx);
    expect(button(`Max (${numberWithCommas(max)})`)).toBeTruthy();
    capped.unmount();

    mount({ systems: [grimoire], initial: { system: 'grimoire', key: grimoire.key(uncappedGrimoire) } });
    expect(button(/^Max/)).toBeNull();
    expect(button('+5')).toBeTruthy();
  });

  it('all bubbles at 90% previews met of total', () => {
    mount({ systems: [bubble], initial: { system: 'bubble' } });
    fireEvent.click(button('All bubbles'));
    fireEvent.click(button('% of max'));
    setTarget(90);
    expect(screen.getByText(/^\d+ of \d+ already there\./)).toBeTruthy();
    save();
    expect(api.goals[0]).toMatchObject({ kind: 'all', system: 'bubble', unit: 'percentOfMax', target: 90 });
    expect(api.goals[0].key).toBeUndefined();
  });

  it('header popover picks the entry through search', () => {
    mount({ systems: [grimoire], initial: {}, source: 'header' });
    const input = screen.getByLabelText('Upgrade');
    fireEvent.change(input, { target: { value: grimoire.name(cappedGrimoire) } });
    fireEvent.click(screen.getByRole('option', { name: grimoire.name(cappedGrimoire) }));
    setTarget(1);
    save();
    expect(api.goals[0]).toMatchObject({ kind: 'entry', system: 'grimoire', key: grimoire.key(cappedGrimoire), target: 1 });
  });

  it('blocks a target above an absolute max', () => {
    mount({ systems: [grimoire], initial: { system: 'grimoire', key: grimoire.key(cappedGrimoire) } });
    const max = grimoire.metrics.level.max(cappedGrimoire, ctx);
    setTarget(max + 1);
    save();
    expect(screen.getByText(`Target is above the max (${numberWithCommas(max)})`)).toBeTruthy();
    expect(api.goals).toEqual([]);
  });

  it('blocks percent 100', () => {
    mount({ systems: [bubble], initial: { system: 'bubble', key: bubble.key(bubbleRow) } });
    fireEvent.click(button('% of max'));
    setTarget(100);
    save();
    expect(screen.getByText('Percent must be below 100')).toBeTruthy();
    expect(api.goals).toEqual([]);
  });

  it('asks for a target before saving', () => {
    mount({ systems: [bubble], initial: { system: 'bubble', key: bubble.key(bubbleRow) } });
    save();
    expect(screen.getByText('Enter a target')).toBeTruthy();
    expect(api.goals).toEqual([]);
  });

  it('editing an existing goal keeps one goal', () => {
    const key = bubble.key(bubbleRow);
    const existing = createGoal({ system: 'bubble', key, metric: 'level', target: bubbleRow.level + 10 });
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify({ schema: 1, accounts: { [ACCOUNT_KEY]: [existing] } }));
    mount({ systems: [bubble], initial: { system: 'bubble', key, goal: existing } });
    expect(screen.getByText('Edit goal')).toBeTruthy();
    setTarget(bubbleRow.level + 20);
    save();
    expect(api.goals).toHaveLength(1);
    expect(api.goals[0]).toMatchObject({ id: existing.id, createdAt: existing.createdAt, target: bubbleRow.level + 20 });
    fireEvent.click(button('Remove'));
    expect(api.goals).toEqual([]);
  });

  it('save at the cap shows the cap message', () => {
    const full = Array.from({ length: MAX_GOALS }, (_, i) => createGoal({ system: 'stamp', key: `k${i}`, metric: 'level', target: 1 }));
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify({ schema: 1, accounts: { [ACCOUNT_KEY]: full } }));
    mount({ systems: [bubble], initial: { system: 'bubble', key: bubble.key(bubbleRow) } });
    setTarget(bubbleRow.level + 1);
    save();
    expect(screen.getByText(`You have ${MAX_GOALS} goals. Remove some first.`)).toBeTruthy();
    expect(api.goals).toHaveLength(MAX_GOALS);
  });

  describe('character goals', () => {
    const talent = getDescriptor('talent');
    const [charA, charB] = characters;
    // Named, levelled and below its cap, so +1 is a valid target
    const openRow = (character) => talent.list({ ...ctx, character }).find((row) => {
      const max = talent.metrics.level.max(row);
      return row.name && row.baseLevel > 0 && (max == null || row.baseLevel < max);
    });
    const rowA = openRow(charA);
    const pickEntry = (row) => {
      fireEvent.change(screen.getByLabelText('Talent'), { target: { value: talent.name(row) } });
      fireEvent.click(screen.getByRole('option', { name: talent.name(row) }));
    };

    it('without a character the picker chooses whose talents are listed and scoped', () => {
      mount({ systems: [talent], initial: {}, source: 'header' });
      const picker = screen.getByLabelText('Character');
      fireEvent.mouseDown(picker);
      fireEvent.click(screen.getByRole('option', { name: charB.name }));
      const rowB = openRow(charB);
      pickEntry(rowB);
      setTarget(rowB.baseLevel + 1);
      save();
      expect(api.goals[0]).toMatchObject({ system: 'talent', key: talent.key(rowB), scope: { char: charB.name } });
    });

    it('with a character scope there is no picker and the goal resolves against that character only', () => {
      mount({ systems: [talent], initial: { system: 'talent', scope: { char: charA.name } } });
      expect(screen.queryByLabelText('Character')).toBeNull();
      pickEntry(rowA);
      setTarget(rowA.baseLevel + 1);
      save();
      const [goal] = api.goals;
      expect(goal).toMatchObject({ system: 'talent', key: talent.key(rowA), scope: { char: charA.name } });
      expect(resolveGoal(goal, ctx)).toMatchObject({ status: 'ok', value: rowA.baseLevel });
      expect(resolveGoal(goal, { account, characters: characters.filter(({ name }) => name !== charA.name) }).status)
        .toBe('missing');
    });
  });

  it('several systems show the system select first', () => {
    mount({ systems: [bubble, stamp], initial: {} });
    const system = screen.getByLabelText('System');
    const appliesTo = button('All bubbles');
    expect(system.compareDocumentPosition(appliesTo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.mouseDown(system);
    fireEvent.click(screen.getByRole('option', { name: 'Stamps' }));
    expect(button('All stamps')).toBeTruthy();
    expect(button('By category')).toBeTruthy();
  });
});
