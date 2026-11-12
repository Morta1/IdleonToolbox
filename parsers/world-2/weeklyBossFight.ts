import type { Account } from '../types';
import { weeklyBosses, weeklyBossesActions, weeklyBossesTasks } from '@website-data';
import { getCloudBonus } from '../world-3/equinox';
import { getBestActiveCharacter } from '../talents';
import { getTaskQuantity } from './weeklyBosses';

// The weekly boss fight, as the game's click handler plays it (ActorEvents_623 _event_2 and
// _customBlock_WeeklyBoss). Replayed against the live game click by click on 50 routes, with the same turn, damage,
// skull, trophies and fight keys after every click.

export type FightGoal = 'skulls' | 'exp' | 'dmg' | 'trophies';
export type Rewind = 'full' | 'back' | 'joke' | null;
export type FightStep =
  | { turn: number; skip: true }
  | { turn: number; skip?: false; option: number; action: number; value: number; rewind: Rewind; skull: number };
export type FightRoute = {
  skulls: number; exp: number; dmg: number; trophies: number; pickups: number; clicks: number; steps: FightStep[]
};

type Keys = Record<string, number>;
// The clicks so far as a chain back to the first, so a new state shares its parent's instead of copying them
type Trail = { step: FightStep; prev: Trail | null } | null;
type State = { turn: number; dealt: number; skull: number; best: number; trophies: number; pickups: number; w: Keys; trail: Trail };

const ATTACK = 0;
const BUFF = 1;
const MAX_SKULLS = 5;
// The two outside buffs the fight writes (tea break "c", chilly cheese "g") count up to 150 where the game reads them
const BUFF_CAP = 150;
const BEAM_WIDTH = 2000;

const n = (value: unknown) => Number(value) || 0;
const actionOf = (index: number) => (weeklyBossesActions as any[])[index];
const typeOf = (index: number) => n(actionOf(index)?.x4);

// game: WeeklyBoss("BossHPmax"), the boss's HP at a skull tier
export const getFightBossHp = (boss: any, skull: number) => n(boss?.x4) * Math.pow(n(boss?.x5), skull);

// game: WeeklyBoss("POW"), how strong a character's options are: its task quantity against the task's x1, so 50% at x1.
// Carry capacity is the one task read from the logged-in character's star sign and boosts, and the only one the
// game lets any character click, so it counts the character the save was last played on.
export const getFightPows = (week: any, account: Account, characters: any[]): number[] => {
  const loggedIn = getBestActiveCharacter(characters);
  return (characters ?? []).map((_, turn) => {
    const taskIndex = week?.triplets?.[turn]?.task?.taskIndex;
    const quantity = n(getTaskQuantity(turn, taskIndex, account, characters, loggedIn));
    const half = n((weeklyBossesTasks as any[])[taskIndex]?.x1);
    return Math.max(0, quantity / Math.max(1, quantity + half));
  });
};

// game: WeeklyBoss("ChoiceQTY"), the number an option shows and adds
const choiceQty = (w: Keys, action: number, pow: number) => {
  const { x1, x2 } = actionOf(action) ?? {};
  const base = Math.pow(pow, n(x1)) * n(x2);
  const type = typeOf(action);
  if (type === ATTACK) return Math.floor((1 + (n(w.a) + n(w.b)) / 100) * (1 + n(w.e) / 100) * Math.pow(2, n(w.j)) * base);
  if (type === BUFF) return Math.floor(Math.pow(2, Math.min(1, n(w.i))) * base);
  return Math.floor(base);
};

const isLocked = (w: Keys, action: number) => (typeOf(action) === ATTACK && n(w.f) >= 1) || (typeOf(action) === BUFF && n(w.h) >= 1);

const options = (week: any, turn: number): number[] => week?.triplets?.[turn]?.actionIndices ?? [];
const bossOf = (week: any) => (weeklyBosses as any[])[week?.bossId];

// One click on an option, in the order the game applies it
const click = (state: State, week: any, nChars: number, pows: number[], option: number, cloudBonus: number) => {
  const { w } = state;
  const action = options(week, state.turn)[option];
  const type = typeOf(action);
  const pow = pows[state.turn] ?? 0;
  const value = choiceQty(w, action, pow);
  const hp = () => getFightBossHp(bossOf(week), state.skull);
  // DEAL_DAMAGE: adds to the tier's damage and uses up the "next damage doubled" portal
  const deal = (amount: number) => {
    state.dealt += amount;
    delete w.j;
  };
  w.f = Math.max(0, n(w.f) - 1);
  w.h = Math.max(0, n(w.h) - 1);
  if (type === ATTACK) {
    if (action === 11 && state.skull < MAX_SKULLS) state.dealt = 0.7 * hp();
    let damage = choiceQty(w, action, pow);
    if (action === 15) damage *= n(w.l);
    if (action === 19 && state.dealt >= 0.5 * hp()) damage *= 2;
    deal(damage);
    // Burn hits again at its stored amount, with no bonuses
    if (n(w.d) >= 1) deal(n(w.d));
    if (action === 4) w.d = n(w.d) + damage;
    if (action === 6) w.k = n(w.k) + damage;
    delete w.a;
  } else if (type === BUFF && n(w.k) >= 1) {
    // The ring hits on every BUFF at its stored amount
    deal(n(w.k));
  }
  const key = actionOf(action)?.x3;
  if (action !== 4 && action !== 6) {
    if (action === 7) w.f = n(w.f) + 1;
    else if (action === 9) w.f = n(w.f) + 2;
    // The fog's "+X% all damage" is never applied: it only locks the next character's BUFF
    else if (action === 10) w.h = n(w.h) + 1;
    else if (action === 12) w.i = 1;
    else if (action === 16) w.e = n(w.e) + choiceQty(w, action, pow) * n(w.m);
    else if (key && key !== 'none') w[key] = n(w[key]) + choiceQty(w, action, pow);
  }
  if (action === 14) {
    state.trophies += 1;
    state.pickups += 1;
  }
  let rewind: Rewind = null;
  if (action === 15 && n(w.l) >= 3) {
    state.turn -= 2;
    w.l = 0;
    rewind = 'back';
  } else if (action === 16 && n(w.m) >= 3) {
    state.turn -= 2;
    w.m = 0;
    rewind = 'back';
  } else if (action === 17 && n(w.n) >= 2) {
    state.turn = -1;
    w.n = -100;
    rewind = 'full';
  } else if (action === 20 && n(w.p) >= 9) {
    state.turn = -1;
    w.p = -100;
    rewind = 'full';
  } else if (action === 21 && n(w.q) >= 9) {
    state.turn = -1;
    w.q = -100;
    rewind = 'full';
  } else if (state.turn === nChars - 1 && n(w.o) > 0.5) {
    state.turn -= 1;
    w.o = n(w.o) - 1;
    rewind = 'joke';
  }
  // The cast counts move only when nothing rewound
  if (state.turn >= 0 && !rewind) {
    if (type === ATTACK) {
      w.l = n(w.l) + 1;
      w.p = n(w.p) + 1;
    } else if (type === BUFF) {
      w.m = n(w.m) + 1;
      w.q = n(w.q) + 1;
      if (action !== 12) w.i = 0;
    } else {
      w.n = n(w.n) + 1;
    }
  }
  const turn = state.turn;
  state.turn = Math.max(0, state.turn + 1);
  // Each tier beaten carries the damage past its HP into the next; a tier new this week drops trophies
  for (let pass = 0; pass < MAX_SKULLS; pass++) {
    if (state.dealt < hp() || state.skull >= MAX_SKULLS) break;
    state.dealt -= hp();
    state.skull += 1;
    if (state.best < state.skull) {
      state.best = state.skull;
      state.trophies += Math.floor(6 + (state.skull + 1) / 3 + cloudBonus);
    }
    if (state.skull === MAX_SKULLS) state.dealt = hp();
  }
  return { option, action, value, rewind, skull: state.skull, turn: turn < 0 ? 0 : turn };
};

const progress = (state: State, boss: any) => state.skull + (state.skull < MAX_SKULLS ? state.dealt / getFightBossHp(boss, state.skull) : 1);

const exp = (s: State) => Math.min(BUFF_CAP, n(s.w.c));
const dmg = (s: State) => Math.min(BUFF_CAP, n(s.w.g));
// The goal first, then skulls, then the rest, so a goal's tie never gives up something for nothing
const SCORES: Record<FightGoal, (state: State, boss: any) => number> = {
  skulls: (s, boss) => progress(s, boss) * 1e6 + exp(s) + 2 * dmg(s) + 5 * s.trophies,
  exp: (s, boss) => exp(s) * 1e4 + progress(s, boss) * 100 + s.trophies + dmg(s) / 100,
  dmg: (s, boss) => dmg(s) * 1e4 + progress(s, boss) * 100 + s.trophies + exp(s) / 100,
  trophies: (s, boss) => s.trophies * 1e4 + progress(s, boss) * 100 + (exp(s) + dmg(s)) / 100
};

const copy = (state: State): State => ({ ...state, w: { ...state.w } });
// The fight only ever writes these keys
const FIGHT_KEYS = 'abcdefghijklmnopq'.split('');
const stateKey = (state: State) => `${state.turn}|${state.dealt}|${state.skull}|${state.trophies}|${FIGHT_KEYS.map((k) => state.w[k] ?? '').join(',')}`;
const stepsOf = (state: State) => {
  const steps: FightStep[] = [];
  for (let link = state.trail; link; link = link.prev) steps.push(link.step);
  return steps.reverse();
};

// The whole fight, each click kept, from a fresh start. A beam: at each click every option of every kept state, the
// same states merged, the best by the goal's score kept. Every fight ends: rewinds work once or reset their count.
// It yields after each click's level, a few milliseconds of work, so a page can hand the browser back between them.
function* searchFight(week: any, nChars: number, pows: number[], cloudBonus: number, goal: FightGoal): Generator<void, State[]> {
  const score = SCORES[goal];
  const boss = bossOf(week);
  let front: State[] = [{ turn: 0, dealt: 0, skull: 0, best: 0, trophies: 0, pickups: 0, w: {}, trail: null }];
  const finished: State[] = [];
  while (front.length) {
    const next = new Map<string, State>();
    for (const state of front) {
      for (let option = 0; option < 3; option++) {
        const action = options(week, state.turn)[option];
        if (action === undefined || isLocked(state.w, action)) continue;
        const child = copy(state);
        const step = click(child, week, nChars, pows, option, cloudBonus);
        child.trail = { step: { ...step, turn: state.turn }, prev: state.trail };
        // All three locked: the skip button moves on and keeps the locks
        while (child.turn < nChars && options(week, child.turn).every((a) => isLocked(child.w, a))) {
          child.trail = { step: { turn: child.turn, skip: true }, prev: child.trail };
          child.turn += 1;
        }
        if (child.turn >= nChars) finished.push(child);
        else {
          const key = stateKey(child);
          if (!next.has(key)) next.set(key, child);
        }
      }
    }
    front = [...next.values()];
    if (front.length > BEAM_WIDTH) {
      // Each state scored once, not once per comparison
      front = front.map((state) => ({ state, value: score(state, boss) }))
        .sort((x, y) => y.value - x.value)
        .slice(0, BEAM_WIDTH)
        .map(({ state }) => state);
    }
    yield;
  }
  return finished;
}

// A route played from a fresh start: `picks` one per click, 1 top to 3 bottom; a turn with all three locked is skipped
export const playFightRoute = (week: any, pows: number[], picks: number[], cloudBonus = 0) => {
  const nChars = pows.length;
  const state: State = { turn: 0, dealt: 0, skull: 0, best: 0, trophies: 0, pickups: 0, w: {}, trail: null };
  for (const pick of picks) {
    while (state.turn < nChars && options(week, state.turn).every((a) => isLocked(state.w, a))) state.turn += 1;
    if (state.turn >= nChars) break;
    click(state, week, nChars, pows, pick - 1, cloudBonus);
  }
  return { turn: state.turn, dealt: state.dealt, skull: state.skull, trophies: state.trophies, keys: state.w };
};

const toRoute = (state: State): FightRoute => {
  const steps = stepsOf(state);
  return {
    skulls: state.skull,
    exp: Math.min(BUFF_CAP, n(state.w.c)),
    dmg: Math.min(BUFF_CAP, n(state.w.g)),
    trophies: state.trophies,
    pickups: state.pickups,
    clicks: steps.filter((step) => !step.skip).length,
    steps
  };
};

type Routes = Record<FightGoal, FightRoute>;

// The best route for each goal. Each goal's search keeps its own front, so the best for a goal is taken from what all
// four found: a search led by Class EXP can miss a route the skulls search found with as much Class EXP. Yields
// between levels as searchFight does; getFightRoutes runs it through in one go.
export function* searchFightRoutes(week: any, account: Account, characters: any[]): Generator<void, Routes | null> {
  const nChars = Math.min(characters?.length ?? 0, week?.triplets?.length ?? 0);
  const boss = bossOf(week);
  if (!boss || !nChars) return null;
  const pows = getFightPows(week, account, characters);
  const challenges = (account as any)?.equinox?.challenges;
  const cloudBonus = getCloudBonus(challenges, 1) + getCloudBonus(challenges, 11);
  const goals = Object.keys(SCORES) as FightGoal[];
  const finished: State[] = [];
  for (const goal of goals) finished.push(...(yield* searchFight(week, nChars, pows, cloudBonus, goal)));
  if (!finished.length) return null;
  return Object.fromEntries(goals.map((goal) => {
    const best = finished.reduce((top, state) => (SCORES[goal](state, boss) > SCORES[goal](top, boss) ? state : top));
    return [goal, toRoute(best)];
  })) as Routes;
}

export const getFightRoutes = (week: any, account: Account, characters: any[]): Routes | null => {
  const search = searchFightRoutes(week, account, characters);
  for (;;) {
    const { done, value } = search.next();
    if (done) return value;
  }
};

// The route as a line of numbers: one per click (1 top, 2 middle, 3 bottom) in groups of three, a line per pass
export const getRouteCode = (route: FightRoute): string[] => {
  const lines: string[] = [];
  let groups: string[] = [];
  let group: string[] = [];
  const MARKS: Record<string, string> = { full: ' (FR)', back: ' (R)', joke: ' (+1)' };
  const closeGroup = () => {
    if (group.length) groups.push(group.join(' '));
    group = [];
  };
  route.steps.forEach((step) => {
    if (step.skip) return;
    group.push(`${step.option + 1}${step.rewind ? MARKS[step.rewind] : ''}`);
    if (group.length === 3) closeGroup();
    if (step.rewind === 'full') {
      closeGroup();
      lines.push(groups.join(' - '));
      groups = [];
    }
  });
  closeGroup();
  if (groups.length) lines.push(groups.join(' - '));
  return lines;
};

// An option as the game words it, its { filled with the number it shows
export const getFightActionText = (action: number, value: number) => String(actionOf(action)?.description ?? '')
  .replace('{', String(value))
  .replace(/^\((ATTACK|BUFF|MISC)\)_?/, '');

export const getFightActionType = (action: number) => (['Attack', 'Buff', 'Misc'] as const)[typeOf(action)] ?? 'Misc';
