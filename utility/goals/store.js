import { isGlobalSkill } from '../consts';

export const GOALS_SCHEMA = 1;
export const MAX_GOALS = 200;
export const MAX_ITEM_GOALS = 2000;
export const GOALS_STORAGE_KEY = 'goals';

const KINDS = ['entry', 'all'];
const OPS = ['>=', '<='];
const SAME_FIELDS = ['system', 'scope', 'key', 'group', 'metric', 'op', 'target', 'unit', 'watch'];

const emptyBlob = () => ({ schema: GOALS_SCHEMA, accounts: {} });
const isObject = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const isOptionalBool = (x) => x === undefined || typeof x === 'boolean';

export const accountKeyOf = ({ uid, characters, demo, profile, emptyAccount } = {}) => {
  if (profile || emptyAccount || !characters?.length) return null;
  if (demo && !uid) return 'demo';
  return uid ?? characters[0]?.name ?? null;
};

export const isGoal = (x) =>
  isObject(x) &&
  x.v !== undefined &&
  typeof x.id === 'string' &&
  KINDS.includes(x.kind) &&
  typeof x.system === 'string' &&
  typeof x.metric === 'string' &&
  OPS.includes(x.op) &&
  (x.target === 'max' || Number.isFinite(x.target)) &&
  isOptionalBool(x.watch) &&
  isOptionalBool(x.nearAlert) &&
  isOptionalBool(x.pinned);

// A blob written by a newer build: loaded as empty, and never written over
export const isNewerBlob = (raw) => isObject(raw) && Number.isFinite(raw.schema) && raw.schema > GOALS_SCHEMA;

export const normalizeBlob = (raw) => {
  if (!isObject(raw) || raw.schema !== GOALS_SCHEMA || !isObject(raw.accounts)) return emptyBlob();
  const accounts = {};
  for (const [key, list] of Object.entries(raw.accounts)) {
    accounts[key] = Array.isArray(list) ? list.filter(isGoal) : [];
  }
  return { schema: GOALS_SCHEMA, accounts };
};

export const createGoal = (fields) => ({
  kind: 'entry',
  scope: 'account',
  op: '>=',
  unit: 'value',
  note: '',
  ...fields,
  v: 1,
  id: fields?.id ?? crypto.randomUUID(),
  createdAt: fields?.createdAt ?? Date.now()
});

export const isCharScope = (scope) => isObject(scope) && typeof scope.char === 'string';

// One entry of a character system on every character at once
export const ALL_CHARS = 'allChars';
export const isAllChars = (scope) => scope === ALL_CHARS;

// A character scope is a fresh object per goal, so it is compared by character name
export const scopeKey = (scope) => {
  if (scope && typeof scope === 'object') return `char:${scope.char}`;
  return isAllChars(scope) ? ALL_CHARS : 'account';
};

// Entries every character shares (a global skill): one value for the account, so any stored scope means the account.
// Kept here, data-free, for the duplicate checks; the descriptors' globalKey hook reads the same helpers
const GLOBAL_KEYS = { skill: isGlobalSkill };
export const isGlobalKey = (system, key) => !!GLOBAL_KEYS[system]?.(key);
export const effectiveScope = ({ system, key, scope }) => (isGlobalKey(system, key) ? 'account' : scope);

// watch is compared as a boolean so an absent flag equals false
const sameField = (f, a, b) => {
  if (f === 'watch') return !!a?.[f] === !!b?.[f];
  if (f === 'scope') return scopeKey(effectiveScope(a ?? {})) === scopeKey(effectiveScope(b ?? {}));
  return a?.[f] === b?.[f];
};

export const sameGoal = (a, b) => SAME_FIELDS.every((f) => sameField(f, a, b));

export const goalsOf = (blob, accountKey) => blob?.accounts?.[accountKey] ?? [];

const poolOf = (goal) => (goal.system === 'item' ? 'item' : 'other');
const capOf = (goal) => (goal.system === 'item' ? MAX_ITEM_GOALS : MAX_GOALS);
const countPool = (list, goal) => list.filter((g) => poolOf(g) === poolOf(goal)).length;

// Pure step shared by the single and batch forms
const applyGoal = (list, goal) => {
  let idx = list.findIndex((g) => g.id === goal.id);
  if (idx === -1) idx = list.findIndex((g) => sameGoal(g, goal));
  if (idx !== -1) {
    const next = list.slice();
    next[idx] = goal;
    return { list: next, outcome: 'replaced' };
  }
  if (countPool(list, goal) >= capOf(goal)) return { list, outcome: 'cap' };
  return { list: [...list, goal], outcome: 'added' };
};

const withList = (blob, accountKey, list) => ({
  ...blob,
  accounts: { ...blob?.accounts, [accountKey]: list }
});

export const upsertGoal = (blob, accountKey, goal) => {
  const { list, outcome } = applyGoal(goalsOf(blob, accountKey), goal);
  if (outcome === 'cap') return { blob, rejected: 'cap' };
  return { blob: withList(blob, accountKey, list), rejected: null };
};

export const upsertGoals = (blob, accountKey, goals) => {
  let list = goalsOf(blob, accountKey);
  let added = 0;
  let duplicates = 0;
  let overCap = 0;
  for (const goal of goals) {
    const res = applyGoal(list, goal);
    list = res.list;
    if (res.outcome === 'added') added++;
    else if (res.outcome === 'replaced') duplicates++;
    else overCap++;
  }
  return { blob: withList(blob, accountKey, list), added, duplicates, overCap };
};

export const removeGoals = (blob, accountKey, ids) => {
  const drop = new Set(ids);
  return withList(blob, accountKey, goalsOf(blob, accountKey).filter((g) => !drop.has(g.id)));
};

export const removeGoal = (blob, accountKey, id) => removeGoals(blob, accountKey, [id]);
