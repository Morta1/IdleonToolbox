import { isValidTrackedMaterial } from '@utility/materialTracker';
import { materialTrackerToGoals } from './migrateMaterialTracker';
import { resolveGoal } from './resolve';
import { createGoal, GOALS_SCHEMA, isCharScope, isGoal, MAX_GOALS, MAX_ITEM_GOALS, sameGoal } from './store';

export const EXPORT_FORMAT = 'idleon-toolbox-goals';

// Only the definition travels: ids and timestamps are regenerated, and a hand-edited file cannot smuggle extra fields in
const DEFINITION_FIELDS = ['kind', 'system', 'key', 'group', 'metric', 'op', 'target', 'unit', 'scope', 'note', 'watch', 'nearAlert', 'pinned'];

const isObject = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const validScope = (scope) => scope === undefined || scope === 'account' || isCharScope(scope);
export const MAX_IMPORT_GOALS = 10000;
const isStr = (x) => typeof x === 'string';
const optional = (x, check) => x === undefined || check(x);
// A file is untrusted: every field the app later indexes or compares must have the type the app assumes
const isImportable = (goal) =>
  isGoal(goal) && validScope(goal.scope) &&
  isStr(goal.metric) && isStr(goal.system) &&
  optional(goal.unit, isStr) && optional(goal.key, isStr) &&
  optional(goal.group, (g) => isStr(g) || Number.isFinite(g)) &&
  (goal.target === 'max' || Number.isFinite(goal.target));
const isPool = (goal) => goal.system === 'item';

export const exportGoals = (goals, characters = []) => ({
  format: EXPORT_FORMAT,
  schema: GOALS_SCHEMA,
  exportedAt: new Date().toISOString(),
  goals: goals.map((goal) => {
    if (!isCharScope(goal.scope)) return goal;
    const classIndex = characters?.find((c) => c.name === goal.scope.char)?.classIndex;
    return { ...goal, scope: classIndex === undefined ? { char: goal.scope.char } : { char: goal.scope.char, classIndex } };
  })
});

// The material tracker's goals: the item goals and the greenstack goal
export const isItemGoal = (goal) => goal.system === 'item' || goal.system === 'greenstack';

// Item goals are account-wide, so they need no character hints
export const exportItemGoals = (goals) => exportGoals(goals.filter(isItemGoal));

const isOldTrackerExport = (data) => {
  const values = Object.values(data);
  return values.length > 0 && values.every(isValidTrackedMaterial);
};

export const parseImport = (text, { greenstackKeys } = {}) => {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'json' };
  }
  if (!isObject(data)) return { ok: false, error: 'format' };
  if (data.format !== EXPORT_FORMAT) {
    if (!isOldTrackerExport(data)) return { ok: false, error: 'format' };
    const goals = materialTrackerToGoals(data, { greenstackKeys });
    return { ok: true, file: { format: EXPORT_FORMAT, schema: GOALS_SCHEMA, exportedAt: null, goals } };
  }
  if (!Number.isInteger(data.schema) || data.schema < 1) return { ok: false, error: 'format' };
  if (data.schema > GOALS_SCHEMA) return { ok: false, error: 'schema' };
  if (!Array.isArray(data.goals)) return { ok: false, error: 'format' };
  if (data.goals.length > MAX_IMPORT_GOALS) return { ok: false, error: 'format' };
  const goals = data.goals.filter(isImportable);
  return { ok: true, file: { format: data.format, schema: data.schema, exportedAt: data.exportedAt ?? null, goals } };
};

export const summarizeImport = (file) => {
  const characters = new Map();
  let account = 0;
  for (const goal of file.goals) {
    if (isCharScope(goal.scope)) {
      const entry = characters.get(goal.scope.char) ?? { name: goal.scope.char, classIndex: goal.scope.classIndex, count: 0 };
      entry.count++;
      characters.set(goal.scope.char, entry);
    } else {
      account++;
    }
  }
  return { total: file.goals.length, account, character: file.goals.length - account, characters: [...characters.values()] };
};

// By name first, then by class among the characters nobody else claimed
export const defaultCharMap = (file, characters = []) => {
  const exported = summarizeImport(file).characters;
  const map = Object.create(null);
  const taken = new Set();
  for (const { name } of exported) {
    if (characters.some((c) => c.name === name)) {
      map[name] = name;
      taken.add(name);
    }
  }
  for (const { name, classIndex } of exported) {
    if (name in map) continue;
    const match = classIndex === undefined ? undefined
      : characters.find((c) => c.classIndex === classIndex && !taken.has(c.name));
    map[name] = match?.name ?? null;
    if (match) taken.add(match.name);
  }
  return map;
};

const pickDefinition = (goal, scope) => {
  const fields = {};
  for (const field of DEFINITION_FIELDS) if (goal[field] !== undefined) fields[field] = goal[field];
  fields.scope = scope;
  if (typeof fields.note !== 'string') delete fields.note;
  return fields;
};

export const ALL_GOALS = () => true;

// Replace drops the current goals `only` matches (every goal by default); the rest still count for caps and duplicates
export const planImport = (file, { account, current = [], characters = [], mode = 'merge', charMap = {}, only = ALL_GOALS } = {}) => {
  const base = mode === 'replace' ? current.filter((goal) => !only(goal)) : current;
  const kept = [];
  const counts = { item: base.filter(isPool).length, other: base.filter((g) => !isPool(g)).length };
  const now = Date.now();
  let duplicates = 0;
  let skipped = 0;
  let overCap = 0;
  for (const goal of file.goals) {
    let scope = 'account';
    if (isCharScope(goal.scope)) {
      const target = Object.hasOwn(charMap, goal.scope.char) ? charMap[goal.scope.char] : null;
      if (typeof target !== 'string' || !target) {
        skipped++;
        continue;
      }
      scope = { char: target };
    }
    const fresh = createGoal({ ...pickDefinition(goal, scope), createdAt: now + kept.length });
    if (base.some((g) => sameGoal(g, fresh)) || kept.some((g) => sameGoal(g, fresh))) {
      duplicates++;
      continue;
    }
    const pool = isPool(fresh) ? 'item' : 'other';
    if (counts[pool] >= (pool === 'item' ? MAX_ITEM_GOALS : MAX_GOALS)) {
      overCap++;
      continue;
    }
    counts[pool]++;
    kept.push(fresh);
  }
  const statuses = kept.map((goal) => resolveGoal(goal, { account, characters }).status);
  const missing = statuses.filter((status) => status === 'missing').length;
  // the entry is there but its target can't be measured any more (a stamp 'max' from an older export)
  const invalid = statuses.filter((status) => status === 'invalid').length;
  return { goals: kept, added: kept.length, duplicates, skipped, overCap, missing, invalid };
};
