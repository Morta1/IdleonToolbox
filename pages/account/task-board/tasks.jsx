import { useContext, useState } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import Tabber from '../../../components/common/Tabber';
import { NextSeo } from 'next-seo';
import { Card, CardContent, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix, worldsArray } from '@utility/helpers';
import ProgressBar from '../../../components/common/ProgressBar';
import { CardTitleAndValue } from '@components/common/styles';
import EmptyState from '@components/common/EmptyState';
import { getWorldTaskLevels, isPlaceholderTask } from '@parsers/tasks';
import useTabIndex from '@hooks/useTabIndex';

const Tasks = () => {
  const { state } = useContext(AppContext);
  const [world] = useTabIndex(worldsArray);
  const [hideCompleted, setHideCompleted] = useState(false);

  const { worldTasks, totalLevels, maxLevels } = getWorldTaskLevels(state?.account?.tasksDescriptions, world);
  const visibleTasks = worldTasks
    .map((task, index) => ({ ...task, index }))
    .filter((task) => !isPlaceholderTask(task))
    .filter(({ level, maxLevel }) => !(hideCompleted && level >= maxLevel));

  return (<>
    <NextSeo
      title="Tasks | Idleon Toolbox"
      description="Track your task board completion, rewards, and progression across all task categories in Legends of Idleon"
    />
    <Stack mb={3} direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Task levels'} value={`${totalLevels} / ${maxLevels}`}/>
      <FormControlLabel
        control={<Checkbox checked={hideCompleted}
                           onChange={(e) => setHideCompleted(e.target.checked)}/>}
        label={'Hide completed'}/>
    </Stack>
    <Tabber tabs={worldsArray} keepChildren>
      <Stack index={world} direction={'row'} flexWrap={'wrap'} gap={3} justifyContent={'center'}>
        {visibleTasks?.length === 0
          ? <EmptyState hideCompleted={hideCompleted && worldTasks.length > 0} label={'tasks'}/>
          : null}
        {visibleTasks?.map(({
                              stat,
                              level,
                              name,
                              description,
                              filler1,
                              filler2,
                              maxLevel,
                              requirement,
                              meritReward,
                              index
                            }) => {
          const req = requirement ?? 0;
          let desc;
          if (requirement === null) {
            desc = filler2.split('|').slice(-1)?.[0]?.replace(/{/, notateNumber(stat, 'Big'));
          } else {
            desc = description.replace(/{/g, notateNumber(requirement, 'Big')).replace(/}/g, filler1.split('|')?.[level])
          }
          const percent = stat / req * 100;
          return <Card key={'key' + index} sx={{ width: 400 }}>
            <CardContent sx={{
              border: level >= maxLevel ? '1px solid' : '',
              borderColor: level >= maxLevel ? 'success.light' : '',
              height: '100%'
            }}>
              <Stack direction={'row'} alignItems={'center'}>
                <img src={`${prefix}data/TaskRank${level}.png`} alt={'task-rank-' + level}/>
                <Typography>{cleanUnderscore(name)} ({level} / {maxLevel})</Typography>
              </Stack>
              <Typography sx={{ mb: 1 }}>{cleanUnderscore(desc)}</Typography>
              <Typography>{notateNumber(stat, 'Big')}{level <= maxLevel
                ? ` / ${notateNumber(req)}`
                : ''}</Typography>
              {level <= maxLevel ? <Stack direction={'row'} alignItems={'center'} gap={1}>
                <img src={`${prefix}etc/Merit_${world}.png`} alt={'cost_merit-' + world}/>
                <Typography>{meritReward}</Typography>
              </Stack> : null}
              {level <= maxLevel ? <ProgressBar
                percent={!isNaN(percent) && percent !== Infinity ? percent : 100}/> : null}
            </CardContent>
          </Card>
        })}
      </Stack>
    </Tabber>
  </>);
};

export default Tasks;
