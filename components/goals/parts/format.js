import { formatNum } from '@utility/helpers';
import { isAllChars, isCharScope, MAX_TARGET, NEXT_TARGET } from '@utility/goals/store';
import { capitalizeFirst } from '@utility/goals/registry/names';
import { getDescriptor } from '@utility/goals/registry';

// A goal counts whole things (levels, kills, items, a price): every digit under a million, then short ("1.04B"), on a
// goal's face and its details alike
export const formatNumber = (n) => formatNum(n, 'whole');

// Where the short forms match, every digit: a goal a hair short never reads as reached.
export const formatHave = (value, target) => {
  const short = formatNumber(value);
  return value < target && short === formatNumber(target) ? formatNum(Math.floor(value), 'exact') : short;
};

// Two decimals so 99.1% and 99.8% read apart, floored so 89.999% never reads as a reached 90%. The epsilon keeps
// 99.42 (stored as 99.4199...) from flooring to 99.41
export const formatPercent = (n) => formatNum(Math.floor(n * 100 + 1e-9) / 100, 'pct');

export const REACHED = 'Reached';
export const NO_LONGER_IN_GAME = 'No longer in the game';
export const TARGET_NO_LONGER_APPLIES = 'Target no longer applies';
export const COULD_NOT_READ = "Couldn't read this from your save";
export const TRACKING = 'Tracking';
// Stands in the bar's place on a goal that only follows an amount
export const NO_TARGET = 'No target';
const youHave = (value) => `You have ${value}`;
export const CAN_BUY_NOW = 'Can buy now';

const TIER_NUMBER = /^Tier \d+:\s*/;

// `label` is the stored direction's name; `option` reads as a sentence in the target row's select
export const DIRECTIONS = [
  { op: '>=', label: 'At least', option: 'Reach at least' },
  { op: '<=', label: 'At most', option: 'Stay at or below' }
];
const directionOf = (op) => (DIRECTIONS.find((d) => d.op === op) ?? DIRECTIONS[0]).label;

// What a yes/no goal reads before and after, by its metric's verb
const BOOLEAN_WORDS = {
  buy: { open: 'Not bought yet', done: 'Bought' },
  unlock: { open: 'Not unlocked yet', done: 'Unlocked' },
  own: { open: 'Not owned yet', done: 'Owned' }
};
// A metric without a verb is labelled by what it takes ("Defeated", "Won"), so the label is the done word
export const booleanWords = (view) => {
  if (BOOLEAN_WORDS[view.verb]) return BOOLEAN_WORDS[view.verb];
  const done = String(view.metricLabel ?? '') || BOOLEAN_WORDS.own.done;
  return { open: `Not ${done.toLowerCase()} yet`, done };
};

const lowerFirst = (text) => `${text[0].toLowerCase()}${text.slice(1)}`;

// A tier without its number: "Transcendent", not "Tier 6: Transcendent"
export const shortTier = (name) => String(name ?? '').replace(TIER_NUMBER, '');

export const ALL_CHARACTERS = 'All characters';

export const goalName = (view) => {
  // one entry on every character keeps its key; every entry on every character has none
  if (isAllChars(view.scope)) return view.key == null ? `${view.name} (${ALL_CHARACTERS.toLowerCase()})` : `${ALL_CHARACTERS} ${view.name}`;
  return isCharScope(view.scope) ? `${view.name} (${view.scope.char})` : view.name;
};

export const amountText = (view, n, format = formatNumber) => (view.unit === 'percentOfMax' ? formatPercent(n) : format(n));

// Some progress never reads as none: under 1% shows <1%
export const progressPercent = (view) => {
  const progress = view.progress ?? 0;
  // how much of the goal is done, so whole percents
  return progress > 0 && progress < 0.01 ? '<1%' : `${Math.floor(progress * 100)}%`;
};

// A goal's value colour: green when reached, muted when it cannot be measured
export const valueColor = (status) => {
  if (status === 'reached') return 'text.success';
  if (status === 'missing' || status === 'invalid' || status === 'unread') return 'text.secondary';
  return 'text.primary';
};

// An amount of a price's currency: small ones in full, big ones short ("1.2M"); bits keep their own notation
export const costAmount = (cost, n) => (cost.format ? cost.format(n) : formatNumber(n));

// "1.2M of 5M coins"
export const costText = (cost) => `${cost.format ? cost.format(cost.have) : formatHave(cost.have, cost.price)} of ${costAmount(cost, cost.price)} ${cost.label}`;

// Enough in the purse for the price; the goal is still open until it is bought
export const canBuy = (cost) => cost.have >= cost.price;

// A price goal's value slot: Can buy now once affordable, what you have of the price until then
// coins and icon currencies draw the price beside it; any other currency names it
export const costFaceText = (cost) => {
  if (!canBuy(cost)) return costText(cost);
  if (cost.display || cost.icon) return CAN_BUY_NOW;
  return `${CAN_BUY_NOW} · ${costAmount(cost, cost.price)} ${cost.label}`;
};

// An entry's 'max' shows the live cap; an all or group goal has one cap per entry, so it says Max
export const targetText = (view, format = formatNumber) => {
  if (view.boolean) return booleanWords(view).done;
  if (view.tierName) return shortTier(view.tierName);
  if (view.target === MAX_TARGET) return view.kind !== 'all' && Number.isFinite(view.targetValue) ? amountText(view, view.targetValue, format) : 'Max';
  return amountText(view, view.targetValue ?? view.target, format);
};

// A view's metric as the unit helpers read it
const metricOf = (view) => ({ label: view.metricLabel, noun: view.noun });

// "Lv 100"; another level metric keeps its name ("speed level 50"); any other amount is bare
const unitOf = ({ label, noun }) => {
  if (noun !== 'level') return '';
  return label === 'Level' ? 'Lv ' : `${label.toLowerCase()} `;
};
// A one-word plural metric names what is counted after the amount ("50 kills")
const suffixOf = (label) => (/^[A-Z][a-z]+s$/.test(label ?? '') ? ` ${label.toLowerCase()}` : '');

// An amount in its metric's unit ({ label, noun }): "Lv 150", "3 kills", "speed level 38"; a percent is bare
export const amountWithUnit = (metric, n, { percent = false } = {}) => {
  if (percent) return formatPercent(n);
  return `${unitOf(metric)}${formatNumber(n)}${suffixOf(metric.label)}`;
};

// The target field's placeholder: "Target level", "Target kills"
export const targetPlaceholder = (label, percent) => (percent ? 'Target %' : `Target ${String(label ?? '').toLowerCase()}`.trim());

// One bound of an item range, in the range's notation: "At least 500K"
export const rangeBoundText = (part) => `${directionOf(part.op)} ${formatNumber(part.targetValue)}`;

// "Edit at least 500K" for one bound of a range; any other goal is just Edit
export const editText = (view, part) => {
  if (!view.range) return 'Edit';
  return `Edit ${lowerFirst(rangeBoundText(part))}`;
};

// A system whose max is the goal itself: its all goal reads by its name, and says what each entry needs in its details
export const maxIsGoal = (view) => view.kind === 'all' && view.target === MAX_TARGET
  && Boolean(getDescriptor(view.system)?.metrics?.[view.metric]?.maxIsGoal);

// What the goal asks for: "At least Lv 100", "At most 10", "500,000 to 5M", "10M each"
export const goalText = (view) => {
  if (view.boolean) return booleanWords(view).done;
  if (view.range) return `${formatNumber(view.range.lower.targetValue)} to ${formatNumber(view.range.upper.targetValue)}`;
  if (view.target === NEXT_TARGET) return view.metricLabel;
  if (maxIsGoal(view)) return `${formatNumber(getDescriptor(view.system).metrics[view.metric].max())} each`;
  if (view.kind === 'all' && view.target === MAX_TARGET) return `Max ${String(view.metricLabel).toLowerCase()}`;
  const direction = directionOf(view.op);
  if (view.tierName) return `${direction} ${shortTier(view.tierName)}`;
  if (view.unit === 'percentOfMax') return `${direction} ${targetText(view)} of max`;
  return `${direction} ${unitOf(metricOf(view))}${targetText(view)}`;
};

// The amount you have and the target beside it: "Lv 38" + "of 100"; an at most goal names its direction
// ("At most 10") and a watch goal has no target
const amountParts = (view) => {
  const percent = view.unit === 'percentOfMax';
  const amount = (text) => (percent ? formatPercent(view.value) : `${unitOf(metricOf(view))}${text}`);
  const value = amount(formatNumber(view.value));
  if (view.watch) return { value: percent ? value : `${value}${suffixOf(view.metricLabel)}`, target: '' };
  if (view.range) return { value: amount(formatHave(view.value, view.range.lower.targetValue)), target: `of ${goalText(view)}` };
  const suffix = percent ? '' : suffixOf(view.metricLabel);
  if (view.op === '<=') return { value, target: `${directionOf(view.op)} ${targetText(view)}${suffix}` };
  return { value: amount(formatHave(view.value, view.targetValue ?? view.target)), target: `of ${targetText(view)}${suffix}` };
};

// A percent goal's plain amount after its percent: " · Lv 1,234", with the level its target needs when known
// (" · Lv 1,234 of 2,000"); nothing on any other goal
const plainAmount = (view, entry) => {
  if (view.unit !== 'percentOfMax' || !Number.isFinite(entry.amount)) return '';
  if (!Number.isFinite(entry.amountTarget)) return ` · ${amountWithUnit(metricOf(view), entry.amount)}`;
  // kept on one line (no-break spaces) so a phone wraps it whole after the percent
  return ` · ${`${unitOf(metricOf(view))}${formatHave(entry.amount, entry.amountTarget)} of ${formatNumber(entry.amountTarget)}`.replaceAll(' ', ' ')}`;
};

// A tier set by an amount's cut-off, when the amount has a unit: "62.3M of 100M kills"
const tierAmountText = (tierAmount) => (tierAmount?.unit
  ? `${formatHave(tierAmount.have, tierAmount.need)} of ${formatNumber(tierAmount.need)} ${tierAmount.unit}` : null);

// One entry's amount in its goal's unit: "Lv 148", the tier name; a yes/no entry has none
const entryAmount = (view, entry) => {
  if (entry.counts) return `${formatNumber(entry.counts.met)} of ${formatNumber(entry.counts.total)}`;
  if (view.boolean) return '';
  if (view.tierName !== undefined) return tierAmountText(entry.tierAmount) ?? shortTier(entry.valueTierName);
  return `${amountWithUnit(metricOf(view), entry.value, { percent: view.unit === 'percentOfMax' })}${plainAmount(view, entry)}`;
};

// What an entry goal has now, in its unit; nothing for a yes/no goal or an unknown amount
const currentAmount = (view) => {
  if (view.boolean || !Number.isFinite(view.value)) return null;
  if (view.valueTierName !== undefined) return shortTier(view.valueTierName);
  return amountWithUnit(metricOf(view), view.value);
};

// The nearest entry an all or group goal still needs: "Next up: Apple Lv 148"
export const nextUpText = (view) => {
  const [next] = view.short ?? [];
  if (!next) return null;
  const amount = entryAmount(view, next);
  return `Next up: ${next.name}${amount ? ` ${amount}` : ''}`;
};

// The fixed slots of a goal row or card: the value line, a muted caption, the text beside the bar (a percent or a
// tier step), whether a bar shows, a mark before the value ('check' reached, 'open' a yes/no goal not done yet) and
// the price of a yes/no goal with a cost
export const goalFace = (view) => {
  const reached = view.status === 'reached';
  // hint: the caption only adds context (Next up, Tracking), so a compact row leaves it to the expanded view
  // barText: muted words in the bar's slot when there is no bar to draw
  const face = {
    value: '', caption: null, hint: false, aside: null, bar: false, ready: false, barText: null,
    mark: reached ? 'check' : null, cost: null
  };
  if (view.status === 'missing') return { ...face, value: NO_LONGER_IN_GAME, mark: null };
  if (view.status === 'unread') return { ...face, value: COULD_NOT_READ, mark: null };
  // The entry is still there, so its current amount stays under the reason
  if (view.status === 'invalid') return { ...face, value: TARGET_NO_LONGER_APPLIES, mark: null, caption: currentAmount(view) };
  const barred = view.progress != null;
  const percent = barred ? progressPercent(view) : null;
  if (view.kind === 'all') {
    // an all characters goal counts characters
    const value = `${formatNumber(view.met)} of ${formatNumber(view.total)} ${isAllChars(view.scope) ? 'characters' : 'done'}`;
    if (view.watch) return { ...face, value, caption: TRACKING, hint: true, barText: NO_TARGET };
    return { ...face, value, caption: nextUpText(view), hint: true, aside: percent, bar: barred };
  }
  if (view.boolean) {
    const words = booleanWords(view);
    if (reached) return { ...face, value: words.done };
    if (view.cost && !view.watch) {
      // Once affordable the full bar turns to the "ready" colour: the goal now waits on you, and a percent would
      // only repeat it
      const affordable = canBuy(view.cost);
      return { ...face, value: costFaceText(view.cost), aside: affordable ? null : percent, bar: true, ready: affordable, cost: view.cost };
    }
    return { ...face, value: words.open, mark: 'open' };
  }
  if (view.tierName !== undefined) {
    const current = shortTier(view.valueTierName);
    if (view.watch) return { ...face, value: youHave(current), caption: TRACKING, hint: true, barText: NO_TARGET };
    const goal = view.op === '<=' ? `${directionOf(view.op)} ${shortTier(view.tierName)}` : shortTier(view.tierName);
    // a step count reads backwards for an at most goal ("6/2"), so only an at least goal has one
    // a tier set by an amount's cut-off reads as the percent of that cut-off
    const aside = view.op === '<=' ? null : view.tierAmount ? percent : `${view.value}/${view.targetValue}`;
    // the step count beside the bar carries the progress, so the goal's tier name waits for the open row
    return { ...face, value: tierAmountText(view.tierAmount) ?? current, caption: `Goal: ${goal}`, hint: true, aside, bar: true };
  }
  const { value, target } = amountParts(view);
  const plain = plainAmount(view, view);
  if (view.watch) return { ...face, value: youHave(`${value}${plain}`), caption: TRACKING, hint: true, barText: NO_TARGET };
  let text = value;
  if (target) text = target.startsWith('of ') ? `${value} ${target}` : `${value} · ${target}`;
  text = `${text}${plain}`;
  return { ...face, value: text, aside: percent, bar: barred };
};

// The goal's wording on one line: "Lv 38 of 100", "2,052 · At most 10", "Good · Goal: Great"
export const statusText = (view) => {
  const { value, caption } = goalFace(view);
  return caption ? `${value} · ${caption}` : value;
};

// A metric that is not a level names itself so the amount never reads as a level: a rank before the amount
// ("at least ribbon rank 15"), a count after it ("at least 1,000 kills", "at least 500 stock")
const titleTarget = (view) => {
  if (view.target === NEXT_TARGET) return `At ${String(view.metricLabel).toLowerCase()}`;
  const text = goalText(view);
  const named = view.metricLabel && view.target !== MAX_TARGET && !view.tierName && !view.range && view.unit !== 'percentOfMax' && view.noun !== 'level';
  if (!named) return text;
  const direction = directionOf(view.op);
  const label = String(view.metricLabel).toLowerCase();
  const amount = text.slice(direction.length + 1);
  if (amount.endsWith(` ${label}`)) return text;
  return view.noun === 'rank' ? `${direction} ${label} ${amount}` : `${direction} ${amount} ${label}`;
};

// A goal's name; an all or group goal also says what each entry needs ("All bubbles at least Lv 100")
export const goalTitle = (view) => {
  const name = goalName(view);
  if (view.kind !== 'all' || view.boolean || view.watch || view.status === 'missing' || view.status === 'invalid' || maxIsGoal(view)) return name;
  return `${name} ${lowerFirst(titleTarget(view))}`;
};

// The muted line under a goal's name: the entry kind ("Bubble"), or the system of an all or group goal ("Bubbles")
export const cardLabel = (view) => {
  if (view.kind === 'all') return String(view.label ?? '');
  return capitalizeFirst(String(view.entryLabel ?? view.label ?? ''));
};

// One entry of an all or group goal
export const entryProgressText = (view, entry) => {
  // a character of an all characters all goal counts its own entries
  if (entry.counts) return `${formatNumber(entry.counts.met)} of ${formatNumber(entry.counts.total)} done`;
  if (view.boolean) return entry.cost ? costFaceText(entry.cost) : booleanWords(view).open;
  if (view.tierName !== undefined) return tierAmountText(entry.tierAmount) ?? `${shortTier(entry.valueTierName)} · ${entry.value}/${entry.targetValue}`;
  return `${amountText(view, entry.value, (n) => formatHave(n, entry.targetValue))} of ${amountText(view, entry.targetValue)}${plainAmount(view, entry)}`;
};
