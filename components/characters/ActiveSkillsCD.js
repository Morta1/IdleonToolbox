import React, { useMemo } from "react";
import Timer from "components/common/Timer";
import styled from "@emotion/styled";
import { growth, prefix } from "utility/helpers";
import Tooltip from "../Tooltip";
import { TalentTooltip } from "../common/styles";
import { getPostOfficeBonus } from "parsers/postoffice";
import { Stack } from "@mui/material";

const relevantTalents = {
  32: true, // Printer_Go_Brr
  130: true, // Refinery_Throttle
  490: true, // Cranium,
  25: true // ITS_YOUR_BIRTHDAY!
};

const ActiveSkillsCD = ({ postOffice, talents, cooldowns, afkTime, lastUpdated }) => {
  const cooldownBonus = getPostOfficeBonus(postOffice, "Magician_Starterpack", 2);
  const cdReduction = Math.max(0, cooldownBonus);
  const getCooldowns = (cooldowns) => {
    return Object.entries(cooldowns)?.reduce((res, [tId, talentCd]) => {
      if (!relevantTalents[tId]) return res;
      const talent = talents?.find(({ talentId }) => parseInt(tId) === talentId);
      if (!talent) return res;
      const mainStat = growth(talent?.funcX, talent?.maxLevel, talent?.x1, talent?.x2);
      const secondaryStat = growth(talent?.funcY, talent?.maxLevel, talent?.y1, talent?.y2);
      const timePassed = (new Date().getTime() - afkTime) / 1000;
      const calculatedCooldown = (1 - cdReduction / 100) * talentCd;
      const actualCd = calculatedCooldown - timePassed;
      return [
        ...res,
        {
          ...talent,
          description: talent?.description.replace("{", mainStat).replace("}", secondaryStat),
          cd: actualCd < 0 ? actualCd : new Date().getTime() + actualCd * 1000
        }
      ];
    }, []);
  };
  const actualCooldowns = useMemo(() => getCooldowns(cooldowns), [cooldowns]);

  return actualCooldowns?.length ? (
    <Stack direction="row" gap={2}>
      {actualCooldowns?.map((skill, index) => {
        return (
          <Stack gap={1} direction="row" alignItems="center" className={"talent"} key={`${skill?.talentId}-${index}`}>
            <Tooltip title={<TalentTooltip {...skill} />}>
              <img src={`${prefix}data/UISkillIcon${skill?.talentId}.png`} alt=""/>
            </Tooltip>
            <Timer placeholder={<span style={{ color: "#51e406", fontWeight: "bold" }}>Ready</span>} type={"countdown"}
                   date={skill?.cd} lastUpdated={lastUpdated}/>
          </Stack>
        );
      })}
    </Stack>
  ) : null;
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
