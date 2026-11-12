import React from 'react';
import { Box, Stack } from '@mui/material';
import { cleanUnderscore, findNameCombination, formatNum } from '@utility/helpers';
import { classes } from '@website-data';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import Toolbar from '@components/common/Toolbar';
import { getRiftTaskGoal } from '@parsers/world-4/rift';
import useToolbarState from '@hooks/useToolbarState';

const TASKS_TOOLBAR = { done: false };

// The game writes its sentences in capitals: lower them, then capitalize each sentence's first letter (after a
// sentence end or an "@" line break), where a plain capitalize reached only the first
export const sentenceCase = (text) => String(text ?? '').toLowerCase()
  .replace(/(^|[.!?@]\s*)([a-z])/g, (_, before, letter) => `${before}${letter.toUpperCase()}`);

// The class and skill names as the game data writes them (Divine_Knight, Mining), the longest first so a two-word
// name is put back whole
const GAME_NAMES = [...new Set((classes ?? []).filter((name) => /^[A-Z][a-z]/.test(name) && !/\d|^(Nope|Filler)$/.test(name))
  .map((name) => cleanUnderscore(name)))].toSorted((a, b) => b.length - a.length);
const NAME_PATTERN = new RegExp(`\\b(${GAME_NAMES.join('|')})\\b`, 'gi');
const gameName = Object.fromEntries(GAME_NAMES.map((name) => [name.toLowerCase(), name]));

// A task sentence: sentence case, then the class and skill names in the game data's capitals, AFK upper case and each
// number in the amount kind ("Kill 200,000 monsters while AFK"). The progress fills its { last, so none of that
// touches it.
const taskSentence = (text, progress) => sentenceCase(text)
  .replace(NAME_PATTERN, (match) => gameName[match.toLowerCase()] ?? match)
  .replace(/\bafk\b/gi, 'AFK')
  .replace(/\d+/g, (digits) => formatNum(Number(digits)))
  .replace('{', progress ?? '{');

const Tasks = ({ list, currentRift = 0, currentProgress, characters, chars }) => {
  const finishedCharacters = findNameCombination(characters, chars);
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('rift-tasks', TASKS_TOOLBAR);
  const tasks = (list ?? []).map((entry, riftIndex) => ({ ...entry, riftIndex }));
  const shown = toolbar?.done ? tasks : tasks.filter(({ riftIndex }) => riftIndex >= currentRift);

  return <Box>
    <Toolbar state={toolbar} defaults={TASKS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={tasks.length} shown={shown.length} noun={'tasks'}>
      <Toolbar.Filter name={'done'} label={'Show done'} display/>
    </Toolbar>
    <CardGrid size={'m'}>
      {shown.map(({ monsterName, task, icon, riftIndex }) => {
        const isCurrent = currentRift === riftIndex;
        // The current task fills its { with your progress; the others show their first sentence
        const taskText = isCurrent
          ? taskSentence(cleanUnderscore(task), formatGame(Number(currentProgress) || 0, 'Save.RiftProgress', { whole: true }))
          : taskSentence(cleanUnderscore(task?.split('.')?.[0]));
        return <ItemCard key={`${monsterName}-${riftIndex}`} icon={`data/${icon}.png`} iconAlt={''}
                         title={cleanUnderscore(monsterName)} meta={`Rift ${riftIndex + 1}`} dimmed={riftIndex > currentRift}
                         status={riftIndex < currentRift ? 'done' : isCurrent ? 'active' : undefined}
                         statusLabel={riftIndex < currentRift ? 'Done' : isCurrent ? 'Current' : undefined}>
          <ItemCard.Desc text={taskText}/>
          {isCurrent && getRiftTaskGoal(task) !== null ? <ItemCard.Progress label={'Progress'}
                                                                            value={formatGame(Number(currentProgress) || 0, 'Save.RiftProgress', { whole: true })}
                                                                            max={formatNum(getRiftTaskGoal(task))}
                                                                            percent={Math.min(100, 100 * (Number(currentProgress) || 0) / getRiftTaskGoal(task))}/> : null}
          {isCurrent && finishedCharacters?.length ? <ItemCard.Section label={'Done by'}>
            <Stack gap={0.5}>
              {finishedCharacters.map(({ name, classIndex }, index) => <Box key={`${name}-${index}`} component={'span'}
                                                                              sx={{ typography: 'body2', '& > :first-of-type': { mr: 1 } }}>
                <GameIcon src={`data/ClassIcons${classIndex}.png`} size={24} alt={''}/>{name}
              </Box>)}
            </Stack>
          </ItemCard.Section> : null}
        </ItemCard>
      })}
    </CardGrid>
  </Box>
};

export default Tasks;
