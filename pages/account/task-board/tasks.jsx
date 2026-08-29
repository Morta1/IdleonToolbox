import { useContext, useState } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import Tabber from '../../../components/common/Tabber';
import { NextSeo } from 'next-seo';
import { Card, CardContent, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix, worldsArray } from '@utility/helpers';
import ProgressBar from '../../../components/common/ProgressBar';
import { CardTitleAndValue } from '@components/common/styles';
import EmptyState from '@components/common/EmptyState';
import useTabIndex from '@hooks/useTabIndex';

const Tasks = () => {
  const { state } = useContext(AppContext);
  const [world] = useTabIndex(worldsArray);
  const [hideCompleted, setHideCompleted] = useState(false);

  const worldTasks = state?.account?.tasksDescriptions?.[world]?.slice(0, 9) ?? [];
  // The 9th task (index 8) is a repeatable one with a single breakpoint, so it counts as 1 level.
  const totalLevels = worldTasks.reduce((sum, { level }) => sum + level, 0);
  const maxLevels = worldTasks.reduce((sum, { breakpoints }, index) => sum + (index === 8 ? 1 : breakpoints?.length ?? 0), 0);
  const visibleTasks = worldTasks
    .map((task, index) => ({ ...task, index }))
    .filter(({ level, breakpoints, index }) => !(hideCompleted && level >= (index === 8 ? 1 : breakpoints?.length)));

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
                              breakpoints,
                              meritReward,
                              index
                            }) => {
          const req = (index === 8 ? breakpoints?.[0] : breakpoints?.[level]) ?? 0;
          let desc;
          if (level === breakpoints?.length && index !== 8) {
            desc = filler2.split('|').slice(-1)?.[0]?.replace(/{/, notateNumber(stat, 'Big'));
          } else {
            desc = description.replace(/{/g, notateNumber(index === 8
              ? breakpoints?.[0]
              : breakpoints?.[level], 'Big')).replace(/}/g, filler1.split('|')?.[level])
          }
          const percent = stat / req * 100;
          return <Card key={'key' + index} sx={{ width: 400 }}>
            <CardContent sx={{
              border: level >= breakpoints?.length ? '1px solid' : '',
              borderColor: level >= breakpoints?.length ? 'success.light' : '',
              height: '100%'
            }}>
              <Stack direction={'row'} alignItems={'center'}>
                <img src={`${prefix}data/TaskRank${level}.png`} alt={'task-rank-' + level}/>
                <Typography>{cleanUnderscore(name)} ({level} / {index === 8 ? 1 : breakpoints?.length})</Typography>
              </Stack>
              <Typography sx={{ mb: 1 }}>{cleanUnderscore(desc)}</Typography>
              <Typography>{notateNumber(stat, 'Big')}{level <= breakpoints.length
                ? ` / ${notateNumber(req)}`
                : ''}</Typography>
              {level <= breakpoints?.length ? <Stack direction={'row'} alignItems={'center'} gap={1}>
                <img src={`${prefix}etc/Merit_${world}.png`} alt={'cost_merit-' + world}/>
                <Typography>{index === 8 ? 0 : meritReward}</Typography>
              </Stack> : null}
              {level <= breakpoints?.length ? <ProgressBar
                percent={!isNaN(percent) && percent !== Infinity ? percent : 100}/> : null}
            </CardContent>
          </Card>
        })}
      </Stack>
    </Tabber>
  </>);
};

export default Tasks;
