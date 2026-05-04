import { notateNumber, prefix } from '@utility/helpers';
import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import { capitalize, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import Tooltip from '../Tooltip';
import React from 'react';
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
  return colorMap[rank] || 'white';
}

const isTopRank = (rank) => rank === 1 || rank === 2 || rank === 3;

const globalSkills = ['gaming', 'sailing', 'breeding', 'farming', 'summoning'].toSimpleObject();

const levelBadgeSx = {
  '& > .MuiBadge-badge': {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    color: 'common.white',
    fontSize: 12,
    fontWeight: 700,
    minWidth: 14,
    height: 14,
    padding: '0 4px',
    borderRadius: '4px'
  }
};

const rankBadgeSx = (rank) => ({
  '& > .MuiBadge-badge': {
    backgroundColor: getRankColor(rank),
    color: 'common.black',
    fontSize: 10,
    fontWeight: 700,
    minWidth: 16,
    width: 16,
    height: 16,
    padding: 0,
    borderRadius: '50%'
  }
});

const skillIconStyle = {
  width: 38,
  height: 36,
  display: 'block',
  imageRendering: 'pixelated'
};

const normalizeBreakdown = (breakdown) => {
  if (!breakdown || Array.isArray(breakdown)) return breakdown;
  return breakdown?.categories?.flatMap((category) => [
    ...(category?.sources ?? []),
    ...(category?.subSections?.flatMap((sub) => sub?.sources ?? []) ?? [])
  ]) ?? [];
};
const Skills = ({ skills, charName, account, characters, character, showSkillsRankOneOnly }) => {
  const hasRankOne = Object.keys(skills || {})?.filter((skillName) => skills[skillName]?.rank === 1)?.length > 0;
  const playerInfo = getMaxDamage(character, characters, account);
  if (showSkillsRankOneOnly && !hasRankOne) return null;

  return <Stack>
    <Typography variant={'h5'}>Skills</Typography>
    <Card>
      <CardContent>
        <Box sx={{
          display: showSkillsRankOneOnly ? 'flex' : 'grid',
          gridAutoFlow: 'row',
          gap: showSkillsRankOneOnly ? '24px' : '8px',
          ...(showSkillsRankOneOnly ? {
            maxWidth: 500,
            flexWrap: 'wrap'
          } : {}),
          gridTemplateColumns: { xs: showSkillsRankOneOnly ? 'fit-content' : `repeat(3, minmax(45px, 60px))` },
          justifyContent: 'center'
        }}>

          {Object.keys(skills || {})?.map((skillName, index) => {
            const { level, rank, icon } = skills[skillName];
            if (skillName === 'character' || (showSkillsRankOneOnly && rank !== 1)) return null;
            const expMulti = getSkillExpMulti(skillName, character, characters, account, playerInfo);
            const showRankBadge = !globalSkills[skillName];
            return <Box key={index} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: '4px' }}>
              <Tooltip title={<SkillTooltip {...skills?.[skillName]} skillName={skillName} charName={charName}
                                            expMulti={expMulti}/>}>
                <Badge
                  badgeContent={level}
                  max={999999}
                  overlap="rectangular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  sx={levelBadgeSx}
                >
                  <Badge
                    badgeContent={rank}
                    invisible={!showRankBadge}
                    overlap="rectangular"
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                    sx={rankBadgeSx(rank)}
                  >
                    <img src={`${prefix}data/${icon}.png`} style={skillIconStyle} alt=""/>
                  </Badge>
                </Badge>
              </Tooltip>
            </Box>;
          })}
        </Box>
      </CardContent>
    </Card>
  </Stack>
};

const SkillTooltip = ({ exp, expReq, expMulti, charName, skillName, level, rank }) => {
  const percent = exp / expReq * 100;
  return <Stack gap={.5}>
    <Typography variant={'h5'} fontWeight={'bold'}>{charName}</Typography>
    <Typography variant={'body1'}>{capitalize(skillName)} <Typography
      variant={'body1'}
      component={'span'}>(Lv. {level})</Typography></Typography>
    {!globalSkills[skillName] && rank != null && <Typography variant={'body2'}
      sx={{ color: getRankColor(rank), fontWeight: isTopRank(rank) ? 'bold' : 400 }}>
      Account rank: {rank}
    </Typography>}
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
      <Breakdown breakdown={normalizeBreakdown(expMulti?.breakdown)} title={'Exp multi breakdown'}
                 notation={'MultiplierInfo'}/>
    </>}

  </Stack>
}


export default Skills;
