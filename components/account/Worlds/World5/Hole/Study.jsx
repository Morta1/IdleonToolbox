import React, { useState, useMemo } from 'react';
import { Card, CardContent, Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { cleanUnderscore, commaNotation, msToDate } from '@utility/helpers';
import { ExpRateCard } from '@components/account/Worlds/World5/Hole/commons';

const colors = {
  0: '#c471d2',
  1: 'warning.light',
  2: 'success.light'
}

const Study = ({ hole }) => {
  const [, , , , study] = hole?.villagers || [];
  const [sortByTime, setSortByTime] = useState(false);

  const sortedStudies = useMemo(() => {
    if (!hole?.studies?.studies) return [];
    return [...hole.studies.studies].sort((a, b) => {
      if (!sortByTime) return 0;
      const aTime = (a.req - a.progress) / hole?.studies?.studyPerHour;
      const bTime = (b.req - b.progress) / hole?.studies?.studyPerHour;
      return aTime - bTime;
    });
  }, [hole, sortByTime]);

  return <>
    <Stack mb={1} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Study rate'} value={`${commaNotation(hole?.studies?.studyPerHour)} / hr` || '0'}
                         icon={'etc/Study_Rate.png'}
                         imgStyle={{ width: 22, height: 22 }}/>
      <CardTitleAndValue title={'Level'} value={study?.level}/>
      <CardTitleAndValue title={'Exp'} value={`${study?.exp} / ${study?.expReq}`}/>
      <ExpRateCard title={'Exp rate'} expRate={study?.expRate}/>
      <CardTitleAndValue title={'Time to level'}
                         value={study?.timeLeft >= 0 && study?.expRate?.value > 0 ? msToDate(study?.timeLeft) : '0'}/>
      <CardTitleAndValue title={'Opals invested'} value={study?.opalInvested || '0'} icon={'data/Opal.png'}
                         imgStyle={{ width: 22, height: 22 }}/>
    </Stack>
    <Divider/>
    <Stack>
      <CardTitleAndValue title={'Sort'}
                         value={<FormControlLabel
                           control={<Checkbox checked={sortByTime} onChange={() => setSortByTime(!sortByTime)}/>}
                           label="Sort by time"/>}/>
    </Stack>
    <Divider sx={{ mb: 3 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {sortedStudies.map(({ name, description, level, active, progress, req, listIndex }, index) => {
        const nextLv = (req - progress) / hole?.studies?.studyPerHour * 1000 * 3600;
        return <Card key={`bonus-${index}`}>
          <CardContent sx={{ width: 300, height: 250 }}>
            <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
              <Typography color={colors?.[listIndex]} variant={'body1'}
                          sx={{ fontWeight: 'bold' }}>{cleanUnderscore(name)} (Lv. {level})</Typography>
              {active ? <Typography color={'success.light'} variant={'caption'}>ACTIVE</Typography> : null}
            </Stack>
            <Typography mt={2}>{cleanUnderscore(description)}</Typography>
            <Stack mt={2} gap={1}>
              <Typography variant={'body2'}>Progress: {commaNotation(progress)} / {commaNotation(req)}</Typography>
              <Typography variant={'body2'}>Next lv: {nextLv < 0 ? 'Ready' : msToDate(nextLv)}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Study;
