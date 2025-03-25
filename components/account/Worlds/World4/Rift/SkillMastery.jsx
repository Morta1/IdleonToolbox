import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '../../../../../utility/helpers';
import styled from '@emotion/styled';
import { getSkillRankColor } from '../../../../../parsers/misc';
import Tooltip from '@components/Tooltip';
import { TitleAndValue } from '@components/common/styles';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const defaultBonuses = [
  '+25%_{_EXP_GAIN',
  '+10%_{_EFFICIENCY',
  '+5%_TOTAL_DAMAGE',
  '+10%_ALL_SKILL_EXP',
  '+5%_ALL_SKILL_EFFICIENCY',
  '+1%_PRINTER_OUTPUT',
  '+25%_ALL_SKILL_EXP'
];

const specialBonuses = {
  mining: 'ALL_MINING_CARDS_ARE_NOW_PASSIVE',
  fishing: 'ALL_FISHING_CARDS_ARE_NOW_PASSIVE',
  chopping: 'ALL_CHOPPING_CARDS_ARE_NOW_PASSIVE',
  catching: 'ALL_CATCHING_CARDS_ARE_NOW_PASSIVE',
  trapping: 'ALL_TRAPPING_CARDS_ARE_NOW_PASSIVE',
  worship: 'ALL_WORSHIP_CARDS_ARE_NOW_PASSIVE',
  smithing: '+25%_FORGE_ORE_CAPACITY',
  alchemy: '+5%_ALL_LIQUID_CAP',
  construction: '+15%_SHRINE_LV_UP_RATE',
  breeding: '+15%_EGG_INCUBATION_SPEED',
  sailing: '+15%_BOAT_SAILING_SPEED',
  divinity: '+15%_DIVINITY_PTS_GAINED',
  gaming: '1.15X_GAMING_BITS_GAINED',
  sneaking: '1.10X_JADE_COIN_GAIN',
  farming: '1.15X_CROP_EVO_CHANCE',
  summoning: '1.10X_ESSENCE_GAIN'
}

const thresholds = [0, 0, 300, 400, 500, 750, 1000];
const SkillMastery = ({ totalSkillsLevels, characters }) => {
  return <>
    <Typography variant={'h5'}>Skill level thresholds</Typography>
    <Stack sx={{ my: 2 }} direction={'row'} gap={2}>
      {thresholds?.map((threshold, index) => threshold > 0 ? <Card key={index} sx={{ width: 100 }}>
        <CardContent>
          <Typography color={getSkillRankColor(threshold)}>{threshold ? `Lv. ${threshold} ` : ''}</Typography>
        </CardContent>
      </Card> : null)}
    </Stack>

    <Typography variant={'h5'}>Skills</Typography>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {Object.entries(totalSkillsLevels)?.map(([skillName, { icon, level, rank, color }], index) => {
        if (skillName === 'character') return;
        return <Card key={`${skillName}-${index}`} sx={{
          width: 250,
          minHeight: 200,
          display: 'flex'
        }}>
          <CardContent sx={{ width: 300 }}>
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              <SkillIcon src={`${prefix}data/${icon}.png`}
                         alt=""/>
              <Stack>
                <Typography>{cleanUnderscore(skillName.capitalize())}</Typography>
                <Typography variant={'caption'} component={'span'} sx={{ color, fontWeight: 'bold' }}>Total
                  Level {level}</Typography>
              </Stack>
              <Tooltip  title={<SkillBreakdown characters={characters} skillName={skillName}/>}>
                <IconInfoCircleFilled style={{ marginLeft: 'auto' }} size={18}/>
              </Tooltip>
            </Stack>
            <Divider sx={{ my: 1 }}/>
            <Stack gap={1}>
              {defaultBonuses?.map((bonus, bonusIndex) => <Typography
                sx={{ opacity: bonusIndex < rank ? 1 : .6 }}
                key={`${skillName}-bonus-${bonusIndex}`}>{cleanUnderscore(
                (index < 12 ? bonusIndex === 2 : bonusIndex === 1) && specialBonuses?.[skillName] && index !== 11
                  ? specialBonuses?.[skillName].toLowerCase().capitalizeAll()
                  : index === 11 && bonusIndex === 1
                    ? specialBonuses?.[skillName].toLowerCase().capitalizeAll()
                    : bonus.replace('{', skillName).toLowerCase().capitalizeAll())}</Typography>)}
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

const SkillBreakdown = ({ characters, skillName }) => {
  const charactersSkills = characters.reduce((res, char) => ([
    ...res,
    { name: char?.name, level: char?.skillsInfo?.[skillName]?.level }
  ]), [])
  return <Stack>
    {charactersSkills?.map(({ name, level }) => {
      return <TitleAndValue key={name} title={name} value={`Lv. ${level}`}/>
    })}
  </Stack>
}

const SkillIcon = styled.img`

`

export default SkillMastery;
