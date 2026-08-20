import React from 'react';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import styled from '@emotion/styled';
import { getSkillRankColor } from '../../../../../parsers/misc';
import Tooltip from '@components/Tooltip';
import { TitleAndValue } from '@components/common/styles';
import { IconInfoCircleFilled } from '@tabler/icons-react';

// Bonus texts mirror the game's own skill mastery panel (N.js _GenINFO[95..98])
const defaultBonuses = [
  '+25%_{_EXP_GAIN',
  '+10%_{_EFFICIENCY',
  '+5%_TOTAL_DAMAGE',
  '+10%_ALL_SKILL_EXP',
  '+5%_ALL_SKILL_EFFICIENCY',
  '+1%_PRINTER_OUTPUT',
  '+25%_ALL_SKILL_EXP'
];

// _GenINFO[98] - always replaces the 2nd bonus, and only for these skills
const specialBonuses = {
  smithing: '+25%_FORGE_ORE_CAPACITY',
  alchemy: '+5%_ALL_LIQUID_CAP',
  construction: '+15%_SHRINE_LV_UP_RATE',
  breeding: '+15%_EGG_INCUBATION_SPEED',
  sailing: '+15%_BOAT_SAILING_SPEED',
  divinity: '+15%_DIVINITY_PTS_GAINED',
  gaming: '1.15X_GAMING_BITS_GAINED',
  farming: '1.15X_CROP_EVO_CHANCE',
  sneaking: '1.10X_JADE_COIN_GAIN',
  summoning: '1.10X_ESSENCE_GAIN'
}

// These skills trade their 3rd bonus for passive cards instead
const passiveCardSkills = ['mining', 'chopping', 'fishing', 'catching', 'trapping', 'worship'];

const extraSpecialBonuses = {
  spelunking: [
    '+25%_SPELUNKING_EXP',
    '+30%_SPELUNKING_EFFICIENCY',
    'ALL_SPELUNKING_CARDS_ARE_NOW_PASSIVE',
    '+15_MAX_STAMINA_FOR_EVERYONE',
    '+3_DAILY_PAGE_READS',
    '+10%_STAMINA_REGEN_RATE',
    '1.50X_ALL_AMBER_GAIN'
  ]
}

// research has no rift mastery bonuses in game
const skillsWithoutMastery = ['character', 'research'];

const thresholds = [150, 200, 300, 400, 500, 750, 1000];

const getBonusText = (skillName, bonusIndex) => {
  const extraSpecialBonus = extraSpecialBonuses?.[skillName]?.[bonusIndex];
  if (extraSpecialBonus) return extraSpecialBonus;
  if (bonusIndex === 1 && specialBonuses?.[skillName]) return specialBonuses[skillName];
  if (bonusIndex === 2 && passiveCardSkills.includes(skillName)) {
    return `ALL_${skillName.toUpperCase()}_CARDS_ARE_NOW_PASSIVE`;
  }
  return defaultBonuses[bonusIndex].replace('{', skillName);
}

const SkillMastery = ({ totalSkillsLevels, characters }) => {
  return <>
    <Typography variant={'h5'}>Skill level thresholds</Typography>
    <Stack sx={{ my: 2 }} direction={'row'} gap={2} flexWrap={'wrap'}>
      {thresholds?.map((threshold, index) => <Card key={index} sx={{ width: 100 }}>
        <CardContent>
          <Typography color={getSkillRankColor(threshold)}>Lv. {threshold}</Typography>
        </CardContent>
      </Card>)}
    </Stack>

    <Typography variant={'h5'}>Skills</Typography>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {Object.entries(totalSkillsLevels)?.map(([skillName, { icon, level, rank, color }]) => {
        if (skillsWithoutMastery.includes(skillName)) return null;
        return <Card key={skillName} sx={{
          width: 250,
          minHeight: 200,
          display: 'flex'
        }}>
          <CardContent sx={{ width: 300 }}>
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              <SkillIcon src={`${prefix}data/${icon}.png`}
                alt="" />
              <Stack>
                <Typography>{cleanUnderscore(skillName.capitalize())}</Typography>
                <Typography variant={'caption'} component={'span'} sx={{ color, fontWeight: 'bold' }}>Total
                  Level {level}</Typography>
              </Stack>
              <Tooltip title={<SkillBreakdown characters={characters} skillName={skillName} />}>
                <IconInfoCircleFilled style={{ marginLeft: 'auto' }} size={18} />
              </Tooltip>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack gap={1}>
              {defaultBonuses?.map((bonus, bonusIndex) => {
                const unlocked = rank > bonusIndex;
                const displayText = getBonusText(skillName, bonusIndex).toLowerCase().capitalizeAll();

                return (
                  <Typography
                    sx={{ opacity: unlocked ? 1 : .6 }}
                    key={`${skillName}-bonus-${bonusIndex}`}
                  >
                    {unlocked ? '' : `Lv. ${thresholds[bonusIndex]}: `}{cleanUnderscore(displayText)}
                  </Typography>
                );
              })}
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
      return <TitleAndValue key={name} title={name} value={`Lv. ${level}`} />
    })}
  </Stack>
}

const SkillIcon = styled.img`

`

export default SkillMastery;
