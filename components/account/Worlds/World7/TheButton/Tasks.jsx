import React, { useContext } from 'react';
import { Box, Stack } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import { getCharacterTaskProgress } from '@parsers/world-7/button';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import Panel from '@components/common/cards/Panel';
import StatusText from '@components/common/StatusText';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { SummaryFailed } from '@components/common/cards/PageSummary';
import { PRESSES_PER_BONUS } from './Bonuses';

const TASKS_TOOLBAR = { cycle: 0, hideReady: false };

// The game's task line, whole (a requirement that scales by a power reads whole, as its sentence does). A save balance
// can arrive as a numeric string (Jade's "3.85e124"): it is a number, not ∞.
const amount = (value, key = 'Minehead.Button_REQ') => {
  const number = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(number) ? formatGame(number, key, { whole: true }) : '∞';
};

// A task's next five requirements, as a list: the first is the next time the task comes up
const upcoming = (task) => createBreakdown('Upcoming requirements', amount(task.futureRequirements[0]),
  flatLines(task.futureRequirements.map((requirement, index) => ({
    name: `Time ${index + 2}`,
    value: requirement,
    formatted: amount(requirement)
  }))),
  { combine: 'list' });

const Tasks = ({ taskSequence, bonuses, totalPresses, cycleLength, pressesIntoCurrentBonus }) => {
  const { state } = useContext(AppContext);
  const failed = useContext(SummaryFailed);
  const characters = state?.characters;
  const account = state?.account;
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('the-button-tasks', TASKS_TOOLBAR);

  const getBestProgress = (task) => {
    if (!characters?.length) return { progress: task.progress, bestChar: null };

    let bestProgress = task.progress;
    let bestChar = null;

    for (const char of characters) {
      const charValue = getCharacterTaskProgress(task.index, char, account, characters);
      if (charValue !== null) {
        if (charValue > bestProgress) {
          bestProgress = charValue;
          bestChar = char;
        } else if (bestChar === null) {
          bestProgress = charValue;
          bestChar = char;
        }
      }
    }

    return { progress: bestProgress, bestChar };
  };

  const cycles = cycleLength ? Math.ceil((taskSequence?.length ?? 0) / cycleLength) : 0;
  // At least Cycle 1, the default: a failed section has no tasks, and the Show select would read blank
  const cycleOptions = Array.from({ length: Math.max(cycles, 1) }, (_, index) => [index, `Cycle ${index + 1}`]);
  const cycle = Math.min(toolbar?.cycle ?? 0, Math.max(0, cycles - 1));
  const rows = taskSequence?.slice(cycle * cycleLength, (cycle + 1) * cycleLength) ?? [];
  // Each task's best progress over the characters, once per task: four of them read a character's drop rate or damage
  const best = Object.fromEntries([...new Set(rows.map(({ index }) => index))]
    .map((index) => [index, getBestProgress(rows.find((task) => task.index === index))]));
  const isReady = (task) => !failed && (best[task.index]?.progress ?? 0) >= task.requirement;
  const shownRows = toolbar?.hideReady ? rows.filter((task) => !isReady(task)) : rows;
  // The cycle's presses in runs of one bonus, in order
  const groups = shownRows.reduce((list, task) => (list.at(-1)?.bonusIdx === task.bonusIdx
    ? [...list.slice(0, -1), { ...list.at(-1), tasks: [...list.at(-1).tasks, task] }]
    : [...list, { bonusIdx: task.bonusIdx, tasks: [task] }]), []);
  // The run being filled now: the presses left of the current bonus's 5
  const currentRunEnd = (totalPresses ?? 0) + PRESSES_PER_BONUS - (pressesIntoCurrentBonus ?? 0);

  return <Box>
    <Toolbar state={toolbar} defaults={TASKS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={rows.length} shown={shownRows.length} noun={'tasks'}>
      <Toolbar.Show name={'cycle'} options={cycleOptions}/>
      <Toolbar.Filter name={'hideReady'} label={'Hide ready'}/>
    </Toolbar>
    <Stack gap={2}>
      {groups.map(({ bonusIdx, tasks }, groupIndex) => {
        const current = cycle === 0 && groupIndex === 0 && tasks[0]?.pressNumber < currentRunEnd;
        return <Panel key={`${cycle}-${tasks[0]?.pressNumber}`} title={bonuses?.[bonusIdx]?.name}
                      aside={current
                        ? <StatusText status={'active'}>
                          {`${formatNum(pressesIntoCurrentBonus ?? 0)}/${PRESSES_PER_BONUS}`}
                        </StatusText>
                        : null}>
          {tasks.map((task) => {
            const { progress, bestChar } = best[task.index] ?? {};
            const first = !failed && cycle === 0 && task.pressNumber === rows[0]?.pressNumber;
            const sub = [first ? 'Next press' : null, bestChar ? `Best: ${cleanUnderscore(bestChar.name)}` : null].filter(Boolean).join(' · ');
            return <Panel.Row key={task.pressNumber} name={task.description} sub={sub || undefined}
                              value={isReady(task)
                                ? <StatusText status={'ready'}/>
                                : `${amount(progress, 'Minehead.Button_uHave')} / ${amount(task.requirement)}`}
                              valueSub={task.futureRequirements?.length
                                ? <Breakdown asValue data={upcoming(task)} title={task.description}>
                                  {`Next ${amount(task.futureRequirements[0])}`}
                                </Breakdown>
                                : undefined}/>;
          })}
        </Panel>;
      })}
    </Stack>
  </Box>;
};

export default Tasks;
