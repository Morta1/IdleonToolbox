import React from 'react';
import { Box, Stack } from '@mui/material';
import { cleanUnderscore, findNameCombination } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const TASKS_TOOLBAR = { done: false };

// The game writes its sentences in capitals: lower them, then capitalize each sentence's first letter (after a
// sentence end or an "@" line break), where a plain capitalize reached only the first
export const sentenceCase = (text) => String(text ?? '').toLowerCase()
  .replace(/(^|[.!?@]\s*)([a-z])/g, (_, before, letter) => `${before}${letter.toUpperCase()}`);

const Tasks = ({ list, currentRift = 0, currentProgress, characters, chars }) => {
  const finishedCharacters = findNameCombination(characters, chars);
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('rift-tasks', TASKS_TOOLBAR);
  const tasks = (list ?? []).map((entry, riftIndex) => ({ ...entry, riftIndex }));
  const shown = toolbar?.done ? tasks : tasks.filter(({ riftIndex }) => riftIndex >= currentRift);

  return <Box>
    <Toolbar state={toolbar} defaults={TASKS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={tasks.length} shown={shown.length} noun={'tasks'}>
      <Toolbar.Filter name={'done'} label={'Show done'}/>
    </Toolbar>
    <CardGrid size={'m'}>
      {shown.map(({ monsterName, task, icon, riftIndex }) => {
        const isCurrent = currentRift === riftIndex;
        // The current task fills its { with your progress (RiftStuff.Task); the others show their first sentence
        const taskText = isCurrent
          ? cleanUnderscore(task?.replace('{', formatGame(Number(currentProgress) || 0, 'RiftStuff.Task')))
          : cleanUnderscore(task?.split('.')?.[0]);
        return <ItemCard key={`${monsterName}-${riftIndex}`} icon={`data/${icon}.png`} iconAlt={''}
                         title={cleanUnderscore(monsterName)} meta={`Rift ${riftIndex + 1}`} dimmed={riftIndex > currentRift}
                         status={riftIndex < currentRift ? 'done' : isCurrent ? 'active' : undefined}
                         statusLabel={riftIndex < currentRift ? 'Done' : isCurrent ? 'Current' : undefined}>
          <ItemCard.Desc text={sentenceCase(taskText)}/>
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
