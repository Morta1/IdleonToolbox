import React, { useContext, useState } from 'react';
import { Button, Popover, Stack, Typography } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { useGoals } from '@components/goals/GoalsProvider';
import { createGoal, MAX_GOALS } from '@utility/goals/store';
import { resolveGoal } from '@utility/goals/resolve';
import { trackEvent } from '@utility/analytics';
import { getBubbleLevelForPercent } from '@parsers/world-2/alchemy';
import SystemSelect from './parts/SystemSelect';
import AppliesTo from './parts/AppliesTo';
import EntrySearch from './parts/EntrySearch';
import MetricChips, { metricOptions } from './parts/MetricChips';
import TargetInput, { MAX_TARGET } from './parts/TargetInput';
import QuickSteps from './parts/QuickSteps';
import TierSelect from './parts/TierSelect';
import Preview from './parts/Preview';
import CharacterPicker from './parts/CharacterPicker';
import { formatNumber, formatPercent } from './parts/format';

const QUICK_PERCENT = 90;

const firstGroup = (descriptor) => Object.keys(descriptor?.groups?.names ?? {})[0] ?? null;
const appliesToOf = (goal) => {
  if (goal?.kind !== 'all') return 'one';
  return goal.group != null ? 'group' : 'all';
};
const shortLabel = (label) => (label === 'Level' ? 'Lv' : label);
const isCharScope = (scope) => !!scope && typeof scope === 'object';

const rowContext = (scope, { account, characters }) => {
  if (scope && typeof scope === 'object') {
    return { account, characters, character: characters?.find(({ name }) => name === scope.char) };
  }
  return { account, characters };
};

const parseTarget = (text) => {
  if (text === MAX_TARGET) return MAX_TARGET;
  if (text === '') return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
};

const buildSteps = ({ descriptor, metric, row, value, max, percent, appliesTo, account }) => {
  if (percent) return [{ label: `${QUICK_PERCENT}%`, target: String(QUICK_PERCENT) }];
  const steps = [];
  if (appliesTo !== 'one') {
    if (metric.max) steps.push({ label: 'Max', target: MAX_TARGET });
    return steps;
  }
  if (!row) return steps;
  if (max != null) steps.push({ label: `Max (${formatNumber(max)})`, target: MAX_TARGET });
  if (Number.isFinite(value)) {
    for (const step of metric.steps ?? []) {
      if (max == null || value + step <= max) steps.push({ label: `+${formatNumber(step)}`, target: String(value + step) });
    }
  }
  if (descriptor.system === 'bubble') {
    const level = getBubbleLevelForPercent(account, row, QUICK_PERCENT);
    if (Number.isFinite(level)) steps.push({ label: `${QUICK_PERCENT}% = Lv ${formatNumber(level)}`, target: String(level) });
  }
  return steps;
};

const GoalForm = ({ systems, initial, source, onClose }) => {
  const { state } = useContext(AppContext);
  const { save, remove, findEntryGoal } = useGoals();
  const fixedScope = initial?.goal?.scope ?? initial?.scope;
  const existing = initial?.goal
    ?? (initial?.key != null ? findEntryGoal(initial.system, initial.key, fixedScope ?? 'account') : undefined);

  const [system, setSystem] = useState(existing?.system ?? initial?.system ?? systems[0].system);
  const descriptor = systems.find((d) => d.system === system) ?? systems[0];
  const options = metricOptions(descriptor);
  const [appliesTo, setAppliesTo] = useState(appliesToOf(existing));
  const [group, setGroup] = useState(existing?.group ?? firstGroup(descriptor));
  const [entryKey, setEntryKey] = useState(existing?.key ?? initial?.key ?? null);
  const [choice, setChoice] = useState({
    metric: existing?.metric ?? options[0]?.metric,
    unit: existing?.unit ?? 'value'
  });
  const [op, setOp] = useState(existing?.op ?? '>=');
  const [target, setTarget] = useState(existing ? String(existing.target) : '');
  const [attempted, setAttempted] = useState(false);
  const [capHit, setCapHit] = useState(false);
  const [pickedChar, setPickedChar] = useState(state?.characters?.[0]?.name ?? null);

  // A character system opened without a character (the page header) asks whose entries to list
  const showPicker = descriptor.scope === 'character' && !isCharScope(fixedScope);
  let scope = fixedScope ?? 'account';
  if (showPicker) scope = { char: pickedChar };
  const ctx = { account: state?.account, characters: state?.characters };
  const rowCtx = rowContext(scope, ctx);
  const rows = descriptor.list(rowCtx) ?? [];
  const row = appliesTo === 'one' && entryKey != null
    ? rows.find((r) => String(descriptor.key(r)) === String(entryKey))
    : undefined;
  const metric = descriptor.metrics[choice.metric];
  const percent = choice.unit === 'percentOfMax';
  const value = row ? metric.value(row, rowCtx) : null;
  const max = row ? metric.max?.(row, rowCtx) ?? null : null;
  const valuePercent = row ? metric.percentOfMax?.(row, rowCtx) ?? null : null;
  const parsed = metric.boolean ? 1 : parseTarget(target);

  let targetError = null;
  if (parsed === null) targetError = 'Enter a target';
  else if (percent && parsed !== MAX_TARGET && parsed >= 100) targetError = 'Percent must be below 100';
  else if (!percent && parsed !== MAX_TARGET && max != null && parsed > max) {
    targetError = `Target is above the max (${formatNumber(max)})`;
  }
  const entryError = appliesTo === 'one' && !row ? 'Pick one from the list' : null;
  const shownTargetError = targetError && (attempted || target !== '') ? targetError : null;

  const draft = {
    kind: appliesTo === 'one' ? 'entry' : 'all',
    system: descriptor.system,
    scope,
    ...(appliesTo === 'one' && row ? { key: descriptor.key(row) } : {}),
    ...(appliesTo === 'group' ? { group } : {}),
    metric: choice.metric,
    unit: choice.unit,
    op,
    target: parsed
  };
  const preview = appliesTo !== 'one' && !targetError ? resolveGoal(draft, ctx) : null;

  const changeSystem = (next) => {
    const nextDescriptor = systems.find((d) => d.system === next);
    setSystem(next);
    setAppliesTo('one');
    setGroup(firstGroup(nextDescriptor));
    setEntryKey(null);
    setChoice({ metric: metricOptions(nextDescriptor)[0]?.metric, unit: 'value' });
    setTarget('');
    setAttempted(false);
  };
  const changeCharacter = (name) => {
    setPickedChar(name);
    setEntryKey(null);
  };
  const changeChoice = ({ metric: nextMetric, unit }) => {
    setChoice({ metric: nextMetric, unit });
    setTarget('');
  };

  const onSave = () => {
    setAttempted(true);
    if (targetError || entryError) return;
    const kept = existing
      ? { id: existing.id, createdAt: existing.createdAt, note: existing.note, nearAlert: existing.nearAlert }
      : {};
    if (save(createGoal({ ...kept, ...draft })) === 'cap') {
      setCapHit(true);
      return;
    }
    if (!existing) trackEvent('goal_added', { system: draft.system, kind: draft.kind, source });
    onClose();
  };

  const onRemove = () => {
    remove(existing.id);
    trackEvent('goal_removed', { system: existing.system, kind: existing.kind, source });
    onClose();
  };

  let now = null;
  if (row && Number.isFinite(value) && !metric.boolean) {
    const of = max != null ? ` of ${formatNumber(max)}` : '';
    const pct = Number.isFinite(valuePercent) ? ` · ${formatPercent(valuePercent)} of max` : '';
    now = `Now ${shortLabel(metric.label)} ${formatNumber(value)}${of}${pct}`;
  }
  const steps = metric.tiers || metric.boolean
    ? []
    : buildSteps({ descriptor, metric, row, value, max, percent, appliesTo, account: ctx.account });

  return (
    <Stack gap={1.5}>
      <Typography variant="h6">{existing ? 'Edit goal' : 'Add goal'}</Typography>
      {systems.length > 1 ? <SystemSelect systems={systems} value={system} onChange={changeSystem}/> : null}
      {showPicker ? <CharacterPicker characters={state?.characters} value={pickedChar} onChange={changeCharacter}/> : null}
      <AppliesTo descriptor={descriptor} value={appliesTo} group={group} onChange={setAppliesTo}
                 onGroupChange={setGroup}/>
      {appliesTo === 'one' ? (
        <EntrySearch descriptor={descriptor} rows={rows} value={entryKey} onChange={setEntryKey}/>
      ) : null}
      {entryError && attempted ? <Typography variant="body2" color="error">{entryError}</Typography> : null}
      {now ? <Typography variant="body2" color="text.secondary">{now}</Typography> : null}
      {options.length > 1 ? (
        <MetricChips options={options} metric={choice.metric} unit={choice.unit} onChange={changeChoice}/>
      ) : null}
      {metric.tiers ? (
        <TierSelect tiers={metric.tiers} value={target} error={shownTargetError} onChange={setTarget}/>
      ) : null}
      {!metric.tiers && !metric.boolean ? (
        <TargetInput op={op} target={target} percent={percent} error={shownTargetError} onOpChange={setOp}
                     onTargetChange={setTarget}/>
      ) : null}
      {steps.length ? <QuickSteps steps={steps} onPick={setTarget}/> : null}
      {preview ? <Preview view={preview}/> : null}
      {capHit ? (
        <Typography variant="body2" color="error">You have {MAX_GOALS} goals. Remove some first.</Typography>
      ) : null}
      <Stack direction="row" gap={1} justifyContent="flex-end">
        {existing ? <Button color="error" onClick={onRemove} sx={{ mr: 'auto' }}>Remove</Button> : null}
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>Save</Button>
      </Stack>
    </Stack>
  );
};

const GoalPopover = ({ anchorEl, open, onClose, systems, initial, source }) => {
  const { enabled } = useGoals();
  if (!enabled || !systems?.length) return null;
  // The form lives inside the popover so it unmounts on close and every open starts from `initial`
  return (
    <Popover open={open} anchorEl={anchorEl} onClose={onClose}
             anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
             slotProps={{ paper: { sx: { p: 2, width: 380, maxWidth: 'calc(100vw - 32px)' } } }}>
      <GoalForm systems={systems} initial={initial} source={source} onClose={onClose}/>
    </Popover>
  );
};

export default GoalPopover;
