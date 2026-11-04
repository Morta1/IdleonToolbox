import React from 'react';
import Timer from 'components/common/Timer';
import { TalentTooltip } from '../common/styles';
import StatusText from '@components/common/StatusText';
import { relevantTalents } from '../../parsers/talents';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';

const ActiveSkillsCD = ({ talents, cooldowns, afkTime, lastUpdated }) => {
  const now = lastUpdated ?? afkTime;
  const skills = Object.entries(cooldowns || {}).flatMap(([tId, talentCd]) => {
    const talent = relevantTalents[tId] ? talents?.find(({ talentId }) => parseInt(tId) === talentId) : null;
    if (!talent) return [];
    // The saved cooldown already has every reduction applied when the skill was cast
    const actualCd = talentCd - (now - afkTime) / 1000;
    return [{ ...talent, cd: actualCd < 0 ? actualCd : now + actualCd * 1000 }];
  });

  return skills.length ? <CardGrid size={'icon'} fill>
    {skills.map((skill) => <IconTile key={skill?.talentId} icon={`data/UISkillIcon${skill?.talentId}.png`} alt={skill?.name}
                                     details={<TalentTooltip {...skill}/>}
                                     value={<Timer placeholder={<StatusText status={'ready'}/>} type={'countdown'} component={'span'}
                                                   date={skill?.cd} lastUpdated={lastUpdated}/>}/>)}
  </CardGrid> : null;
};

export default ActiveSkillsCD;
