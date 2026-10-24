import React, { useContext, useState } from 'react';
import { Button, Popover, Stack, Typography } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { sameScope, useGoals } from '@components/goals/GoalsProvider';
import { ALL_CHARS, createGoal, effectiveScope, isAllChars, isCharScope, isGlobalKey, MAX_GOALS, MAX_TARGET, NEXT_TARGET } from '@utility/goals/store';
import { isUnresolved, resolveGoal } from '@utility/goals/resolve';
import { trackEvent } from '@utility/analytics';
import { getBubbleLevelForPercent } from '@parsers/world-2/alchemy';
import SystemSelect from './parts/SystemSelect';
import AppliesTo from './parts/AppliesTo';
import EntrySearch from './parts/EntrySearch';
import MetricChips, { metricOptions } from './parts/MetricChips';
import TargetInput from './parts/TargetInput';
import QuickSteps from './parts/QuickSteps';
import TierSelect from './parts/TierSelect';
import Preview from './parts/Preview';
import CharacterPicker from './parts/CharacterPicker';
import NoteInput from './parts/NoteInput';
import { amountWithUnit, formatNumber, formatPercent } from './parts/format';

const QUICK_PERCENT = 90;

const firstGroup = (descriptor) => Object.keys(descriptor?.groups?.names ?? {})[0] ?? null;
// A system without single entries (allOnly) starts on All
const appliesToOf = (goal, descriptor) => {
  if (goal?.kind !== 'all') return descriptor?.allOnly ? 'all' : 'one';
  return goal.group != null ? 'group' : 'all';
};

// A stored Max the entry can no longer follow (stamps lost their max, an upgrade without a cap, a percent) starts the
// edit empty
const startTarget = (goal, descriptor, ctx) => {
  if (!goal) return '';
  if (goal.target !== MAX_TARGET) return String(goal.target);
  const metric = descriptor?.metrics?.[goal.metric];
  if (!metric?.max || goal.unit === 'percentOfMax') return '';
  if (goal.kind === 'all') return MAX_TARGET;
  const rowCtx = rowContext(goal.scope, ctx);
  const row = listRows(descriptor, goal.scope, ctx).find((r) => String(descriptor.key(r)) === String(goal.key));
  return row && Number.isFinite(metric.max(row, rowCtx)) ? MAX_TARGET : '';
};

// All characters reads caps against the first character
const rowContext = (scope, { account, characters }) => {
  if (isAllChars(scope)) return { account, characters, character: characters?.[0] };
  if (isCharScope(scope)) {
    return { account, characters, character: characters?.find(({ name }) => name === scope.char) };
  }
  return { account, characters };
};

// All characters lists every entry any character has, once
const listRows = (descriptor, scope, ctx) => {
  if (!isAllChars(scope)) return descriptor.list(rowContext(scope, ctx)) ?? [];
  const byKey = new Map();
  for (const character of ctx.characters ?? []) {
    for (const row of descriptor.list({ ...ctx, character }) ?? []) {
      if (!byKey.has(String(descriptor.key(row)))) byKey.set(String(descriptor.key(row)), row);
    }
  }
  return [...byKey.values()];
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

const GoalForm = ({ systems, initial, source, onClose, onSaved, entryOnly }) => {
  const { state } = useContext(AppContext);
  const { goals, save, remove, findEntryGoal } = useGoals();
  const fixedScope = initial?.goal?.scope ?? initial?.scope;
  const existing = initial?.goal
    ?? (initial?.key != null ? findEntryGoal(initial.system, initial.key, fixedScope ?? 'account') : undefined);

  const [system, setSystem] = useState(existing?.system ?? initial?.system ?? systems[0].system);
  const descriptor = systems.find((d) => d.system === system) ?? systems[0];
  const options = metricOptions(descriptor);
  const [appliesToChoice, setAppliesTo] = useState(appliesToOf(existing, descriptor));
  const [group, setGroup] = useState(existing?.group ?? firstGroup(descriptor));
  const [entryKey, setEntryKey] = useState(existing?.key ?? initial?.key ?? null);
  const [choice, setChoice] = useState({
    metric: existing?.metric ?? options[0]?.metric,
    unit: existing?.unit ?? 'value'
  });
  const [op, setOp] = useState(existing?.op ?? '>=');
  const [target, setTarget] = useState(() => startTarget(existing, descriptor, { account: state?.account, characters: state?.characters }));
  const [note, setNote] = useState(existing?.note ?? '');
  const [attempted, setAttempted] = useState(false);
  const [rejected, setRejected] = useState(null);
  const [pickedChar, setPickedChar] = useState(isAllChars(fixedScope) ? ALL_CHARS : state?.characters?.[0]?.name ?? null);

  // A character system opened without a character (the page header) asks whose entries to list
  const asksCharacter = descriptor.scope === 'character' && !isCharScope(fixedScope);
  const pickedScope = isAllChars(pickedChar) ? ALL_CHARS : { char: pickedChar };
  // listScope: whose entries are listed; scope: what the goal is saved for
  const listScope = asksCharacter ? pickedScope : fixedScope ?? 'account';
  // All characters tracks one entry, so it has no All or group choice
  const appliesTo = isAllChars(listScope) ? 'one' : appliesToChoice;
  // An entry every character shares (a global skill) is the account's goal, so no character is asked for
  const globalEntry = appliesTo === 'one' && entryKey != null && isGlobalKey(descriptor.system, entryKey);
  const scope = globalEntry ? 'account' : listScope;
  const showPicker = asksCharacter && !globalEntry;
  const allChars = isAllChars(scope);
  const ctx = { account: state?.account, characters: state?.characters };
  const rowCtx = rowContext(listScope, ctx);
  const rows = listRows(descriptor, listScope, ctx);
  // Each system lists its own entries; a character system counts the picked character's. Listing every system is
  // costly, so it runs when the system select opens, not on every keystroke
  const charScope = isCharScope(fixedScope) ? fixedScope : pickedScope;
  const systemOption = (d, list) => ({ system: d.system, label: d.label, icon: list[0] ? d.icon(list[0]) : null, count: list.length });
  const listSystemOptions = () => systems.map((d) => systemOption(d, d === descriptor
    ? rows
    : listRows(d, d.scope === 'character' ? charScope : 'account', ctx)));
  const goalKeys = new Set(goals
    .filter((g) => g.kind === 'entry' && !g.watch && g.system === descriptor.system
      && sameScope(effectiveScope(g), effectiveScope({ system: g.system, key: g.key, scope: listScope })))
    .map((g) => String(g.key)));
  const row = appliesTo === 'one' && entryKey != null
    ? rows.find((r) => String(descriptor.key(r)) === String(entryKey))
    : undefined;
  const metric = descriptor.metrics[choice.metric];
  const percent = choice.unit === 'percentOfMax';
  // All characters has no single amount to show or step from
  const value = row && !allChars ? metric.value(row, rowCtx) : null;
  const max = row ? metric.max?.(row, rowCtx) ?? null : null;
  const valuePercent = row && !allChars ? metric.percentOfMax?.(row, rowCtx) ?? null : null;
  const nextStep = !!metric.nextStep;
  let parsed = parseTarget(target);
  if (metric.boolean) parsed = 1;
  else if (nextStep) parsed = NEXT_TARGET;

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
    op: nextStep ? '>=' : op,
    target: parsed,
    // A watch goal edited without a target stays a watch goal instead of an already reached ">= 0"
    ...(existing?.watch && parsed === 0 ? { watch: true } : {})
  };
  const resolved = !targetError && !entryError ? resolveGoal(draft, ctx) : null;
  // All characters previews like an all goal: how many characters are already there
  const preview = appliesTo !== 'one' || allChars ? resolved : null;
  const unreachable = resolved ? isUnresolved(resolved) : false;

  const changeSystem = (next) => {
    const nextDescriptor = systems.find((d) => d.system === next);
    setSystem(next);
    setAppliesTo(appliesToOf(null, nextDescriptor));
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
  // Max is a ceiling to climb to, so an at most goal starts from an empty target
  const changeOp = (next) => {
    setOp(next);
    if (next === '<=' && target === MAX_TARGET) setTarget('');
  };
  const changeChoice = ({ metric: nextMetric, unit }) => {
    setChoice({ metric: nextMetric, unit });
    setTarget('');
  };

  const onSave = () => {
    setAttempted(true);
    if (targetError || entryError || unreachable) return;
    const kept = existing
      ? { id: existing.id, createdAt: existing.createdAt, nearAlert: existing.nearAlert, pinned: existing.pinned }
      : {};
    const refusal = save(createGoal({ ...kept, ...draft, note: note.trim() }));
    if (refusal) {
      setRejected(refusal);
      return;
    }
    if (!existing) trackEvent('goal_added', { system: draft.system, kind: draft.kind, source });
    onClose();
    onSaved?.();
  };

  const onRemove = () => {
    remove(existing.id);
    trackEvent('goal_removed', { system: existing.system, kind: existing.kind, source });
    onClose();
  };

  // "You have Lv 150 · Max 200", "You have Lv 100 · Already maxed", "You have 3 kills", "You have Transcendent"
  let have = null;
  if (row && metric.tiers) {
    have = metric.tiers[value] != null ? `You have ${metric.tiers[value]}` : null;
  } else if (row && Number.isFinite(value) && !metric.boolean) {
    let of = '';
    if (max != null) of = value >= max ? ' · Already maxed' : ` · Max ${formatNumber(max)}`;
    const pct = Number.isFinite(valuePercent) ? ` · ${formatPercent(valuePercent)} of max` : '';
    // A page total's entry name already says what the number is
    const amount = descriptor.totals ? formatNumber(value) : amountWithUnit(metric, value);
    have = `You have ${amount}${of}${pct}`;
  }
  // Quick steps all climb, so an at most goal has none
  const steps = metric.tiers || metric.boolean || nextStep || op === '<='
    ? []
    : buildSteps({ descriptor, metric, row, value, max, percent, appliesTo, account: ctx.account });

  return (
    <Stack gap={1.5}>
      <Typography variant="h6">{existing ? 'Edit goal' : 'Add goal'}</Typography>
      {systems.length > 1 ? <SystemSelect current={systemOption(descriptor, rows)} listOptions={listSystemOptions} value={descriptor.system}
                        onChange={changeSystem}/> : null}
      {showPicker ? <CharacterPicker characters={state?.characters} value={pickedChar} onChange={changeCharacter}/> : null}
      <AppliesTo descriptor={descriptor} rows={rows} value={appliesTo} group={group} onChange={setAppliesTo}
                 onGroupChange={setGroup} entryOnly={entryOnly || isAllChars(listScope)}/>
      {appliesTo === 'one' ? (
        <EntrySearch descriptor={descriptor} rows={rows} value={entryKey} goalKeys={goalKeys} onChange={setEntryKey}/>
      ) : null}
      {entryError && attempted ? <Typography variant="body2" color="error">{entryError}</Typography> : null}
      {have ? <Typography variant="body2" color="text.secondary">{have}</Typography> : null}
      {options.length > 1 ? (
        <MetricChips options={options} metric={choice.metric} unit={choice.unit} onChange={changeChoice}/>
      ) : null}
      {metric.tiers ? (
        <TierSelect tiers={metric.tiers} value={target} error={shownTargetError} onChange={setTarget}/>
      ) : null}
      {!metric.tiers && !metric.boolean ? (
        <TargetInput op={op} target={target} percent={percent} metricLabel={metric.label} nextStep={nextStep} error={shownTargetError}
                     onOpChange={changeOp}
                     onTargetChange={setTarget}/>
      ) : null}
      {steps.length ? <QuickSteps steps={steps} onPick={setTarget}/> : null}
      {preview ? <Preview view={preview}/> : null}
      <NoteInput value={note} onChange={setNote}/>
      {unreachable && attempted ? (
        <Typography variant="body2" color="error">No entries can reach this target</Typography>
      ) : null}
      {rejected === 'cap' ? (
        <Typography variant="body2" color="error">You have {MAX_GOALS} goals. Remove some first.</Typography>
      ) : null}
      {rejected === 'newer' ? (
        <Typography variant="body2" color="error">Your goals were saved by a newer version of the site. Reload the page.</Typography>
      ) : null}
      <Stack direction="row" gap={1} justifyContent="flex-end">
        {existing ? <Button color="error" onClick={onRemove} sx={{ mr: 'auto' }}>Remove</Button> : null}
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>Save</Button>
      </Stack>
    </Stack>
  );
};

// align="right" opens leftwards from the anchor's right edge, so a header button keeps the page header and tabs visible.
// entryOnly locks the form to the one entry in `initial` (no applies-to toggle); pass a single system with it
const GoalPopover = ({ anchorEl, open, onClose, onSaved, systems, initial, source, align = 'left', entryOnly = false }) => {
  const { enabled } = useGoals();
  if (!enabled || !systems?.length) return null;
  // The form lives inside the popover so it unmounts on close and every open starts from `initial`
  return (
    <Popover open={open} anchorEl={anchorEl} onClose={onClose}
             anchorOrigin={{ vertical: 'bottom', horizontal: align }}
             transformOrigin={{ vertical: 'top', horizontal: align }}
             slotProps={{ paper: { sx: { p: 2, width: 380, maxWidth: 'calc(100vw - 32px)' } } }}>
      <GoalForm systems={systems} initial={initial} source={source} onClose={onClose} onSaved={onSaved}
                entryOnly={entryOnly}/>
    </Popover>
  );
};

export default GoalPopover;
