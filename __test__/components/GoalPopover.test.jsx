// @vitest-environment jsdom
import '../../polyfills';
import React, { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createFilterOptions, ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { AppContext } from '@components/common/context/AppProvider';
import { GoalsProvider, useGoals } from '@components/goals/GoalsProvider';
import GoalPopover from '@components/goals/GoalPopover';
import { getDescriptor, withDescriptors } from '@utility/goals/registry';
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
const item = getDescriptor('item');

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
    expect(screen.getByText(new RegExp(`^You have Lv ${numberWithCommas(bubbleRow.level)} · \\d+% of max$`))).toBeTruthy();
    fireEvent.click(step);
    save();
    expect(api.goals).toHaveLength(1);
    expect(api.goals[0]).toMatchObject({
      kind: 'entry', system: 'bubble', key: bubble.key(bubbleRow), metric: 'level', unit: 'value', op: '>=', target: level
    });
  });

  it.each([
    ['stamps lost their max', () => ({ system: 'stamp', key: stamp.key(stamp.list(ctx)[0]), systems: [stamp] })],
    ['this upgrade has no cap', () => ({ system: 'grimoire', key: grimoire.key(uncappedGrimoire), systems: [grimoire] })]
  ])('editing a stored Max target that no longer applies starts empty: %s', (_, entry) => {
    const { system, key, systems } = entry();
    const goal = createGoal({ system, key, metric: 'level', target: 'max' });
    mount({ systems, initial: { system, key, goal } });
    expect(screen.getByLabelText(/^Target/).value).toBe('');
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
    fireEvent.click(button('All'));
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

  it('item search shows at most 250 matches', () => {
    mount({ systems: [getDescriptor('item')], initial: {}, source: 'header' });
    fireEvent.change(screen.getByLabelText('Item'), { target: { value: 'a' } });
    expect(screen.getAllByRole('option').length).toBe(250);
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

  it('saves an optional note and prefills it when editing', () => {
    const key = grimoire.key(cappedGrimoire);
    const first = mount({ systems: [grimoire], initial: { system: 'grimoire', key } });
    setTarget(1);
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'After the next boss' } });
    save();
    expect(api.goals[0]).toMatchObject({ system: 'grimoire', key, note: 'After the next boss' });
    const [goal] = api.goals;
    first.unmount();

    mount({ systems: [grimoire], initial: { system: 'grimoire', key, goal } });
    expect(screen.getByLabelText('Note').value).toBe('After the next boss');
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: '' } });
    save();
    expect(api.goals).toHaveLength(1);
    expect(api.goals[0]).toMatchObject({ id: goal.id, note: '' });
  });

  it.each([
    ['left at 0 stays a watch goal', 0, true],
    ['given a target becomes a real goal', 5, false]
  ])('editing a watch item goal %s', (_, target, watch) => {
    const key = item.key(item.list(ctx)[0]);
    const existing = createGoal({ system: 'item', key, metric: 'quantity', target: 0, watch: true });
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify({ schema: 1, accounts: { [ACCOUNT_KEY]: [existing] } }));
    mount({ systems: [item], initial: { system: 'item', key, goal: existing } });
    setTarget(target);
    save();
    expect(api.goals).toHaveLength(1);
    expect(api.goals[0]).toMatchObject({ id: existing.id, target });
    expect(!!api.goals[0].watch).toBe(watch);
  });

  it('blocks Max on every upgrade when no upgrade has a real max', () => {
    const uncapped = { ...grimoire, metrics: { level: { ...grimoire.metrics.level, max: () => null } } };
    withDescriptors([uncapped], () => {
      mount({ systems: [uncapped], initial: { system: 'grimoire' } });
      fireEvent.click(button('All'));
      fireEvent.click(button('Max'));
      save();
      expect(screen.getByText('No entries can reach this target')).toBeTruthy();
      expect(api.goals).toEqual([]);
    });
  });

  it('blocks % of max on a bubble without a percent', () => {
    const row = bubble.list(ctx).find((r) => bubble.metrics.level.percentOfMax(r, ctx) === null);
    mount({ systems: [bubble], initial: { system: 'bubble', key: bubble.key(row) } });
    fireEvent.click(button('% of max'));
    setTarget(50);
    save();
    expect(screen.getByText('No entries can reach this target')).toBeTruthy();
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
    const appliesTo = button('All');
    expect(system.compareDocumentPosition(appliesTo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.mouseDown(system);
    fireEvent.click(screen.getByRole('option', { name: /^Stamps/ }));
    expect(button('By category')).toBeTruthy();
  });

  it('the system select shows each system icon and entry count', () => {
    mount({ systems: [bubble, stamp], initial: {} });
    fireEvent.mouseDown(screen.getByLabelText('System'));
    const options = screen.getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual([
      `Bubbles${numberWithCommas(bubble.list(ctx).length)}`,
      `Stamps${numberWithCommas(stamp.list(ctx).length)}`
    ]);
    expect(options.map((o) => o.querySelector('img').getAttribute('src'))).toEqual([
      `/${bubble.icon(bubble.list(ctx)[0])}.png`,
      `/${stamp.icon(stamp.list(ctx)[0])}.png`
    ]);
  });

  it('lists the other systems only when the system select opens, and filters the entries only while their list is open', () => {
    const otherList = vi.fn(stamp.list);
    const itemName = vi.fn(item.name);
    const spiedStamp = { ...stamp, list: otherList };
    const spiedItem = { ...item, name: itemName };
    mount({ systems: [spiedItem, spiedStamp], initial: { system: 'item' }, source: 'header' });
    // A typed search whose list was closed keeps its text
    const search = screen.getByLabelText('Item');
    search.focus();
    fireEvent.change(search, { target: { value: 'a' } });
    fireEvent.keyDown(search, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(search.value).toBe('a');
    otherList.mockClear();
    itemName.mockClear();
    setTarget(5);
    setTarget(50);
    expect(otherList).not.toHaveBeenCalled();
    expect(itemName).not.toHaveBeenCalled();
    fireEvent.mouseDown(screen.getByLabelText('System'));
    expect(otherList).toHaveBeenCalled();
  });

  describe('direction', () => {
    const pickDirection = (name) => {
      fireEvent.mouseDown(screen.getByLabelText('Direction'));
      fireEvent.click(screen.getByRole('option', { name }));
    };

    it('reads as a sentence: no Direction label, Reach at least by default, Stay at or below saves <=', () => {
      mount({ systems: [grimoire], initial: { system: 'grimoire', key: grimoire.key(uncappedGrimoire) } });
      expect(screen.queryByText('Direction')).toBeNull();
      expect(screen.getByLabelText('Direction').textContent).toBe('Reach at least');
      expect(button('+5')).toBeTruthy();
      fireEvent.mouseDown(screen.getByLabelText('Direction'));
      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Reach at least', 'Stay at or below']);
      fireEvent.click(screen.getByRole('option', { name: 'Stay at or below' }));
      expect(button('+5')).toBeNull();
      setTarget(3);
      save();
      expect(api.goals[0]).toMatchObject({ op: '<=', target: 3 });
    });

    it('switching to Stay at or below clears a Max target', () => {
      mount({ systems: [grimoire], initial: { system: 'grimoire', key: grimoire.key(cappedGrimoire) } });
      fireEvent.click(button(/^Max/));
      expect(screen.getByLabelText(/^Target/).value).toBe('Max');
      pickDirection('Stay at or below');
      expect(screen.getByLabelText(/^Target/).value).toBe('');
    });

    it('editing an at most goal reads Stay at or below', () => {
      const key = grimoire.key(uncappedGrimoire);
      const existing = createGoal({ system: 'grimoire', key, metric: 'level', op: '<=', target: 3 });
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify({ schema: 1, accounts: { [ACCOUNT_KEY]: [existing] } }));
      mount({ systems: [grimoire], initial: { goal: existing } });
      expect(screen.getByLabelText('Direction').textContent).toBe('Stay at or below');
    });
  });

  it.each([
    ['a level', () => bubble, (row) => `You have Lv ${numberWithCommas(row.level)}`, 'Target level'],
    ['kills', () => getDescriptor('killroyKills'), (row) => `You have ${numberWithCommas(Number(row.killRoyKills) || 0)} kills`, 'Target kills']
  ])('the target row of %s says what you have and names the unit in the field', (_, descriptorOf, have, placeholder) => {
    const d = descriptorOf();
    const row = d.list(ctx).find((r) => d.metrics[Object.keys(d.metrics)[0]].value(r, ctx) > 0);
    mount({ systems: [d], initial: { system: d.system, key: d.key(row) } });
    expect(screen.getByText(new RegExp(`^${have(row)}( |$)`))).toBeTruthy();
    expect(screen.queryByText(/^Now /)).toBeNull();
    const field = screen.getByLabelText(/^Target/);
    expect([field.getAttribute('placeholder'), field.getAttribute('aria-label')]).toEqual([placeholder, placeholder]);
  });

  it('a tier goal says which tier you have', () => {
    const artifact = getDescriptor('artifact');
    const row = artifact.list(ctx).find((r) => artifact.metrics.tier.value(r, ctx) > 0);
    mount({ systems: [artifact], initial: { system: 'artifact', key: artifact.key(row) } });
    expect(screen.getByText(`You have ${artifact.metrics.tier.tiers[artifact.metrics.tier.value(row, ctx)]}`)).toBeTruthy();
  });

  it.each([
    ['one', 'One', 'One stamp you pick from the list.'],
    ['all', 'All', 'Every entry in Stamps: reached when all of them meet the target.'],
    ['group', 'By category', 'Every entry in Stamps in the category you pick: reached when all of them meet the target.']
  ])('applies to %s has a short label and one helper sentence', (_, label, helper) => {
    mount({ systems: [stamp], initial: { system: 'stamp' } });
    expect(['One', 'All', 'By category'].map((name) => !!button(name))).toEqual([true, true, true]);
    fireEvent.click(button(label));
    expect(screen.getByText(helper)).toBeTruthy();
  });

  it('slab offers All and By category only, starts on All and saves an all goal', () => {
    const slab = getDescriptor('slab');
    mount({ systems: [slab], initial: { system: 'slab' } });
    expect(['One', 'All', 'By category'].map((name) => !!button(name))).toEqual([false, true, true]);
    expect(button('All').getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByLabelText('Slab item')).toBeNull();
    save();
    expect(api.goals.map(({ system, kind, metric }) => [system, kind, metric])).toEqual([['slab', 'all', 'obtained']]);
  });

  it('a page totals system has no All toggle and saves one total with its max', () => {
    const totals = getDescriptor('researchTotals');
    const row = totals.list(ctx).find((r) => totals.key(r) === 'observations');
    mount({ systems: [totals], initial: { system: 'researchTotals', key: 'observations' } });
    expect(['One', 'All'].map((name) => !!button(name))).toEqual([false, false]);
    expect(screen.getByText('One total you pick from the list.')).toBeTruthy();
    expect(button(`Max (${numberWithCommas(row.max)})`)).toBeTruthy();
    expect(screen.getByText(`You have ${numberWithCommas(row.value)} of ${numberWithCommas(row.max)}`)).toBeTruthy();
    setTarget(row.max);
    save();
    expect(api.goals.map(({ system, kind, key, metric, target }) => [system, kind, key, metric, target]))
      .toEqual([['researchTotals', 'entry', 'observations', 'value', row.max]]);
    expect(resolveGoal(api.goals[0], ctx).value).toBe(row.value);
  });

  it('group options show the first entry icon of each group, or the descriptor group icon', () => {
    const groupIcons = () => {
      fireEvent.click(button('By category'));
      fireEvent.mouseDown(screen.getByLabelText('Category'));
      return screen.getAllByRole('option').map((o) => [o.textContent, o.querySelector('img').getAttribute('src')]);
    };
    const firstOf = (category) => stamp.icon(stamp.list(ctx).find((row) => row.category === category));
    const first = mount({ systems: [stamp], initial: { system: 'stamp' } });
    expect(groupIcons()).toEqual(Object.entries(stamp.groups.names).map(([id, name]) => [name, `/${firstOf(id)}.png`]));
    first.unmount();

    const own = { ...stamp, groups: { ...stamp.groups, icon: (id) => `etc/${id}` } };
    withDescriptors([own], () => {
      mount({ systems: [own], initial: { system: 'stamp' } });
      expect(groupIcons()).toEqual(Object.entries(stamp.groups.names).map(([id, name]) => [name, `/etc/${id}.png`]));
    });
  });

  it('marks entries that already have a goal', () => {
    const [withGoal, without] = stamp.list(ctx);
    const existing = createGoal({ system: 'stamp', key: stamp.key(withGoal), metric: 'level', target: 1e6 });
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify({ schema: 1, accounts: { [ACCOUNT_KEY]: [existing] } }));
    mount({ systems: [stamp], initial: {}, source: 'header' });
    fireEvent.keyDown(screen.getByLabelText('Stamp'), { key: 'ArrowDown' });
    const option = (row) => screen.getAllByRole('option').find((o) => o.textContent.startsWith(stamp.name(row)));
    expect(option(withGoal).textContent).toBe(`${stamp.name(withGoal)}Has a goal`);
    expect(option(without).textContent).toBe(stamp.name(without));
  });

  it('a capped entry list says how many match', () => {
    mount({ systems: [item], initial: {}, source: 'header' });
    // Typing happens in a focused input; unfocused, the Autocomplete resets what was typed
    screen.getByLabelText('Item').focus();
    fireEvent.change(screen.getByLabelText('Item'), { target: { value: 'a' } });
    const matches = createFilterOptions()(item.list(ctx), { inputValue: 'a', getOptionLabel: (row) => String(item.name(row) ?? '') });
    expect(matches.length).toBeGreaterThan(250);
    expect(screen.getByText(`250 of ${numberWithCommas(matches.length)}, type to filter`)).toBeTruthy();
  });

  it('Sword Stamp has no Max step and accepts level 600', () => {
    const sword = stamp.list(ctx).find((row) => stamp.name(row) === 'Sword Stamp');
    mount({ systems: [stamp], initial: { system: 'stamp', key: stamp.key(sword) } });
    expect(button(/^Max/)).toBeNull();
    setTarget(600);
    save();
    expect(api.goals[0]).toMatchObject({ system: 'stamp', key: stamp.key(sword), target: 600 });
  });

  it.each(['artifact', 'sigil', 'card', 'statue', 'deathNote'])('%s tier select never offers the first tier (None / Locked)', (system) => {
    const d = getDescriptor(system);
    const metric = Object.keys(d.metrics).find((id) => d.metrics[id].tiers);
    mount({ systems: [d], initial: { system, key: d.key(d.list(ctx)[0]) } });
    if (Object.keys(d.metrics).length > 1) fireEvent.click(button(d.metrics[metric].label));
    fireEvent.mouseDown(screen.getByLabelText('Target'));
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(d.metrics[metric].tiers.slice(1));
  });
});
