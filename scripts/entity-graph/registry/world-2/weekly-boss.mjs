import { gameTable } from '../data.mjs';

// A weekly boss is a fixed fight: no level, no cost. What varies (which boss, damage, power) is per
// week or per account, so the page lists what every player meets: the health bars and the tasks.

// "Mining_LV_of_{" -> "Mining LV", "{_Digits_of_Ram_Kills" -> "Digits of Ram Kills". Field values
// render as written, so they are spaced here.
// UPKEEP: the "_of_{" and "{_" shapes of WeeklyTASK statText.
const taskLabel = (task) => String(task?.statText || '').replace(/_?of_\{$/, '').replace(/^\{_/, '').replace(/_/g, ' ');

const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

// The bar-break loop's count, the weeklyBossBars table (`N > OptionsListAccount[187]` beside WeeklyBoss("BossHPmax")).
// No table, no health bars.
const healthBars = (entry, data) => {
  const bars = gameTable(data, 'weeklyBossBars')?.bars;
  return bars == null ? null : Array.from({ length: bars }, (_, n) => fmt(entry.x4 * Math.pow(entry.x5, n))).join(' / ');
};

const tasksOf = (entry, data) => [entry.x1, entry.x2, entry.x3].map((id) => data.weeklyBossesTasks?.[id]);

export default {
  kind: 'weeklyboss',
  section: 'weeklyBosses',
  key: (entry) => entry.bossName,
  name: (entry) => entry.bossName,
  icon: (entry) => `/etc/${entry.bossName}.png`,
  fallbackIcon: '/etc/SWR_Containment.png',
  describe: (entry, index, data) => `Each_turn_asks_for_one_of:_${tasksOf(entry, data).map(taskLabel).join(',_')}.`,
  fields: (entry, index, data) => [
    { label: 'Health bars', value: healthBars(entry, data) },
    ...tasksOf(entry, data).map((task, i) => ({ label: `Task ${i + 1}`, value: `${taskLabel(task)} (half power at ${fmt(task.x1)})` }))
  ]
};
