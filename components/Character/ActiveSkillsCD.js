import styled from 'styled-components'
import { growth } from "../General/calculationHelper";
import React, { useMemo } from "react";
import { prefix } from "../../Utilities";
import TalentTooltip from "../Common/Tooltips/TalentTooltip";
import Timer from "../Common/Timer";

const ActiveSkillsCD = ({ postOffice, talents, cooldowns, afkTime, lastUpdated, relevantTalents }) => {
  const magicianBox = postOffice?.boxes?.find((box) => box.name === "Magician_Starterpack");
  const cooldownBonus = magicianBox?.upgrades?.find(({ bonus }) => bonus === '%_Faster_Cooldowns');
  const cdReduction = Math.max(0, growth(cooldownBonus?.func, magicianBox?.level - 100, cooldownBonus?.x1, cooldownBonus?.x2));
  const getCooldowns = (cooldowns) => {
    return Object.entries(cooldowns)?.reduce((res, [tId, talentCd]) => {
      if (!relevantTalents[tId]) return res;
      const talent = talents?.find(({ talentId }) => parseInt(tId) === talentId);
      if (!talent) return res;
      const mainStat = growth(talent?.funcX, talent?.maxLevel, talent?.x1, talent?.x2);
      const secondaryStat = growth(talent?.funcY, talent?.maxLevel, talent?.y1, talent?.y2);
      const timePassed = (new Date().getTime() - afkTime) / 1000;
      const calculatedCooldown = (1 - cdReduction / 100) * (talentCd);
      const actualCd = calculatedCooldown - timePassed;
      return [
        ...res,
        {
          ...talent,
          description: talent?.description.replace('{', mainStat).replace('}', secondaryStat),
          cd: actualCd < 0 ? actualCd : new Date().getTime() + (actualCd * 1000)
        }
      ]
    }, []);
  }
  const actualCooldowns = useMemo(() => getCooldowns(cooldowns), [cooldowns]);

  return (
    <ActiveSkillsCDStyle>
      {actualCooldowns?.map((skill, index) => {
        return <div className={'talent'} key={`${skill?.talentId}-${index}`}>
          <TalentTooltip {...skill}>
            <img src={`${prefix}data/UISkillIcon${skill?.talentId}.png`} alt=""/>
          </TalentTooltip>
          <Timer placeholder={<span style={{ color: '#51e406', fontWeight: 'bold' }}>Ready</span>}
                 type={'countdown'} date={skill?.cd} lastUpdated={lastUpdated}/>
        </div>
      })}
    </ActiveSkillsCDStyle>
  );
};

const ActiveSkillsCDStyle = styled.div`
  display: flex;
  justify-content: center;

  .talent {
    display: flex;
    align-items: center;
    gap: 15px;
  }
`;

export default ActiveSkillsCD;
