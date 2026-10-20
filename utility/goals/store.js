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
  (x.target === 'max' || (typeof x.target === 'number' && !Number.isNaN(x.target))) &&
  isOptionalBool(x.watch) &&
  isOptionalBool(x.nearAlert);

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

// watch is compared as a boolean so an absent flag equals false
export const sameGoal = (a, b) =>
  SAME_FIELDS.every((f) => (f === 'watch' ? !!a?.[f] === !!b?.[f] : a?.[f] === b?.[f]));

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
