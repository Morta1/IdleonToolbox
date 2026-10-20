import { GOAL_ROUTES } from '../routes';
import { spelunkingChapters } from '@website-data';
import { getSpelunkingChapterName } from '@parsers/world-7/spelunking';
import { stableText } from './names';

const CHAPTER_NAMES = Object.fromEntries(spelunkingChapters.map((_, chapter) => [String(chapter), getSpelunkingChapterName(chapter)]));

export default {
  system: 'spelunkChapter',
  label: 'Lore chapters',
  entryLabel: 'chapter bonus',
  scope: 'account',
  route: GOAL_ROUTES.spelunkChapter,
  groups: {
    label: 'Chapter',
    of: (row) => String(row.chapter),
    names: CHAPTER_NAMES
  },
  // the parser builds one array per chapter, one entry per bonus, straight from the catalog
  list: ({ account }) => (account?.spelunking?.chapters ?? []).flatMap((bonuses, chapter) =>
    (bonuses ?? []).map((row, pos) => ({
      ...row,
      chapter,
      pos,
      goalName: `${CHAPTER_NAMES[String(chapter)]}: ${stableText(row.name)}`
    }))),
  key: (row) => `${row.chapter}:${row.pos}`,
  name: (row) => row.goalName,
  icon: (row) => `data/Spelunking${row.chapter}`,
  metrics: {
    level: { label: 'Level', value: (row) => row.level ?? 0 }
  }
};
