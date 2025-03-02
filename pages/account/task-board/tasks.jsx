import { useContext, useState } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import Tabber from '../../../components/common/Tabber';
import { NextSeo } from 'next-seo';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix, worldsArray } from '../../../utility/helpers';
import ProgressBar from '../../../components/common/ProgressBar';

const Tasks = () => {
  const { state } = useContext(AppContext);
  const [world, setWorld] = useState(0);

  const handleWorldChange = (world) => {
    setWorld(world);
  }

  return (<>
    <NextSeo
      title="Tasks | Idleon Toolbox"
      description="Keep track of your tasks progression"
    />
    <Tabber tabs={worldsArray} onTabChange={handleWorldChange}>
      <Stack index={world} direction={'row'} flexWrap={'wrap'} gap={3} justifyContent={'center'}>
        {state?.account?.tasksDescriptions?.[world]?.map(({
                                                            stat,
                                                            level,
                                                            name,
                                                            description,
                                                            filler1,
                                                            filler2,
                                                            breakpoints,
                                                            meritReward
                                                          }, index) => {
          if (index >= 9) return null;
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
