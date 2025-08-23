import { notateNumber, prefix } from '../../utility/helpers';
import Box from '@mui/material/Box';
import { capitalize, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import Tooltip from '../Tooltip';
import React, { useMemo } from 'react';
import ProgressBar from '../common/ProgressBar';
import { getSkillExpMulti } from '@parsers/character';
import { Breakdown } from '@components/common/styles';
import { getMaxDamage } from '@parsers/damage';

const getRankColor = (rank) => {
  const colorMap = {
    1: 'success.light',
    2: 'warning.light',
    3: 'secondary.main'
  }
  return colorMap[rank];
}

const globalSkills = ['gaming', 'sailing', 'breeding', 'farming', 'summoning'].toSimpleObject();
const Skills = ({ skills, charName, account, characters, character, showSkillsRankOneOnly }) => {
  const hasRankOne = Object.keys(skills || {})?.filter((skillName) => skills[skillName]?.rank === 1)?.length > 0;
  const playerInfo = useMemo(() => getMaxDamage(character, characters, account), [character, account]);
  if (showSkillsRankOneOnly && !hasRankOne) return null;

  return <Stack>
    <Typography variant={'h5'}>Skills</Typography>
    <Card>
      <CardContent>
        <Box sx={{
          display: showSkillsRankOneOnly ? 'flex' : 'grid',
          gridAutoFlow: 'column',
          gap: showSkillsRankOneOnly ? '24px' : 'none',
          ...(showSkillsRankOneOnly ? {
            maxWidth: 500,
            flexWrap: 'wrap'
          } : {}),
          gridTemplateColumns: { xs: showSkillsRankOneOnly ? 'fit-content' : `repeat(5, minmax(45px, 100px))` },
          gridTemplateRows: showSkillsRankOneOnly ? null : { xs: 'repeat(3, minmax(45px, 100px))' },
          justifyContent: 'center'
        }}>

          {Object.keys(skills || {})?.map((skillName, index) => {
            const { level, rank, icon } = skills[skillName];
            if (skillName === 'character' || (showSkillsRankOneOnly && rank !== 1)) return null;
            const expMulti = getSkillExpMulti(skillName, character, characters, account, playerInfo);
            return <Box key={index}>
              <Tooltip title={<SkillTooltip {...skills?.[skillName]} skillName={skillName} charName={charName}
                                            expMulti={expMulti}/>}>
                <img src={`${prefix}data/${icon}.png`} style={{ width: 38, height: 36 }} alt=""/>
              </Tooltip>
              <Typography>Lv {level}</Typography>
              {globalSkills[skillName] ? null : <Tooltip title={'Rank across the account'}>
                <Typography
                  sx={{
                    width: 'fit-content',
                    color: getRankColor(rank),
                    fontWeight: (rank === 1 || rank === 2 || rank === 3) ? 'bold' : '400'
                  }}>R: {rank}</Typography>
              </Tooltip>}
            </Box>;
          })}
        </Box>
      </CardContent>
    </Card>
  </Stack>
};

const SkillTooltip = ({ exp, expReq, expMulti, charName, skillName, level }) => {
  const percent = exp / expReq * 100;
  return <Stack gap={.5}>
    <Typography variant={'h5'} fontWeight={'bold'}>{charName}</Typography>
    <Typography variant={'body1'}>{capitalize(skillName)} <Typography
      variant={'body1'}
      component={'span'}>(Lv. {level})</Typography></Typography>
    <ProgressBar percent={percent} bgColor={'#f3dd4c'}/>
    <Typography variant={'body1'}>{notateNumber(exp, 'Big')} / {notateNumber(expReq, 'Big')}</Typography>

    {expMulti && <>
      <Divider sx={{ my: 1 }}/>
      <Typography variant={'body1'}>Exp
        multi: {expMulti?.formattedValue || notateNumber(expMulti?.value, 'MultiplierInfo') || 0}x</Typography>
      {skillName === 'sneaking' ? <>
        <Divider sx={{ my: 1 }}/>
        <Typography variant={'caption'}>* inaccurate</Typography>
      </> : null}
      <Divider sx={{ my: 1 }}/>
      <Breakdown breakdown={expMulti?.breakdown} title={'Exp multi breakdown'} notation={'MultiplierInfo'}/>
    </>}

  </Stack>
}


export default Skills;
