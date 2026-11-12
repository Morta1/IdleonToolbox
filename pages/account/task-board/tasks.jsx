import { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import Tabber from '../../../components/common/Tabber';
import { NextSeo } from 'next-seo';
import { Box, Stack } from '@mui/material';
import { cleanUnderscore, formatNum, getNextResetAt, worldsArray } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import Num from '@components/common/Num';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { getTasks, getWorldTaskLevels, isPlaceholderTask } from '@parsers/tasks';
import useTabIndex from '@hooks/useTabIndex';
import useNow from '@hooks/useNow';
import Timer from '@components/common/Timer';

const MINUTE = 60e3;
const TASKS_TOOLBAR = { hideCompleted: false };
// Slot 8 is the day's task: one rank, no merits (parsers/tasks.ts)
const DAILY_TASK = 8;
const sumOf = (list, key) => list.reduce((sum, item) => sum + (item?.[key] ?? 0), 0);
const big = (value) => formatGame(value ?? 0, 'TaskStuff.TaskPointREQ', { whole: true });

// The task board's own fill (N.js, the board's draw): every { is the rank's requirement in Big and every } the rank's
// filler1 entry (none on a Blank420q row). A maxed task shows filler2's third part instead, its { the stat; the day's
// task, once done, the game's own line.
const taskSentence = ({ index, description, filler1, filler2, requirement, stat, level, breakpoints }, maxed) => {
  if (index === DAILY_TASK && maxed) return 'You did it gamer! You did the thing, woo!';
  const closing = `${filler2 ?? ''}`.split('|')[2];
  if (maxed && closing) return cleanUnderscore(closing.replaceAll('{', () => big(stat)));
  // A maxed task with no closing line (Achievement Hunter) keeps its sentence at its last requirement
  const needs = maxed ? Number(breakpoints?.at(-1) ?? 0) : requirement;
  const filled = `${description ?? ''}`.replaceAll('{', () => big(needs));
  return cleanUnderscore(filler1 && filler1 !== 'Blank420q'
    ? filled.replaceAll('}', () => `${filler1}`.split('|')[level] ?? '')
    : filled);
};

const Tasks = () => {
  const { state } = useContext(AppContext);
  const [world] = useTabIndex(worldsArray);
  const failed = isSectionFailed(state?.account, 'tasks');
  const [view, setView, resetView] = useToolbarState('tasks', TASKS_TOOLBAR);
  const hideCompleted = !failed && view.hideCompleted;
  // A failed section draws the game's tasks at rank 0 (the parser's own empty save), with no progress or pay
  const tasksDescriptions = failed ? getTasks(undefined).tasksDescriptions : state?.account?.tasksDescriptions;
  const worlds = worldsArray.map((name, index) => ({ name, ...getWorldTaskLevels(tasksDescriptions, index) }));
  const ranks = (done, max) => (failed ? '-' : `${formatNum(done)} / ${formatNum(max)}`);
  // A done daily counts down to the game's daily reset (TimeAway.ShopRestock); the clock reads 0 until hydration
  const clock = useNow(MINUTE);
  const nextDailyReset = clock && !failed
    ? getNextResetAt(state?.account, Math.max(clock, state?.lastUpdated ?? 0), { fallbackSavedAt: state?.lastUpdated })
    : null;

  const worldTasks = (worlds[world]?.worldTasks ?? [])
    .map((task, index) => ({ ...task, index }))
    .filter((task) => !isPlaceholderTask(task));
  const shown = worldTasks.filter(({ level, maxLevel }) => !(hideCompleted && level >= maxLevel));

  const taskCard = (task) => {
    const daily = task.index === DAILY_TASK;
    const maxed = !failed && task.level >= task.maxLevel;
    const requirement = task.requirement ?? 0;
    // The board draws "Tap to Complete!" once the stat reaches the rank's requirement
    const ready = !failed && !maxed && requirement > 0 && (task.stat ?? 0) >= requirement;
    // Every claim pays task points (the Unlocks pool); only the 8 permanent tasks pay merits
    const pay = <Stack key={'pay'} direction={'row'} gap={0.5} alignItems={'center'}>
      {daily ? null : <>
        {formatGame(task.meritReward ?? 0, 'TaskStuff.MeritsGiven', { whole: true })}
        <GameIcon src={`etc/Merit_${world}.png`} size={16} alt={'Merits'}/>
        {' · '}
      </>}
      {`${formatGame(task.taskPointReward ?? 0, 'TaskStuff.TaskPointREQ', { whole: true })} Task points`}
    </Stack>;
    return <ItemCard key={task.index} icon={`data/TaskRank${failed ? 0 : task.level}.png`} title={cleanUnderscore(task.name)}
                     meta={daily ? 'Daily task' : undefined}
                     level={failed || daily ? undefined : { value: task.level, max: task.maxLevel }}
                     status={maxed ? 'maxed' : ready ? 'ready' : undefined}
                     statusLabel={ready ? 'Tap to complete' : undefined}
                     footer={failed ? null : <ItemCard.Facts rows={[[daily ? 'Completing pays' : 'Next rank pays', pay]]}/>}>
      {daily && maxed
        ? <ItemCard.Desc>
          <div>{taskSentence(task, maxed)}</div>
          {nextDailyReset ? <div><Timer type={'countdown'} date={nextDailyReset} prefix={'New daily task in '}
                                        placeholder={'New daily task ready'}/></div> : null}
        </ItemCard.Desc>
        : <ItemCard.Desc text={taskSentence(task, maxed)}/>}
      {/* The game caps the count at the requirement: "2M/2M", then "Tap to Complete!" */}
      {failed || maxed ? null : <ItemCard.Progress label={'Progress'}
                                                   percent={requirement > 0 ? Math.min(100, (task.stat / requirement) * 100) : 0}
                                                   value={<Num value={Math.min(task.stat ?? 0, requirement)} game={'TaskStuff.TaskPointREQ'} whole/>}
                                                   max={<Num value={requirement} game={'TaskStuff.TaskPointREQ'} whole/>}/>}
    </ItemCard>;
  };

  return (<>
    <NextSeo
      title="Tasks | Idleon Toolbox"
      description="Track your task board completion, rewards, and progression across all task categories in Legends of Idleon"
    />
    {failed ? <MissingData name={'Tasks'} failed atZero/> : null}
    <PageSummary>
      {worlds.map(({ name, totalLevels, maxLevels }) => <StatTile key={name} label={name} value={ranks(totalLevels, maxLevels)}/>)}
      <StatTile label={'Total'} value={ranks(sumOf(worlds, 'totalLevels'), sumOf(worlds, 'maxLevels'))}/>
    </PageSummary>
    <Tabber tabs={worldsArray} keepChildren>
      <Box>
        {failed ? null : <Toolbar state={view} defaults={TASKS_TOOLBAR} onChange={setView} onReset={resetView}
                                  total={worldTasks.length} shown={shown.length} noun={'tasks'}>
          <Toolbar.Filter name={'hideCompleted'} label={'Hide completed'}/>
        </Toolbar>}
        {shown.length ? <CardGrid size={'m'}>{shown.map(taskCard)}</CardGrid> : null}
      </Box>
    </Tabber>
  </>);
};

export default Tasks;
