import React from 'react';
import Timer from 'components/common/Timer';
import { growth, prefix } from 'utility/helpers';
import Tooltip from '../Tooltip';
import { TalentTooltip } from '../common/styles';
import { Stack } from '@mui/material';
import { relevantTalents } from '../../parsers/talents';

const ActiveSkillsCD = ({ talents, cooldowns, afkTime, lastUpdated }) => {
  const getCooldowns = (cooldowns) => {
    return Object.entries(cooldowns || {})?.reduce((res, [tId, talentCd]) => {
      if (!relevantTalents[tId]) return res;
      const talent = talents?.find(({ talentId }) => parseInt(tId) === talentId);
      if (!talent) return res;
      const mainStat = growth(talent?.funcX, talent?.maxLevel, talent?.x1, talent?.x2);
      const secondaryStat = growth(talent?.funcY, talent?.maxLevel, talent?.y1, talent?.y2);
      const timePassed = (new Date().getTime() - afkTime) / 1000;
      // The saved cooldown already has every reduction applied when the skill was cast
      const actualCd = talentCd - timePassed;
      return [
        ...res,
        {
          ...talent,
          description: talent?.description.replace('{', mainStat).replace('}', secondaryStat),
          cd: actualCd < 0 ? actualCd : new Date().getTime() + actualCd * 1000
        }
      ];
    }, []);
  };
  const actualCooldowns = getCooldowns(cooldowns);

  return actualCooldowns?.length ? (
    <Stack direction="row" gap={2}>
      {actualCooldowns?.map((skill, index) => {
        return (
          <Stack gap={1} direction="row" alignItems="center" className={'talent'} key={`${skill?.talentId}-${index}`}>
            <Tooltip title={<TalentTooltip {...skill} />}>
              <img src={`${prefix}data/UISkillIcon${skill?.talentId}.png`} style={{ width: 56, height: 56 }} alt=""/>
            </Tooltip>
            <Timer placeholder={<span style={{ color: '#51e406', fontWeight: 'bold' }}>Ready</span>} type={'countdown'}
                   date={skill?.cd} lastUpdated={lastUpdated}/>
          </Stack>
        );
      })}
    </Stack>
  ) : null;
};

export default ActiveSkillsCD;
